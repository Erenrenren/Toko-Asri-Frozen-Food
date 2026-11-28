import { requireApiUser } from "@/lib/api/auth";
import { handleApiError, ok } from "@/lib/api/response";
import {
  getStockLevel,
  listBatches,
  listStockMovements,
} from "@/lib/services/scm/stock.service";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ productId: string }> },
) {
  try {
    await requireApiUser(["admin", "staff"]);
    const { productId } = await params;

    const [stock, batches, movements] = await Promise.all([
      getStockLevel(productId),
      listBatches({
        productId,
        status: "all",
        page: 1,
        pageSize: 100,
        skip: 0,
      }),
      listStockMovements({
        productId,
        page: 1,
        pageSize: 20,
        skip: 0,
      }),
    ]);

    return ok({
      stock,
      batches: batches.items,
      movements: movements.items,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
