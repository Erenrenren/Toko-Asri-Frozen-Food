import { badRequest } from "@/lib/api/errors";
import { requireApiUser } from "@/lib/api/auth";
import { readPagination, readString } from "@/lib/api/query";
import { created, handleApiError, ok, readJson } from "@/lib/api/response";
import { createProduct, listProducts } from "@/lib/services/product.service";
import { PRODUCT_CATEGORIES } from "@/types/domain";
import type { ProductCategory } from "@/types/domain";
import { productCreateSchema } from "@/lib/validators/product";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await requireApiUser(["admin", "staff"]);
    const { searchParams } = new URL(request.url);
    const { page, pageSize, skip } = readPagination(searchParams);

    const categoryRaw = readString(searchParams, "category");
    if (categoryRaw && !(PRODUCT_CATEGORIES as readonly string[]).includes(categoryRaw)) {
      throw badRequest("Kategori produk tidak valid.");
    }

    const statusRaw = readString(searchParams, "status");
    if (statusRaw && !["active", "inactive", "all"].includes(statusRaw)) {
      throw badRequest("Filter status produk tidak valid.");
    }

    const result = await listProducts({
      search: readString(searchParams, "search"),
      category: categoryRaw as ProductCategory | undefined,
      status: (statusRaw as "active" | "inactive" | "all" | undefined) ?? "all",
      page,
      pageSize,
      skip,
    });

    return ok(result.items, result.meta);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireApiUser(["admin", "staff"]);
    const body = productCreateSchema.parse(await readJson(request));
    const product = await createProduct(body);
    return created(product, `Produk ${product.name} berhasil ditambahkan.`);
  } catch (error) {
    return handleApiError(error);
  }
}
