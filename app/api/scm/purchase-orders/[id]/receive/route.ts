import { requireApiUser } from "@/lib/api/auth";
import { created, handleApiError, readJson } from "@/lib/api/response";
import { receivePurchaseOrder } from "@/lib/services/scm/purchase-order.service";
import { goodsReceiptCreateSchema } from "@/lib/validators/scm";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const actor = await requireApiUser(["admin", "staff"]);
    const { id } = await params;
    const body = goodsReceiptCreateSchema.parse(await readJson(request));
    const result = await receivePurchaseOrder(id, body, actor);

    return created(
      result,
      `Penerimaan ${result.receipt.number} tercatat. Stok dan jurnal pembelian diperbarui.`,
    );
  } catch (error) {
    return handleApiError(error);
  }
}
