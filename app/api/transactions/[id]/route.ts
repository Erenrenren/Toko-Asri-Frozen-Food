import { z } from "zod";

import { requireApiUser } from "@/lib/api/auth";
import { handleApiError, ok, readJson } from "@/lib/api/response";
import {
  getTransactionById,
  voidTransaction,
} from "@/lib/services/transaction.service";

export const dynamic = "force-dynamic";

const voidSchema = z.object({
  status: z.literal("void", {
    errorMap: () => ({ message: "Hanya status void yang didukung." }),
  }),
});

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    await requireApiUser(["admin", "staff"]);
    const { id } = await context.params;
    const transaction = await getTransactionById(id);
    return ok(transaction);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const actor = await requireApiUser(["admin"]);
    const { id } = await context.params;
    voidSchema.parse(await readJson(request));
    const transaction = await voidTransaction(id, actor);
    return ok(transaction, undefined, "Transaksi berhasil dibatalkan.");
  } catch (error) {
    return handleApiError(error);
  }
}
