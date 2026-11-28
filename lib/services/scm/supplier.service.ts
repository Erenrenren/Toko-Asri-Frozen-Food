import { randomBytes } from "crypto";

import { Prisma } from "@prisma/client";

import { badRequest, notFound } from "@/lib/api/errors";
import { prisma } from "@/lib/db/prisma";
import type {
  SupplierCreateInput,
  SupplierUpdateInput,
} from "@/lib/validators/scm";
import {
  buildPagination,
  normalizeDeliveryDays,
  serializeDeliveryDays,
} from "@/lib/services/scm/scm.utils";
import type {
  ProductUnit,
  SupplierDTO,
  SupplierDeliveryDay,
} from "@/types/domain";

export const supplierInclude = {
  products: {
    include: {
      product: {
        select: { id: true, sku: true, name: true, unit: true },
      },
    },
    orderBy: { createdAt: "asc" },
  },
  purchaseOrders: {
    select: { status: true },
  },
} satisfies Prisma.SupplierInclude;

export type SupplierRecord = Prisma.SupplierGetPayload<{
  include: typeof supplierInclude;
}>;

export function mapSupplier(supplier: SupplierRecord): SupplierDTO {
  return {
    id: supplier.id,
    code: supplier.code,
    name: supplier.name,
    contactName: supplier.contactName,
    phone: supplier.phone,
    email: supplier.email,
    address: supplier.address,
    city: supplier.city,
    paymentTermDays: supplier.paymentTermDays,
    leadTimeDays: supplier.leadTimeDays,
    deliveryDays: normalizeDeliveryDays(
      supplier.deliveryDays,
    ) as SupplierDeliveryDay[],
    minimumOrder: supplier.minimumOrder,
    notes: supplier.notes,
    isActive: supplier.isActive,
    suppliedProducts: supplier.products.map((link) => ({
      productId: link.productId,
      sku: link.product.sku,
      name: link.product.name,
      unit: link.product.unit as ProductUnit,
      supplierSku: link.supplierSku,
      lastPrice: link.lastPrice,
      isPreferred: link.isPreferred,
    })),
    purchaseOrderCount: supplier.purchaseOrders.length,
    openPurchaseOrderCount: supplier.purchaseOrders.filter(
      (po) => po.status === "ordered" || po.status === "partially_received",
    ).length,
    createdAt: supplier.createdAt.toISOString(),
    updatedAt: supplier.updatedAt.toISOString(),
  };
}

export interface ListSuppliersParams {
  search?: string;
  status?: "active" | "inactive" | "all";
  page: number;
  pageSize: number;
  skip: number;
}

export async function listSuppliers(params: ListSuppliersParams) {
  const where: Prisma.SupplierWhereInput = {
    ...(params.status === "active"
      ? { isActive: true }
      : params.status === "inactive"
        ? { isActive: false }
        : {}),
    ...(params.search
      ? {
          OR: [
            { name: { contains: params.search } },
            { code: { contains: params.search } },
            { contactName: { contains: params.search } },
            { city: { contains: params.search } },
          ],
        }
      : {}),
  };

  const [total, suppliers] = await Promise.all([
    prisma.supplier.count({ where }),
    prisma.supplier.findMany({
      where,
      include: supplierInclude,
      orderBy: [{ isActive: "desc" }, { name: "asc" }],
      skip: params.skip,
      take: params.pageSize,
    }),
  ]);

  return {
    items: suppliers.map(mapSupplier),
    meta: buildPagination(params.page, params.pageSize, total),
  };
}

export async function getSupplierById(id: string): Promise<SupplierDTO> {
  const supplier = await prisma.supplier.findUnique({
    where: { id },
    include: supplierInclude,
  });
  if (!supplier) {
    throw notFound("Supplier tidak ditemukan.");
  }
  return mapSupplier(supplier);
}

async function generateSupplierCode(): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const code = `SUP-${randomBytes(2).toString("hex").toUpperCase()}`;
    const existing = await prisma.supplier.findUnique({
      where: { code },
      select: { id: true },
    });
    if (!existing) return code;
  }
  return `SUP-${randomBytes(4).toString("hex").toUpperCase()}`;
}

async function assertUniqueName(name: string, excludeId?: string) {
  const target = name.trim().toLowerCase();
  const candidates = await prisma.supplier.findMany({
    where: { name: { contains: name.trim() } },
    select: { id: true, name: true },
  });
  const duplicate = candidates.find(
    (item) =>
      item.id !== excludeId && item.name.trim().toLowerCase() === target,
  );
  if (duplicate) {
    throw badRequest(`Supplier dengan nama "${name.trim()}" sudah terdaftar.`);
  }
}

async function resolveProductLinks(
  links: NonNullable<SupplierCreateInput["products"]>,
) {
  if (links.length === 0) return [];

  const uniqueIds = Array.from(new Set(links.map((link) => link.productId)));
  const products = await prisma.product.findMany({
    where: { id: { in: uniqueIds } },
    select: { id: true, costPrice: true },
  });
  const productMap = new Map(products.map((product) => [product.id, product]));

  if (products.length !== uniqueIds.length) {
    throw badRequest("Ada produk yang tidak ditemukan saat menghubungkan supplier.");
  }

  return links.map((link) => {
    const product = productMap.get(link.productId);
    return {
      productId: link.productId,
      supplierSku: link.supplierSku ?? null,
      lastPrice: link.lastPrice ?? product?.costPrice ?? null,
      isPreferred: link.isPreferred ?? false,
    };
  });
}

export async function createSupplier(
  input: SupplierCreateInput,
): Promise<SupplierDTO> {
  await assertUniqueName(input.name);
  const code = await generateSupplierCode();
  const links = await resolveProductLinks(input.products);

  const supplier = await prisma.supplier.create({
    data: {
      code,
      name: input.name,
      contactName: input.contactName ?? null,
      phone: input.phone ?? null,
      email: input.email ?? null,
      address: input.address ?? null,
      city: input.city ?? null,
      paymentTermDays: input.paymentTermDays,
      leadTimeDays: input.leadTimeDays,
      deliveryDays: serializeDeliveryDays(input.deliveryDays),
      minimumOrder: input.minimumOrder,
      notes: input.notes ?? null,
      isActive: input.isActive,
      products: {
        create: links,
      },
    },
    include: supplierInclude,
  });

  return mapSupplier(supplier);
}

export async function updateSupplier(
  id: string,
  input: SupplierUpdateInput,
): Promise<SupplierDTO> {
  const existing = await prisma.supplier.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!existing) {
    throw notFound("Supplier tidak ditemukan.");
  }

  const links =
    input.products !== undefined
      ? await resolveProductLinks(input.products)
      : undefined;

  if (input.name !== undefined) {
    await assertUniqueName(input.name, id);
  }

  const supplier = await prisma.$transaction(async (tx) => {
    if (links !== undefined) {
      await tx.supplierProduct.deleteMany({ where: { supplierId: id } });
      if (links.length > 0) {
        await tx.supplierProduct.createMany({
          data: links.map((link) => ({ ...link, supplierId: id })),
        });
      }
    }

    return tx.supplier.update({
      where: { id },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.contactName !== undefined
          ? { contactName: input.contactName }
          : {}),
        ...(input.phone !== undefined ? { phone: input.phone } : {}),
        ...(input.email !== undefined ? { email: input.email } : {}),
        ...(input.address !== undefined ? { address: input.address } : {}),
        ...(input.city !== undefined ? { city: input.city } : {}),
        ...(input.paymentTermDays !== undefined
          ? { paymentTermDays: input.paymentTermDays }
          : {}),
        ...(input.leadTimeDays !== undefined
          ? { leadTimeDays: input.leadTimeDays }
          : {}),
        ...(input.deliveryDays !== undefined
          ? { deliveryDays: serializeDeliveryDays(input.deliveryDays) }
          : {}),
        ...(input.minimumOrder !== undefined
          ? { minimumOrder: input.minimumOrder }
          : {}),
        ...(input.notes !== undefined ? { notes: input.notes } : {}),
        ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
      },
      include: supplierInclude,
    });
  });

  return mapSupplier(supplier);
}

export async function listSupplierOptions() {
  const suppliers = await prisma.supplier.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: {
      id: true,
      code: true,
      name: true,
      leadTimeDays: true,
      deliveryDays: true,
      paymentTermDays: true,
      minimumOrder: true,
      products: {
        select: {
          productId: true,
          lastPrice: true,
          isPreferred: true,
        },
      },
    },
  });

  return suppliers.map((supplier) => ({
    ...supplier,
    deliveryDays: normalizeDeliveryDays(supplier.deliveryDays) as SupplierDeliveryDay[],
  }));
}
