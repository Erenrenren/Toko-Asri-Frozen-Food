import { requireApiUser } from "@/lib/api/auth";
import { badRequest } from "@/lib/api/errors";
import { readPagination, readString } from "@/lib/api/query";
import { handleApiError, ok } from "@/lib/api/response";
import { listStockLevels } from "@/lib/services/scm/stock.service";
import { PRODUCT_CATEGORIES } from "@/types/domain";
import type { ProductCategory } from "@/types/domain";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await requireApiUser(["admin", "staff"]);
    const { searchParams } = new URL(request.url);
    const { page, pageSize, skip } = readPagination(searchParams);

    const categoryRaw = readString(searchParams, "category");
    if (
      categoryRaw &&
      !(PRODUCT_CATEGORIES as readonly string[]).includes(categoryRaw)
    ) {
      throw badRequest("Kategori produk tidak valid.");
    }

    const statusRaw = readString(searchParams, "status") ?? "all";
    if (!["all", "healthy", "low", "out"].includes(statusRaw)) {
      throw badRequest("Filter status stok tidak valid.");
    }

    const result = await listStockLevels({
      search: readString(searchParams, "search"),
      category: categoryRaw as ProductCategory | undefined,
      status: statusRaw as "all" | "healthy" | "low" | "out",
      page,
      pageSize,
      skip,
    });

    return ok(result.items, result.meta);
  } catch (error) {
    return handleApiError(error);
  }
}
