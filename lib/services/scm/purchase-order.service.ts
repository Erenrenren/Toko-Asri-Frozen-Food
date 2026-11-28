import { Prisma } from "@prisma/client";

import { badRequest, forbidden, notFound } from "@/lib/api/errors";
import { prisma } from "@/lib/db/prisma";
import type {
  GoodsReceiptCreateInput,
  PurchaseOrderCreateInput,
} from "@/lib/validators/scm";
import {
  addDays,
  buildPagination,
  generateDocumentNumber,
  parseDateInput,
} from "@/lib/services/scm/scm.utils";
import type {
  GoodsReceiptDTO,
  ProductUnit,
  PurchaseOrderDTO,
  PurchaseOrderStatus,
  Role,
} from "@/types/domain";

const productSummarySelect = {
  id: true,
  sku: true,
  name: true,
  unit: true,
  shelfLifeDays: true,
} satisfies Prisma.ProductSelect;

export const purchaseOrderInclude = {
  supplier: {
    select: {
      id: true,
      code: true,
      name: true,
      phone: true,
      leadTimeDays: true,
      isActive: true,
    },
  },
  createdBy: {
    select: { id: true, name: true },
  },
  items: {
    include: { product: { select: productSummarySelect } },
    orderBy: { product: { name: "asc" } },
  },
  receipts: {
    include: {
      receivedBy: { select: { id: true, name: true } },
      items: {
        include: { product: { select: productSummarySelect } },
        orderBy: { product: { name: "asc" } },
      },
    },
    orderBy: { receivedAt: "desc" },
  },
} satisfies Prisma.PurchaseOrderInclude;

export type PurchaseOrderRecord = Prisma.PurchaseOrderGetPayload<{
  include: typeof purchaseOrderInclude;
}>;

type GoodsReceiptRecord = PurchaseOrderRecord["receipts"][number];

export function mapGoodsReceipt(receipt: GoodsReceiptRecord): GoodsReceiptDTO {
  return {
    id: receipt.id,
    number: receipt.number,
    purchaseOrderId: receipt.purchaseOrderId,
    receivedAt: receipt.receivedAt.toISOString(),
    totalValue: receipt.totalValue,
    notes: receipt.notes,
    receivedBy: receipt.receivedBy
      ? { id: receipt.receivedBy.id, name: receipt.receivedBy.name }
      : null,
    items: receipt.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      sku: item.product.sku,
      name: item.product.name,
      quantity: item.quantity,
      unitCost: item.unitCost,
      subtotal: item.subtotal,
      batchNumber: item.batchNumber,
      productionDate: item.productionDate?.toISOString() ?? null,
      expiryDate: item.expiryDate?.toISOString() ?? null,
    })),
  };
}

export function mapPurchaseOrder(order: PurchaseOrderRecord): PurchaseOrderDTO {
  const orderedQty = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const receivedQty = order.items.reduce(
    (sum, item) => sum + item.receivedQty,
    0,
  );

  return {
    id: order.id,
    number: order.number,
    status: order.status as PurchaseOrderStatus,
    orderDate: order.orderDate.toISOString(),
    expectedDate: order.expectedDate?.toISOString() ?? null,
    receivedAt: order.receivedAt?.toISOString() ?? null,
    subtotal: order.subtotal,
    shippingCost: order.shippingCost,
    totalAmount: order.totalAmount,
    notes: order.notes,
    supplier: {
      id: order.supplier.id,
      code: order.supplier.code,
      name: order.supplier.name,
      phone: order.supplier.phone,
      leadTimeDays: order.supplier.leadTimeDays,
      isActive: order.supplier.isActive,
    },
    items: order.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      sku: item.product.sku,
      name: item.product.name,
      unit: item.product.unit as ProductUnit,
      shelfLifeDays: item.product.shelfLifeDays,
      quantity: item.quantity,
      unitCost: item.unitCost,
      subtotal: item.subtotal,
      receivedQty: item.receivedQty,
      remainingQty: Math.max(0, item.quantity - item.receivedQty),
    })),
    receipts: order.receipts.map(mapGoodsReceipt),
    progress: {
      orderedQty,
      receivedQty,
      percent:
        orderedQty > 0 ? Math.round((receivedQty / orderedQty) * 100) : 0,
    },
    createdBy: order.createdBy
      ? { id: order.createdBy.id, name: order.createdBy.name }
      : null,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
  };
}

export interface ListPurchaseOrdersParams {
  search?: string;
  status?: PurchaseOrderStatus;
  supplierId?: string;
  from?: Date;
  to?: Date;
  page: number;
  pageSize: number;
  skip: number;
}

export async function listPurchaseOrders(params: ListPurchaseOrdersParams) {
  const where: Prisma.PurchaseOrderWhereInput = {
    ...(params.status ? { status: params.status } : {}),
    ...(params.supplierId ? { supplierId: params.supplierId } : {}),
    ...(params.from || params.to
      ? {
          orderDate: {
            ...(params.from ? { gte: params.from } : {}),
            ...(params.to ? { lte: params.to } : {}),
          },
        }
      : {}),
    ...(params.search
      ? {
          OR: [
            { number: { contains: params.search } },
            { notes: { contains: params.search } },
            { supplier: { is: { name: { contains: params.search } } } },
            { supplier: { is: { code: { contains: params.search } } } },
          ],
        }
      : {}),
  };

  const [total, orders] = await Promise.all([
    prisma.purchaseOrder.count({ where }),
    prisma.purchaseOrder.findMany({
      where,
      include: purchaseOrderInclude,
      orderBy: [{ orderDate: "desc" }, { createdAt: "desc" }],
      skip: params.skip,
      take: params.pageSize,
    }),
  ]);

  return {
    items: orders.map(mapPurchaseOrder),
    meta: buildPagination(params.page, params.pageSize, total),
  };
}

export async function getPurchaseOrderById(id: string): Promise<PurchaseOrderDTO> {
  const order = await prisma.purchaseOrder.findUnique({
    where: { id },
    include: purchaseOrderInclude,
  });
  if (!order) {
    throw notFound("Purchase order tidak ditemukan.");
  }
  return mapPurchaseOrder(order);
}

export async function createPurchaseOrder(
  input: PurchaseOrderCreateInput,
  actor: { id: string; role: Role },
): Promise<PurchaseOrderDTO> {
  const supplier = await prisma.supplier.findUnique({
    where: { id: input.supplierId },
    select: { id: true, name: true, isActive: true, leadTimeDays: true },
  });
  if (!supplier) {
    throw notFound("Supplier tidak ditemukan.");
  }
  if (!supplier.isActive && input.status === "ordered") {
    throw badRequest("Supplier nonaktif tidak dapat dikirimi purchase order.");
  }

  const productIds = input.items.map((item) => item.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, name: true, isActive: true },
  });
  if (products.length !== productIds.length) {
    throw badRequest("Ada produk pada purchase order yang tidak ditemukan.");
  }
  if (productIds.length !== new Set(productIds).size) {
    throw badRequest("Produk yang sama tidak boleh dipilih dua kali.");
  }
  if (products.some((product) => !product.isActive)) {
    throw badRequest("Produk nonaktif tidak dapat dipesan.");
  }

  const subtotal = input.items.reduce(
    (sum, item) => sum + item.quantity * item.unitCost,
    0,
  );
  const expectedDate = parseDateInput(
    input.expectedDate,
    addDays(new Date(), Math.max(0, supplier.leadTimeDays)),
  );

  const order = await prisma.purchaseOrder.create({
    data: {
      number: generateDocumentNumber("PO"),
      supplierId: input.supplierId,
      status: input.status,
      expectedDate,
      subtotal,
      shippingCost: input.shippingCost,
      totalAmount: subtotal + input.shippingCost,
      notes: input.notes ?? null,
      createdById: actor.id,
      items: {
        create: input.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitCost: item.unitCost,
          subtotal: item.quantity * item.unitCost,
        })),
      },
    },
    include: purchaseOrderInclude,
  });

  return mapPurchaseOrder(order);
}

export async function submitPurchaseOrder(
  id: string,
  actor: { id: string; role: Role },
): Promise<PurchaseOrderDTO> {
  void actor;
  const order = await prisma.purchaseOrder.findUnique({
    where: { id },
    select: { status: true },
  });
  if (!order) {
    throw notFound("Purchase order tidak ditemukan.");
  }
  if (order.status !== "draft") {
    throw badRequest("Hanya purchase order berstatus draft yang dapat dikirim.");
  }

  const updated = await prisma.purchaseOrder.update({
    where: { id },
    data: { status: "ordered" },
    include: purchaseOrderInclude,
  });

  return mapPurchaseOrder(updated);
}

export async function cancelPurchaseOrder(
  id: string,
  actor: { id: string; role: Role },
): Promise<PurchaseOrderDTO> {
  if (actor.role !== "admin") {
    throw forbidden("Hanya admin yang dapat membatalkan purchase order.");
  }

  const order = await prisma.purchaseOrder.findUnique({
    where: { id },
    select: { status: true, _count: { select: { receipts: true } } },
  });
  if (!order) {
    throw notFound("Purchase order tidak ditemukan.");
  }
  if (order.status === "cancelled") {
    throw badRequest("Purchase order sudah dibatalkan.");
  }
  if (
    order.status === "received" ||
    order.status === "partially_received" ||
    order._count.receipts > 0
  ) {
    throw badRequest(
      "Purchase order yang sudah memiliki penerimaan barang tidak dapat dibatalkan.",
    );
  }

  const updated = await prisma.purchaseOrder.update({
    where: { id },
    data: { status: "cancelled" },
    include: purchaseOrderInclude,
  });

  return mapPurchaseOrder(updated);
}

export interface ReceivePurchaseOrderResult {
  receipt: GoodsReceiptDTO;
  purchaseOrder: PurchaseOrderDTO;
  financialTransactionCode: string;
}

/**
 * Penerimaan barang:
 * 1. Menambah Product.stockQty dan membuat ProductBatch.
 * 2. Mencatat StockMovement tipe `in` (audit cold-chain).
 * 3. Mencatat FinancialTransaction pengeluaran kategori `purchase` (source scm).
 * Semua dalam satu transaksi database agar tidak ada stok tanpa jurnal.
 */
export async function receivePurchaseOrder(
  id: string,
  input: GoodsReceiptCreateInput,
  actor: { id: string; role: Role },
): Promise<ReceivePurchaseOrderResult> {
  const receivedAt = parseDateInput(input.receivedAt, new Date()) ?? new Date();

  return prisma.$transaction(
    async (tx) => {
      const order = await tx.purchaseOrder.findUnique({
        where: { id },
        include: {
          items: true,
          supplier: { select: { id: true, name: true } },
        },
      });
      if (!order) {
        throw notFound("Purchase order tidak ditemukan.");
      }
      if (order.status !== "ordered" && order.status !== "partially_received") {
        throw badRequest(
          "Barang hanya dapat diterima untuk PO berstatus dikirim atau diterima sebagian.",
        );
      }

      const itemMap = new Map(order.items.map((item) => [item.id, item]));
      const receiptItems = input.items.filter((item) => item.quantity > 0);

      if (receiptItems.length === 0) {
        throw badRequest("Isi jumlah barang yang diterima minimal 1 unit.");
      }

      for (const item of receiptItems) {
        const poItem = itemMap.get(item.purchaseOrderItemId);
        if (!poItem) {
          throw badRequest(
            "Ada item penerimaan yang tidak berasal dari purchase order ini.",
          );
        }
        const remaining = poItem.quantity - poItem.receivedQty;
        if (item.quantity > remaining) {
          throw badRequest(
            `Jumlah penerimaan melebihi sisa pesanan untuk salah satu produk (sisa ${remaining}).`,
          );
        }
        if (!item.batchNumber) {
          throw badRequest("Nomor batch wajib diisi untuk setiap barang yang diterima.");
        }
      }

      const totalValue = receiptItems.reduce((sum, item) => {
        const poItem = itemMap.get(item.purchaseOrderItemId);
        return sum + item.quantity * (poItem?.unitCost ?? 0);
      }, 0);

      if (totalValue <= 0) {
        throw badRequest("Nilai penerimaan barang harus lebih dari 0.");
      }

      const receiptNumber = generateDocumentNumber("GR", receivedAt);
      const receipt = await tx.goodsReceipt.create({
        data: {
          number: receiptNumber,
          purchaseOrderId: order.id,
          receivedById: actor.id,
          receivedAt,
          totalValue,
          notes: input.notes ?? null,
          items: {
            create: receiptItems.map((item) => {
              const poItem = itemMap.get(item.purchaseOrderItemId)!;
              return {
                productId: poItem.productId,
                quantity: item.quantity,
                unitCost: poItem.unitCost,
                subtotal: item.quantity * poItem.unitCost,
                batchNumber: item.batchNumber ?? null,
                productionDate: parseDateInput(item.productionDate),
                expiryDate: parseDateInput(item.expiryDate),
              };
            }),
          },
        },
        include: {
          receivedBy: { select: { id: true, name: true } },
          items: {
            include: { product: { select: productSummarySelect } },
            orderBy: { product: { name: "asc" } },
          },
        },
      });

      const updatedReceived = new Map<string, number>();

      for (const item of receiptItems) {
        const poItem = itemMap.get(item.purchaseOrderItemId)!;
        const product = await tx.product.findUnique({
          where: { id: poItem.productId },
          select: { id: true, stockQty: true, costPrice: true },
        });
        if (!product) {
          throw notFound("Produk pada purchase order tidak ditemukan.");
        }

        const stockBefore = product.stockQty;
        const stockAfter = stockBefore + item.quantity;
        await tx.product.update({
          where: { id: product.id },
          data: { stockQty: stockAfter },
        });

        const batch = await tx.productBatch.create({
          data: {
            batchNumber: item.batchNumber!,
            productId: product.id,
            supplierId: order.supplierId,
            goodsReceiptId: receipt.id,
            productionDate: parseDateInput(item.productionDate),
            expiryDate: parseDateInput(item.expiryDate),
            receivedQty: item.quantity,
            remainingQty: item.quantity,
            unitCost: poItem.unitCost,
            status: "active",
          },
        });

        await tx.stockMovement.create({
          data: {
            reference: generateDocumentNumber("MOV", receivedAt),
            productId: product.id,
            type: "in",
            reason: "purchase_receipt",
            quantity: item.quantity,
            stockBefore,
            stockAfter,
            unitCost: poItem.unitCost,
            batchId: batch.id,
            purchaseOrderId: order.id,
            goodsReceiptId: receipt.id,
            note: `Penerimaan ${receipt.number} dari ${order.supplier.name}`,
            occurredAt: receivedAt,
            createdById: actor.id,
          },
        });

        const nextReceived = poItem.receivedQty + item.quantity;
        updatedReceived.set(poItem.id, nextReceived);
        await tx.purchaseOrderItem.update({
          where: { id: poItem.id },
          data: { receivedQty: nextReceived },
        });

        await tx.supplierProduct.updateMany({
          where: { supplierId: order.supplierId, productId: product.id },
          data: { lastPrice: poItem.unitCost },
        });
      }

      const allReceived = order.items.every((item) => {
        const received = updatedReceived.get(item.id) ?? item.receivedQty;
        return received >= item.quantity;
      });

      const updatedOrder = await tx.purchaseOrder.update({
        where: { id: order.id },
        data: {
          status: allReceived ? "received" : "partially_received",
          receivedAt: allReceived ? receivedAt : null,
        },
        include: purchaseOrderInclude,
      });

      const financialTransactionCode = generateDocumentNumber("TRX", receivedAt);
      await tx.financialTransaction.create({
        data: {
          code: financialTransactionCode,
          type: "expense",
          category: "purchase",
          amount: totalValue,
          description: `Pembelian restock ${order.number} — ${order.supplier.name} (${receipt.number})`,
          occurredAt: receivedAt,
          source: "scm",
          status: "posted",
          externalRef: order.number,
          createdById: actor.id,
        },
      });

      return {
        receipt: mapGoodsReceipt(receipt),
        purchaseOrder: mapPurchaseOrder(updatedOrder),
        financialTransactionCode,
      };
    },
    { timeout: 20_000 },
  );
}
