import { Prisma } from "@prisma/client";

import { badRequest, notFound } from "@/lib/api/errors";
import { prisma } from "@/lib/db/prisma";
import type { StockMovementCreateInput } from "@/lib/validators/scm";
import {
  buildPagination,
  consumeBatchesFifo,
  daysUntil,
  effectiveBatchStatus,
  generateDocumentNumber,
  parseDateInput,
} from "@/lib/services/scm/scm.utils";
import type {
  BatchDTO,
  BatchStatus,
  ProductCategory,
  ProductUnit,
  StockLevelDTO,
  StockLevelStatus,
  StockMovementDTO,
  StockMovementReason,
  StockMovementType,
} from "@/types/domain";

const batchInclude = {
  product: { select: { id: true, sku: true, name: true, unit: true } },
  supplier: { select: { id: true, name: true } },
  goodsReceipt: { select: { id: true, number: true } },
} satisfies Prisma.ProductBatchInclude;

const stockMovementInclude = {
  product: { select: { id: true, sku: true, name: true, unit: true } },
  batch: { select: { id: true, batchNumber: true } },
  createdBy: { select: { id: true, name: true } },
} satisfies Prisma.StockMovementInclude;

type BatchRecord = Prisma.ProductBatchGetPayload<{ include: typeof batchInclude }>;
type StockMovementRecord = Prisma.StockMovementGetPayload<{
  include: typeof stockMovementInclude;
}>;

export function mapBatch(batch: BatchRecord): BatchDTO {
  const status = effectiveBatchStatus(
    batch.status,
    batch.remainingQty,
    batch.expiryDate,
  );

  return {
    id: batch.id,
    batchNumber: batch.batchNumber,
    productId: batch.productId,
    sku: batch.product.sku,
    productName: batch.product.name,
    unit: batch.product.unit as ProductUnit,
    supplierId: batch.supplierId,
    supplierName: batch.supplier?.name ?? null,
    goodsReceiptId: batch.goodsReceiptId,
    goodsReceiptNumber: batch.goodsReceipt?.number ?? null,
    productionDate: batch.productionDate?.toISOString() ?? null,
    expiryDate: batch.expiryDate?.toISOString() ?? null,
    receivedQty: batch.receivedQty,
    remainingQty: batch.remainingQty,
    unitCost: batch.unitCost,
    status,
    daysToExpiry: daysUntil(batch.expiryDate),
    createdAt: batch.createdAt.toISOString(),
  };
}

export function mapStockMovement(movement: StockMovementRecord): StockMovementDTO {
  return {
    id: movement.id,
    reference: movement.reference,
    productId: movement.productId,
    sku: movement.product.sku,
    productName: movement.product.name,
    unit: movement.product.unit as ProductUnit,
    type: movement.type as StockMovementType,
    reason: movement.reason as StockMovementReason,
    quantity: movement.quantity,
    stockBefore: movement.stockBefore,
    stockAfter: movement.stockAfter,
    unitCost: movement.unitCost,
    batchId: movement.batchId,
    batchNumber: movement.batch?.batchNumber ?? null,
    purchaseOrderId: movement.purchaseOrderId,
    goodsReceiptId: movement.goodsReceiptId,
    note: movement.note,
    occurredAt: movement.occurredAt.toISOString(),
    createdBy: movement.createdBy
      ? { id: movement.createdBy.id, name: movement.createdBy.name }
      : null,
    createdAt: movement.createdAt.toISOString(),
  };
}

function stockStatus(stockQty: number, minStockQty: number): StockLevelStatus {
  if (stockQty <= 0) return "out";
  if (stockQty <= minStockQty) return "low";
  return "healthy";
}

function mapStockLevel(
  product: Prisma.ProductGetPayload<{
    include: { batches: { select: { expiryDate: true; remainingQty: true; status: true } } };
  }>,
): StockLevelDTO {
  const activeBatches = product.batches.filter(
    (batch) => batch.remainingQty > 0 && batch.status !== "disposed",
  );
  const expiries = activeBatches
    .map((batch) => batch.expiryDate)
    .filter((date): date is Date => Boolean(date))
    .sort((a, b) => a.getTime() - b.getTime());

  return {
    productId: product.id,
    sku: product.sku,
    name: product.name,
    category: product.category as ProductCategory,
    unit: product.unit as ProductUnit,
    costPrice: product.costPrice,
    stockQty: product.stockQty,
    minStockQty: product.minStockQty,
    status: stockStatus(product.stockQty, product.minStockQty),
    stockValue: product.stockQty * product.costPrice,
    activeBatches: activeBatches.length,
    nearestExpiry: expiries[0]?.toISOString() ?? null,
    updatedAt: product.updatedAt.toISOString(),
  };
}

const stockLevelInclude = {
  batches: {
    select: { expiryDate: true, remainingQty: true, status: true },
    where: { remainingQty: { gt: 0 } },
  },
} satisfies Prisma.ProductInclude;

export interface ListStockLevelsParams {
  search?: string;
  category?: ProductCategory;
  status?: "all" | StockLevelStatus;
  page: number;
  pageSize: number;
  skip: number;
}

export async function listStockLevels(params: ListStockLevelsParams) {
  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      ...(params.category ? { category: params.category } : {}),
      ...(params.search
        ? {
            OR: [
              { name: { contains: params.search } },
              { sku: { contains: params.search } },
            ],
          }
        : {}),
    },
    include: stockLevelInclude,
    orderBy: [{ stockQty: "asc" }, { name: "asc" }],
  });

  const mapped = products.map(mapStockLevel);
  const filtered =
    params.status && params.status !== "all"
      ? mapped.filter((item) => item.status === params.status)
      : mapped;

  return {
    items: filtered.slice(params.skip, params.skip + params.pageSize),
    meta: buildPagination(params.page, params.pageSize, filtered.length),
  };
}

export async function getStockLevel(productId: string): Promise<StockLevelDTO> {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: stockLevelInclude,
  });
  if (!product) {
    throw notFound("Produk tidak ditemukan.");
  }
  return mapStockLevel(product);
}

export async function getStockSummary() {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    select: { stockQty: true, minStockQty: true, costPrice: true },
  });

  let lowStock = 0;
  let outOfStock = 0;
  let totalValue = 0;

  for (const product of products) {
    const status = stockStatus(product.stockQty, product.minStockQty);
    if (status === "out") outOfStock += 1;
    if (status === "low") lowStock += 1;
    totalValue += product.stockQty * product.costPrice;
  }

  return {
    totalSkus: products.length,
    lowStockProducts: lowStock,
    outOfStockProducts: outOfStock,
    totalStockValue: totalValue,
  };
}

export interface ListBatchesParams {
  search?: string;
  productId?: string;
  status?: "all" | "active" | "expiring" | "expired" | "depleted";
  page: number;
  pageSize: number;
  skip: number;
}

const EXPIRING_THRESHOLD_DAYS = 30;

export async function listBatches(params: ListBatchesParams) {
  const batches = await prisma.productBatch.findMany({
    where: {
      ...(params.productId ? { productId: params.productId } : {}),
      ...(params.search
        ? {
            OR: [
              { batchNumber: { contains: params.search } },
              { product: { is: { name: { contains: params.search } } } },
              { product: { is: { sku: { contains: params.search } } } },
            ],
          }
        : {}),
    },
    include: batchInclude,
    orderBy: [{ expiryDate: "asc" }, { createdAt: "desc" }],
  });

  const mapped = batches.map(mapBatch);
  const filtered = mapped.filter((batch) => {
    if (!params.status || params.status === "all") return true;
    if (params.status === "active") return batch.status === "active";
    if (params.status === "depleted") return batch.status === "depleted";
    if (params.status === "expired") {
      return batch.remainingQty > 0 && batch.daysToExpiry !== null && batch.daysToExpiry < 0;
    }
    if (params.status === "expiring") {
      return (
        batch.remainingQty > 0 &&
        batch.daysToExpiry !== null &&
        batch.daysToExpiry >= 0 &&
        batch.daysToExpiry <= EXPIRING_THRESHOLD_DAYS
      );
    }
    return true;
  });

  filtered.sort((a, b) => {
    const aTime = a.expiryDate ? new Date(a.expiryDate).getTime() : Number.MAX_SAFE_INTEGER;
    const bTime = b.expiryDate ? new Date(b.expiryDate).getTime() : Number.MAX_SAFE_INTEGER;
    return aTime - bTime;
  });

  return {
    items: filtered.slice(params.skip, params.skip + params.pageSize),
    meta: buildPagination(params.page, params.pageSize, filtered.length),
  };
}

export async function listBatchOptions(productId: string) {
  const batches = await prisma.productBatch.findMany({
    where: { productId, remainingQty: { gt: 0 }, status: "active" },
    orderBy: { expiryDate: "asc" },
    select: {
      id: true,
      batchNumber: true,
      remainingQty: true,
      expiryDate: true,
    },
  });

  return batches.map((batch) => ({
    ...batch,
    expiryDate: batch.expiryDate?.toISOString() ?? null,
  }));
}

export async function getBatchSummary() {
  const batches = await prisma.productBatch.findMany({
    select: { remainingQty: true, expiryDate: true, status: true },
  });

  let active = 0;
  let expiring = 0;
  let expired = 0;

  for (const batch of batches) {
    const status = effectiveBatchStatus(
      batch.status,
      batch.remainingQty,
      batch.expiryDate,
    );
    const days = daysUntil(batch.expiryDate);
    if (status === "active") {
      active += 1;
      if (days !== null && days >= 0 && days <= EXPIRING_THRESHOLD_DAYS) {
        expiring += 1;
      }
    }
    if (status === "expired") expired += 1;
  }

  return { activeBatches: active, expiringBatches: expiring, expiredBatches: expired };
}

export interface ListStockMovementsParams {
  search?: string;
  productId?: string;
  type?: StockMovementType;
  reason?: StockMovementReason;
  from?: Date;
  to?: Date;
  page: number;
  pageSize: number;
  skip: number;
}

export async function listStockMovements(params: ListStockMovementsParams) {
  const where: Prisma.StockMovementWhereInput = {
    ...(params.productId ? { productId: params.productId } : {}),
    ...(params.type ? { type: params.type } : {}),
    ...(params.reason ? { reason: params.reason } : {}),
    ...(params.from || params.to
      ? {
          occurredAt: {
            ...(params.from ? { gte: params.from } : {}),
            ...(params.to ? { lte: params.to } : {}),
          },
        }
      : {}),
    ...(params.search
      ? {
          OR: [
            { reference: { contains: params.search } },
            { note: { contains: params.search } },
            { batch: { is: { batchNumber: { contains: params.search } } } },
            { product: { is: { name: { contains: params.search } } } },
            { product: { is: { sku: { contains: params.search } } } },
          ],
        }
      : {}),
  };

  const [total, movements] = await Promise.all([
    prisma.stockMovement.count({ where }),
    prisma.stockMovement.findMany({
      where,
      include: stockMovementInclude,
      orderBy: [{ occurredAt: "desc" }, { createdAt: "desc" }],
      skip: params.skip,
      take: params.pageSize,
    }),
  ]);

  return {
    items: movements.map(mapStockMovement),
    meta: buildPagination(params.page, params.pageSize, total),
  };
}

export async function listRecentStockMovements(limit = 5) {
  const movements = await prisma.stockMovement.findMany({
    include: stockMovementInclude,
    orderBy: [{ occurredAt: "desc" }, { createdAt: "desc" }],
    take: limit,
  });
  return movements.map(mapStockMovement);
}

const ALLOWED_IN_REASONS: StockMovementReason[] = [
  "manual_in",
  "return",
  "initial_stock",
];
const ALLOWED_OUT_REASONS: StockMovementReason[] = [
  "sale",
  "manual_out",
  "damage",
  "expired",
  "return",
];

export async function createStockMovement(
  input: StockMovementCreateInput,
  actor: { id: string; role: string },
): Promise<StockMovementDTO> {
  const occurredAt = parseDateInput(input.occurredAt, new Date()) ?? new Date();

  return prisma.$transaction(
    async (tx) => {
      const product = await tx.product.findUnique({
        where: { id: input.productId },
        select: {
          id: true,
          name: true,
          unit: true,
          stockQty: true,
          costPrice: true,
          isActive: true,
        },
      });
      if (!product) {
        throw notFound("Produk tidak ditemukan.");
      }
      if (!product.isActive) {
        throw badRequest("Produk nonaktif tidak dapat dimutasi stoknya.");
      }

      let reason: StockMovementReason;
      let delta: number;

      if (input.type === "in") {
        reason = input.reason ?? "manual_in";
        if (!ALLOWED_IN_REASONS.includes(reason)) {
          throw badRequest("Alasan barang masuk tidak sesuai untuk mutasi manual.");
        }
        delta = Math.abs(input.quantity);
      } else if (input.type === "out") {
        reason = input.reason ?? "manual_out";
        if (!ALLOWED_OUT_REASONS.includes(reason)) {
          throw badRequest("Alasan barang keluar tidak sesuai.");
        }
        delta = -Math.abs(input.quantity);
      } else {
        reason = "adjustment";
        delta = input.quantity;
      }

      const stockBefore = product.stockQty;
      const stockAfter = stockBefore + delta;
      if (stockAfter < 0) {
        throw badRequest(
          `Stok ${product.name} tidak mencukupi. Stok saat ini ${stockBefore}.`,
        );
      }

      let batchId: string | null = null;
      let batchNote: string | null = null;

      if (delta > 0 && input.batchNumber) {
        const existingBatch = await tx.productBatch.findUnique({
          where: {
            productId_batchNumber: {
              productId: product.id,
              batchNumber: input.batchNumber,
            },
          },
          select: { id: true },
        });
        if (existingBatch) {
          throw badRequest(
            `Batch ${input.batchNumber} sudah ada untuk produk ini. Gunakan nomor batch lain.`,
          );
        }

        const batch = await tx.productBatch.create({
          data: {
            batchNumber: input.batchNumber,
            productId: product.id,
            productionDate: parseDateInput(input.productionDate),
            expiryDate: parseDateInput(input.expiryDate),
            receivedQty: delta,
            remainingQty: delta,
            unitCost: input.unitCost ?? product.costPrice,
            status: "active",
          },
        });
        batchId = batch.id;
      }

      if (delta < 0) {
        const qty = Math.abs(delta);
        if (input.batchId) {
          const batch = await tx.productBatch.findUnique({
            where: { id: input.batchId },
            select: {
              id: true,
              productId: true,
              batchNumber: true,
              remainingQty: true,
            },
          });
          if (!batch || batch.productId !== product.id) {
            throw badRequest("Batch yang dipilih tidak sesuai dengan produk.");
          }
          if (batch.remainingQty < qty) {
            throw badRequest(
              `Sisa batch ${batch.batchNumber} hanya ${batch.remainingQty}, tidak cukup untuk keluar ${qty}.`,
            );
          }
          const nextRemaining = batch.remainingQty - qty;
          await tx.productBatch.update({
            where: { id: batch.id },
            data: {
              remainingQty: nextRemaining,
              status: nextRemaining <= 0 ? "depleted" : "active",
            },
          });
          batchId = batch.id;
        } else {
          const consumed = await consumeBatchesFifo(tx, product.id, qty);
          if (consumed.length === 1) {
            batchId = consumed[0].batchId;
          } else if (consumed.length > 1) {
            batchNote = `FIFO ${consumed.length} batch: ${consumed
              .map((item) => `${item.batchNumber} (${item.quantity})`)
              .join(", ")}`;
          }
        }
      }

      await tx.product.update({
        where: { id: product.id },
        data: { stockQty: stockAfter },
      });

      const movement = await tx.stockMovement.create({
        data: {
          reference: generateDocumentNumber("MOV", occurredAt),
          productId: product.id,
          type: input.type,
          reason,
          quantity: delta,
          stockBefore,
          stockAfter,
          unitCost: input.unitCost ?? (delta > 0 ? product.costPrice : null),
          batchId,
          note: [input.note, batchNote].filter(Boolean).join(" · ") || null,
          occurredAt,
          createdById: actor.id,
        },
        include: stockMovementInclude,
      });

      return mapStockMovement(movement);
    },
    { timeout: 15_000 },
  );
}

export function batchStatusOf(batch: {
  remainingQty: number;
  expiryDate: Date | null;
  status: string;
}): BatchStatus {
  return effectiveBatchStatus(batch.status, batch.remainingQty, batch.expiryDate);
}
