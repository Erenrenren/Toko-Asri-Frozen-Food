import { requireApiUser } from "@/lib/api/auth";
import { badRequest } from "@/lib/api/errors";
import { readDate, readPagination, readString } from "@/lib/api/query";
import { created, handleApiError, ok, readJson } from "@/lib/api/response";
import {
  createStockMovement,
  listStockMovements,
} from "@/lib/services/scm/stock.service";
import { stockMovementCreateSchema } from "@/lib/validators/scm";
import { STOCK_MOVEMENT_REASONS, STOCK_MOVEMENT_TYPES } from "@/types/domain";
import type {
  StockMovementReason,
  StockMovementType,
} from "@/types/domain";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await requireApiUser(["admin", "staff"]);
    const { searchParams } = new URL(request.url);
    const { page, pageSize, skip } = readPagination(searchParams);

    const typeRaw = readString(searchParams, "type");
    if (typeRaw && !(STOCK_MOVEMENT_TYPES as readonly string[]).includes(typeRaw)) {
      throw badRequest("Filter jenis mutasi tidak valid.");
    }

    const reasonRaw = readString(searchParams, "reason");
    if (
      reasonRaw &&
      !(STOCK_MOVEMENT_REASONS as readonly string[]).includes(reasonRaw)
    ) {
      throw badRequest("Filter alasan mutasi tidak valid.");
    }

    const result = await listStockMovements({
      search: readString(searchParams, "search"),
      productId: readString(searchParams, "productId"),
      type: typeRaw as StockMovementType | undefined,
      reason: reasonRaw as StockMovementReason | undefined,
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
    const body = stockMovementCreateSchema.parse(await readJson(request));
    const movement = await createStockMovement(body, actor);
    return created(
      movement,
      `Mutasi ${movement.reference} tercatat. Stok ${movement.productName} kini ${movement.stockAfter}.`,
    );
  } catch (error) {
    return handleApiError(error);
  }
}
