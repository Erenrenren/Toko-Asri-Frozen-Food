import { requireApiUser } from "@/lib/api/auth";
import { handleApiError, ok, readJson } from "@/lib/api/response";
import {
  cancelPurchaseOrder,
  getPurchaseOrderById,
  submitPurchaseOrder,
} from "@/lib/services/scm/purchase-order.service";
import { purchaseOrderActionSchema } from "@/lib/validators/scm";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireApiUser(["admin", "staff"]);
    const { id } = await params;
    const order = await getPurchaseOrderById(id);
    return ok(order);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const actor = await requireApiUser(["admin", "staff"]);
    const { id } = await params;
    const body = purchaseOrderActionSchema.parse(await readJson(request));

    if (body.action === "submit") {
      const order = await submitPurchaseOrder(id, actor);
      return ok(order, undefined, `Purchase order ${order.number} dikirim ke supplier.`);
    }

    const order = await cancelPurchaseOrder(id, actor);
    return ok(order, undefined, `Purchase order ${order.number} dibatalkan.`);
  } catch (error) {
    return handleApiError(error);
  }
}
