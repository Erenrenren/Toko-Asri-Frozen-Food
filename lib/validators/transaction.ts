import { z } from "zod";

import {
  TRANSACTION_CATEGORIES,
  TRANSACTION_SOURCES,
  TRANSACTION_TYPES,
} from "@/types/domain";

export const transactionCreateSchema = z
  .object({
    type: z.enum(TRANSACTION_TYPES, {
      errorMap: () => ({ message: "Jenis transaksi tidak valid." }),
    }),
    category: z.enum(TRANSACTION_CATEGORIES, {
      errorMap: () => ({ message: "Kategori transaksi tidak valid." }),
    }),
    description: z
      .string()
      .trim()
      .min(3, "Keterangan minimal 3 karakter.")
      .max(500, "Keterangan maksimal 500 karakter."),
    occurredAt: z.string().trim().optional(),
    amount: z
      .number({ invalid_type_error: "Nominal harus berupa angka." })
      .int("Nominal harus bilangan bulat (Rupiah).")
      .positive("Nominal harus lebih dari 0.")
      .max(1_000_000_000, "Nominal terlalu besar.")
      .optional(),
    productId: z.string().trim().min(1).optional(),
    quantity: z
      .number({ invalid_type_error: "Jumlah harus berupa angka." })
      .int("Jumlah harus bilangan bulat.")
      .positive("Jumlah harus lebih dari 0.")
      .max(1_000_000, "Jumlah terlalu besar.")
      .optional(),
    unitPrice: z
      .number({ invalid_type_error: "Harga satuan harus berupa angka." })
      .int("Harga satuan harus bilangan bulat (Rupiah).")
      .positive("Harga satuan harus lebih dari 0.")
      .max(1_000_000_000, "Harga satuan terlalu besar.")
      .optional(),
    source: z.enum(TRANSACTION_SOURCES).default("manual"),
    externalRef: z.string().trim().max(120).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.type === "income" && data.category === "sales") {
      if (!data.productId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["productId"],
          message: "Produk wajib dipilih untuk transaksi penjualan.",
        });
      }
      if (!data.quantity) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["quantity"],
          message: "Jumlah terjual wajib diisi.",
        });
      }
      if (!data.unitPrice) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["unitPrice"],
          message: "Harga satuan wajib diisi.",
        });
      }
    } else {
      if (!data.amount) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["amount"],
          message: "Nominal transaksi wajib diisi.",
        });
      }
      if (data.type === "income" && data.category === "purchase") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["category"],
          message: "Pembelian/restock harus dicatat sebagai pengeluaran.",
        });
      }
      if (data.type === "expense" && data.category === "sales") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["category"],
          message: "Penjualan harus dicatat sebagai pemasukan.",
        });
      }
    }

    if (data.occurredAt) {
      const date = new Date(data.occurredAt);
      if (Number.isNaN(date.getTime())) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["occurredAt"],
          message: "Tanggal transaksi tidak valid.",
        });
      } else if (date.getTime() > Date.now() + 24 * 60 * 60 * 1000) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["occurredAt"],
          message: "Tanggal transaksi tidak boleh jauh di masa depan.",
        });
      }
    }
  });

export type TransactionCreateInput = z.infer<typeof transactionCreateSchema>;
