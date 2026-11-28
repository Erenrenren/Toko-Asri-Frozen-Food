import type { Product } from "@prisma/client";

import { conflict, notFound } from "@/lib/api/errors";
import { prisma } from "@/lib/db/prisma";
import type {
  ProductCreateInput,
  ProductUpdateInput,
} from "@/lib/validators/product";
import type {
  ProductCategory,
  ProductDTO,
  ProductUnit,
} from "@/types/domain";

export function mapProduct(product: Product): ProductDTO {
  const margin =
    product.sellPrice > 0
      ? ((product.sellPrice - product.costPrice) / product.sellPrice) * 100
      : 0;

  return {
    id: product.id,
    sku: product.sku,
    name: product.name,
    category: product.category as ProductCategory,
    description: product.description,
    storageTemperature: product.storageTemperature,
    shelfLifeDays: product.shelfLifeDays,
    costPrice: product.costPrice,
    sellPrice: product.sellPrice,
    unit: product.unit as ProductUnit,
    packSize: product.packSize,
    stockQty: product.stockQty,
    minStockQty: product.minStockQty,
    isActive: product.isActive,
    margin: Math.round(margin * 10) / 10,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
  };
}

export interface ListProductsParams {
  search?: string;
  category?: ProductCategory;
  status?: "active" | "inactive" | "all";
  page: number;
  pageSize: number;
  skip: number;
}

export async function listProducts(params: ListProductsParams) {
  const where = {
    ...(params.category ? { category: params.category } : {}),
    ...(params.status === "active"
      ? { isActive: true }
      : params.status === "inactive"
        ? { isActive: false }
        : {}),
    ...(params.search
      ? {
          OR: [
            { name: { contains: params.search } },
            { sku: { contains: params.search } },
            { description: { contains: params.search } },
          ],
        }
      : {}),
  };

  const [total, products] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      orderBy: [{ isActive: "desc" }, { updatedAt: "desc" }],
      skip: params.skip,
      take: params.pageSize,
    }),
  ]);

  return {
    items: products.map(mapProduct),
    meta: {
      page: params.page,
      pageSize: params.pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / params.pageSize)),
    },
  };
}

export async function getProductById(id: string): Promise<ProductDTO> {
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) {
    throw notFound("Produk tidak ditemukan.");
  }
  return mapProduct(product);
}

export async function createProduct(
  input: ProductCreateInput,
): Promise<ProductDTO> {
  const existing = await prisma.product.findUnique({
    where: { sku: input.sku },
    select: { id: true },
  });

  if (existing) {
    throw conflict(`SKU ${input.sku} sudah digunakan produk lain.`);
  }

  const product = await prisma.product.create({
    data: {
      sku: input.sku,
      name: input.name,
      category: input.category,
      description: input.description ?? null,
      storageTemperature: input.storageTemperature ?? null,
      shelfLifeDays: input.shelfLifeDays ?? null,
      costPrice: input.costPrice,
      sellPrice: input.sellPrice,
      unit: input.unit,
      packSize: input.packSize ?? null,
      stockQty: input.stockQty,
      minStockQty: input.minStockQty,
      isActive: input.isActive,
    },
  });

  return mapProduct(product);
}

export async function updateProduct(
  id: string,
  input: ProductUpdateInput,
): Promise<ProductDTO> {
  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) {
    throw notFound("Produk tidak ditemukan.");
  }

  if (input.sku && input.sku !== existing.sku) {
    const duplicate = await prisma.product.findUnique({
      where: { sku: input.sku },
      select: { id: true },
    });
    if (duplicate) {
      throw conflict(`SKU ${input.sku} sudah digunakan produk lain.`);
    }
  }

  const product = await prisma.product.update({
    where: { id },
    data: {
      ...(input.sku !== undefined ? { sku: input.sku } : {}),
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.category !== undefined ? { category: input.category } : {}),
      ...(input.description !== undefined
        ? { description: input.description }
        : {}),
      ...(input.storageTemperature !== undefined
        ? { storageTemperature: input.storageTemperature }
        : {}),
      ...(input.shelfLifeDays !== undefined
        ? { shelfLifeDays: input.shelfLifeDays }
        : {}),
      ...(input.costPrice !== undefined ? { costPrice: input.costPrice } : {}),
      ...(input.sellPrice !== undefined ? { sellPrice: input.sellPrice } : {}),
      ...(input.unit !== undefined ? { unit: input.unit } : {}),
      ...(input.packSize !== undefined ? { packSize: input.packSize } : {}),
      ...(input.stockQty !== undefined ? { stockQty: input.stockQty } : {}),
      ...(input.minStockQty !== undefined
        ? { minStockQty: input.minStockQty }
        : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
    },
  });

  return mapProduct(product);
}

export async function deactivateProduct(id: string): Promise<ProductDTO> {
  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) {
    throw notFound("Produk tidak ditemukan.");
  }

  const product = await prisma.product.update({
    where: { id },
    data: { isActive: false },
  });

  return mapProduct(product);
}

export async function listProductOptions() {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: {
      id: true,
      sku: true,
      name: true,
      sellPrice: true,
      costPrice: true,
      unit: true,
      stockQty: true,
      minStockQty: true,
    },
  });

  return products.map((product) => ({
    ...product,
    unit: product.unit as ProductUnit,
  }));
}

export async function listCustomerCatalog() {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    orderBy: [{ category: "asc" }, { name: "asc" }],
    select: {
      id: true,
      sku: true,
      name: true,
      category: true,
      description: true,
      storageTemperature: true,
      shelfLifeDays: true,
      sellPrice: true,
      unit: true,
      packSize: true,
      stockQty: true,
    },
  });

  return products.map((product) => ({
    ...product,
    category: product.category as ProductCategory,
    unit: product.unit as ProductUnit,
  }));
}
