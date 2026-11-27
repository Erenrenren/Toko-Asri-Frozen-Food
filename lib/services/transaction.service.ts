import { randomBytes } from "crypto";

import { Prisma } from "@prisma/client";

import { badRequest, forbidden, notFound } from "@/lib/api/errors";
import { prisma } from "@/lib/db/prisma";
import { formatDateInput } from "@/lib/format";
import type { TransactionCreateInput } from "@/lib/validators/transaction";
import type {
  ProductUnit,
  Role,
  TransactionCategory,
  TransactionDTO,
  TransactionSource,
  TransactionStatus,
  TransactionType,
} from "@/types/domain";

export const transactionInclude = {
  product: {
    select: { id: true, sku: true, name: true, unit: true },
  },
  createdBy: {
    select: { id: true, name: true, role: true },
  },
} satisfies Prisma.FinancialTransactionInclude;

export type TransactionRecord = Prisma.FinancialTransactionGetPayload<{
  include: typeof transactionInclude;
}>;

export function mapTransaction(transaction: TransactionRecord): TransactionDTO {
  return {
    id: transaction.id,
    code: transaction.code,
    type: transaction.type as TransactionType,
    category: transaction.category as TransactionCategory,
    amount: transaction.amount,
    quantity: transaction.quantity,
    unitPrice: transaction.unitPrice,
    unitCost: transaction.unitCost,
    description: transaction.description,
    occurredAt: transaction.occurredAt.toISOString(),
    source: transaction.source as TransactionSource,
    status: transaction.status as TransactionStatus,
    externalRef: transaction.externalRef,
    productId: transaction.productId,
    product: transaction.product
      ? {
          id: transaction.product.id,
          sku: transaction.product.sku,
          name: transaction.product.name,
          unit: transaction.product.unit as ProductUnit,
        }
      : null,
    createdBy: transaction.createdBy
      ? {
          id: transaction.createdBy.id,
          name: transaction.createdBy.name,
          role: transaction.createdBy.role as Role,
        }
      : null,
    createdAt: transaction.createdAt.toISOString(),
  };
}

function generateTransactionCode(date: Date): string {
  const datePart = formatDateInput(date).replaceAll("-", "");
  const randomPart = randomBytes(3).toString("hex").toUpperCase();
  return `TRX-${datePart}-${randomPart}`;
}

function parseOccurredAt(value?: string): Date {
  if (!value) return new Date();
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return new Date(`${value}T12:00:00+07:00`);
  }
  return new Date(value);
}

export interface ListTransactionsParams {
  search?: string;
  type?: TransactionType;
  category?: TransactionCategory;
  from?: Date;
  to?: Date;
  page: number;
  pageSize: number;
  skip: number;
}

export async function listTransactions(params: ListTransactionsParams) {
  const where: Prisma.FinancialTransactionWhereInput = {
    ...(params.type ? { type: params.type } : {}),
    ...(params.category ? { category: params.category } : {}),
    ...(params.from || params.to
      ? {
          occurredAt: {
            ...(params.from ? { gte: params.from } : {}),
            ...(params.to ? { lte: params.to } : {}),
          },
        }
      : {}),
    ...(params.search
      ? {
          OR: [
            { code: { contains: params.search } },
            { description: { contains: params.search } },
            { product: { is: { name: { contains: params.search } } } },
          ],
        }
      : {}),
  };

  const [total, transactions] = await Promise.all([
    prisma.financialTransaction.count({ where }),
    prisma.financialTransaction.findMany({
      where,
      include: transactionInclude,
      orderBy: [{ occurredAt: "desc" }, { createdAt: "desc" }],
      skip: params.skip,
      take: params.pageSize,
    }),
  ]);

  return {
    items: transactions.map(mapTransaction),
    meta: {
      page: params.page,
      pageSize: params.pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / params.pageSize)),
    },
  };
}

export async function getTransactionById(id: string): Promise<TransactionDTO> {
  const transaction = await prisma.financialTransaction.findUnique({
    where: { id },
    include: transactionInclude,
  });
  if (!transaction) {
    throw notFound("Transaksi tidak ditemukan.");
  }
  return mapTransaction(transaction);
}

export async function createTransaction(
  input: TransactionCreateInput,
  actor: { id: string; role: Role },
): Promise<TransactionDTO> {
  if (input.source !== "manual" && actor.role !== "admin") {
    throw forbidden("Hanya admin yang dapat mencatat transaksi dari integrasi.");
  }

  const occurredAt = parseOccurredAt(input.occurredAt);
  let amount: number;
  let quantity: number | null = null;
  let unitPrice: number | null = null;
  let unitCost: number | null = null;
  let productId: string | null = null;

  if (input.type === "income" && input.category === "sales") {
    if (!input.productId || !input.quantity || !input.unitPrice) {
      throw badRequest("Data penjualan belum lengkap.");
    }

    const product = await prisma.product.findUnique({
      where: { id: input.productId },
      select: { id: true, costPrice: true, isActive: true },
    });

    if (!product) {
      throw notFound("Produk yang dipilih tidak ditemukan.");
    }
    if (!product.isActive) {
      throw badRequest("Produk nonaktif tidak dapat dijual.");
    }

    productId = product.id;
    quantity = input.quantity;
    unitPrice = input.unitPrice;
    unitCost = product.costPrice;
    amount = input.quantity * input.unitPrice;
  } else {
    if (!input.amount) {
      throw badRequest("Nominal transaksi wajib diisi.");
    }
    amount = input.amount;
  }

  const transaction = await prisma.financialTransaction.create({
    data: {
      code: generateTransactionCode(occurredAt),
      type: input.type,
      category: input.category,
      amount,
      quantity,
      unitPrice,
      unitCost,
      description: input.description,
      occurredAt,
      source: input.source,
      status: "posted",
      externalRef: input.externalRef ?? null,
      productId,
      createdById: actor.id,
    },
    include: transactionInclude,
  });

  return mapTransaction(transaction);
}

export async function voidTransaction(
  id: string,
  actor: { id: string; role: Role },
): Promise<TransactionDTO> {
  if (actor.role !== "admin") {
    throw forbidden("Hanya admin yang dapat membatalkan transaksi.");
  }

  const existing = await prisma.financialTransaction.findUnique({ where: { id } });
  if (!existing) {
    throw notFound("Transaksi tidak ditemukan.");
  }
  if (existing.status === "void") {
    throw badRequest("Transaksi sudah dibatalkan sebelumnya.");
  }

  const transaction = await prisma.financialTransaction.update({
    where: { id },
    data: { status: "void" },
    include: transactionInclude,
  });

  return mapTransaction(transaction);
}

export async function listRecentTransactions(limit = 6): Promise<TransactionDTO[]> {
  const transactions = await prisma.financialTransaction.findMany({
    include: transactionInclude,
    orderBy: [{ occurredAt: "desc" }, { createdAt: "desc" }],
    take: limit,
  });
  return transactions.map(mapTransaction);
}

export interface TransactionSummary {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  totalCogs: number;
  grossProfit: number;
}

export async function getTransactionSummary(
  from: Date,
  to: Date,
): Promise<TransactionSummary> {
  const transactions = await prisma.financialTransaction.findMany({
    where: {
      occurredAt: { gte: from, lte: to },
      status: "posted",
    },
    select: {
      type: true,
      category: true,
      amount: true,
      quantity: true,
      unitCost: true,
    },
  });

  let totalIncome = 0;
  let totalExpense = 0;
  let totalCogs = 0;

  for (const transaction of transactions) {
    if (transaction.type === "income") {
      totalIncome += transaction.amount;
      if (transaction.category === "sales") {
        totalCogs += (transaction.quantity ?? 0) * (transaction.unitCost ?? 0);
      }
    } else {
      totalExpense += transaction.amount;
    }
  }

  return {
    totalIncome,
    totalExpense,
    balance: totalIncome - totalExpense,
    totalCogs,
    grossProfit: totalIncome - totalCogs,
  };
}
