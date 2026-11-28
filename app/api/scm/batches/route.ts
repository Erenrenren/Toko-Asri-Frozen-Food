import { requireApiUser } from "@/lib/api/auth";
import { badRequest } from "@/lib/api/errors";
import { readPagination, readString } from "@/lib/api/query";
import { handleApiError, ok } from "@/lib/api/response";
import { listBatches } from "@/lib/services/scm/stock.service";

export const dynamic = "force-dynamic";

const ALLOWED_STATUSES = ["all", "active", "expiring", "expired", "depleted"];

export async function GET(request: Request) {
  try {
    await requireApiUser(["admin", "staff"]);
    const { searchParams } = new URL(request.url);
    const { page, pageSize, skip } = readPagination(searchParams);

    const statusRaw = readString(searchParams, "status") ?? "all";
    if (!ALLOWED_STATUSES.includes(statusRaw)) {
      throw badRequest("Filter status batch tidak valid.");
    }

    const result = await listBatches({
      search: readString(searchParams, "search"),
      productId: readString(searchParams, "productId"),
      status: statusRaw as "all" | "active" | "expiring" | "expired" | "depleted",
      page,
      pageSize,
      skip,
    });

    return ok(result.items, result.meta);
  } catch (error) {
    return handleApiError(error);
  }
}
