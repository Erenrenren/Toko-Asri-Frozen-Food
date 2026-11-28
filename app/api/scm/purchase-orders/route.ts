import { requireApiUser } from "@/lib/api/auth";
import { badRequest } from "@/lib/api/errors";
import { readDate, readPagination, readString } from "@/lib/api/query";
import { created, handleApiError, ok, readJson } from "@/lib/api/response";
import {
  createPurchaseOrder,
  listPurchaseOrders,
} from "@/lib/services/scm/purchase-order.service";
import { purchaseOrderCreateSchema } from "@/lib/validators/scm";
import { PURCHASE_ORDER_STATUSES } from "@/types/domain";
import type { PurchaseOrderStatus } from "@/types/domain";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await requireApiUser(["admin", "staff"]);
    const { searchParams } = new URL(request.url);
    const { page, pageSize, skip } = readPagination(searchParams);

    const statusRaw = readString(searchParams, "status");
    if (
      statusRaw &&
      !(PURCHASE_ORDER_STATUSES as readonly string[]).includes(statusRaw)
    ) {
      throw badRequest("Filter status purchase order tidak valid.");
    }

    const result = await listPurchaseOrders({
      search: readString(searchParams, "search"),
      status: statusRaw as PurchaseOrderStatus | undefined,
      supplierId: readString(searchParams, "supplierId"),
      from: readDate(searchParams, "from"),
      to: readDate(searchParams, "to"),
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
    const actor = await requireApiUser(["admin", "staff"]);
    const body = purchaseOrderCreateSchema.parse(await readJson(request));
    const order = await createPurchaseOrder(body, actor);
    return created(
      order,
      `Purchase order ${order.number} berhasil dibuat.`,
    );
  } catch (error) {
    return handleApiError(error);
  }
}
