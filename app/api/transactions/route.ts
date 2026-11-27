import { badRequest } from "@/lib/api/errors";
import { requireApiUser } from "@/lib/api/auth";
import { readDate, readPagination, readString } from "@/lib/api/query";
import { created, handleApiError, ok, readJson } from "@/lib/api/response";
import {
  createTransaction,
  listTransactions,
} from "@/lib/services/transaction.service";
import {
  TRANSACTION_CATEGORIES,
  TRANSACTION_TYPES,
} from "@/types/domain";
import type {
  TransactionCategory,
  TransactionType,
} from "@/types/domain";
import { transactionCreateSchema } from "@/lib/validators/transaction";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await requireApiUser(["admin", "staff"]);
    const { searchParams } = new URL(request.url);
    const { page, pageSize, skip } = readPagination(searchParams);

    const typeRaw = readString(searchParams, "type");
    if (typeRaw && !(TRANSACTION_TYPES as readonly string[]).includes(typeRaw)) {
      throw badRequest("Jenis transaksi tidak valid.");
    }

    const categoryRaw = readString(searchParams, "category");
    if (
      categoryRaw &&
      !(TRANSACTION_CATEGORIES as readonly string[]).includes(categoryRaw)
    ) {
      throw badRequest("Kategori transaksi tidak valid.");
    }

    const result = await listTransactions({
      search: readString(searchParams, "search"),
      type: typeRaw as TransactionType | undefined,
      category: categoryRaw as TransactionCategory | undefined,
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
    const body = transactionCreateSchema.parse(await readJson(request));
    const transaction = await createTransaction(body, actor);
    return created(transaction, "Transaksi berhasil dicatat.");
  } catch (error) {
    return handleApiError(error);
  }
}
