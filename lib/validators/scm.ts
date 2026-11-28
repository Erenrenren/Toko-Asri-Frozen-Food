import { z } from "zod";

import {
  BATCH_STATUSES,
  PURCHASE_ORDER_STATUSES,
  STOCK_MOVEMENT_REASONS,
  STOCK_MOVEMENT_TYPES,
  SUPPLIER_DELIVERY_DAYS,
} from "@/types/domain";

const optionalText = (max: number, label: string) =>
  z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? null : value),
    z
      .string()
      .trim()
      .max(max, `${label} maksimal ${max} karakter.`)
      .nullable()
      .optional(),
  );

const optionalEmail = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? null : value),
  z
    .string()
    .trim()
    .email("Format email tidak valid.")
    .max(120, "Email maksimal 120 karakter.")
    .nullable()
    .optional(),
);

const optionalDate = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? null : value),
  z
    .string()
    .trim()
    .nullable()
    .optional()
    .refine(
      (value) => value == null || !Number.isNaN(new Date(value).getTime()),
      "Tanggal tidak valid.",
    ),
);

const integer = (label: string, min = 0, max = 1_000_000_000) =>
  z
    .number({ invalid_type_error: `${label} harus berupa angka.` })
    .int(`${label} harus bilangan bulat.`)
    .min(min, `${label} minimal ${min}.`)
    .max(max, `${label} terlalu besar.`);

// ============================================================
// Supplier
// ============================================================

const supplierProductSchema = z.object({
  productId: z.string().trim().min(1, "Produk wajib dipilih."),
  supplierSku: optionalText(32, "SKU supplier"),
  lastPrice: integer("Harga beli terakhir")
    .nullable()
    .optional(),
  isPreferred: z.boolean().optional().default(false),
});

const supplierBaseFields = {
  name: z
    .string()
    .trim()
    .min(2, "Nama supplier minimal 2 karakter.")
    .max(120, "Nama supplier maksimal 120 karakter."),
  contactName: optionalText(80, "Nama kontak"),
  phone: optionalText(30, "Nomor telepon"),
  email: optionalEmail,
  address: optionalText(250, "Alamat"),
  city: optionalText(60, "Kota"),
  paymentTermDays: integer("Termin pembayaran", 0, 365),
  leadTimeDays: integer("Lead time", 0, 90),
  deliveryDays: z
    .array(z.enum(SUPPLIER_DELIVERY_DAYS))
    .max(7, "Jadwal pengiriman tidak valid."),
  minimumOrder: integer("Minimum order", 0),
  notes: optionalText(500, "Catatan"),
  isActive: z.boolean(),
  products: z
    .array(supplierProductSchema)
    .max(200, "Terlalu banyak produk untuk satu supplier."),
};

export const supplierCreateSchema = z.object({
  ...supplierBaseFields,
  paymentTermDays: supplierBaseFields.paymentTermDays.default(0),
  leadTimeDays: supplierBaseFields.leadTimeDays.default(1),
  deliveryDays: supplierBaseFields.deliveryDays.default([]),
  minimumOrder: supplierBaseFields.minimumOrder.default(0),
  isActive: supplierBaseFields.isActive.default(true),
  products: supplierBaseFields.products.default([]),
});

export const supplierUpdateSchema = z.object(supplierBaseFields).partial();

export type SupplierCreateInput = z.infer<typeof supplierCreateSchema>;
export type SupplierUpdateInput = z.infer<typeof supplierUpdateSchema>;

// ============================================================
// Purchase Order & Goods Receipt
// ============================================================

const purchaseOrderItemSchema = z.object({
  productId: z.string().trim().min(1, "Produk wajib dipilih."),
  quantity: integer("Jumlah", 1, 100_000),
  unitCost: integer("Harga satuan", 0),
});

export const purchaseOrderCreateSchema = z
  .object({
    supplierId: z.string().trim().min(1, "Supplier wajib dipilih."),
    status: z.enum(["draft", "ordered"]).default("draft"),
    expectedDate: optionalDate,
    shippingCost: integer("Biaya kirim", 0).default(0),
    notes: optionalText(500, "Catatan"),
    items: z
      .array(purchaseOrderItemSchema)
      .min(1, "Minimal satu item purchase order.")
      .max(100, "Maksimal 100 item per purchase order."),
  })
  .superRefine((value, ctx) => {
    const seen = new Set<string>();
    value.items.forEach((item, index) => {
      if (seen.has(item.productId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["items", index, "productId"],
          message: "Produk yang sama tidak boleh dipilih dua kali.",
        });
      }
      seen.add(item.productId);
    });
  });

export const purchaseOrderActionSchema = z.object({
  action: z.enum(["submit", "cancel"], {
    errorMap: () => ({ message: "Aksi purchase order tidak valid." }),
  }),
});

const goodsReceiptItemSchema = z.object({
  purchaseOrderItemId: z.string().trim().min(1),
  quantity: integer("Jumlah diterima", 0, 100_000),
  batchNumber: optionalText(60, "Nomor batch"),
  productionDate: optionalDate,
  expiryDate: optionalDate,
});

export const goodsReceiptCreateSchema = z
  .object({
    receivedAt: optionalDate,
    notes: optionalText(500, "Catatan penerimaan"),
    items: z
      .array(goodsReceiptItemSchema)
      .min(1, "Minimal satu item penerimaan.")
      .max(100, "Maksimal 100 item per penerimaan."),
  })
  .superRefine((value, ctx) => {
    const total = value.items.reduce((sum, item) => sum + item.quantity, 0);
    if (total <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["items"],
        message: "Isi jumlah barang yang diterima minimal 1 unit.",
      });
    }

    value.items.forEach((item, index) => {
      if (item.quantity > 0 && !item.batchNumber) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["items", index, "batchNumber"],
          message: "Nomor batch wajib diisi untuk barang yang diterima.",
        });
      }
      if (item.productionDate && item.expiryDate) {
        const production = new Date(item.productionDate).getTime();
        const expiry = new Date(item.expiryDate).getTime();
        if (expiry <= production) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["items", index, "expiryDate"],
            message: "Tanggal kedaluwarsa harus setelah tanggal produksi.",
          });
        }
      }
    });
  });

export type PurchaseOrderCreateInput = z.infer<typeof purchaseOrderCreateSchema>;
export type PurchaseOrderActionInput = z.infer<typeof purchaseOrderActionSchema>;
export type GoodsReceiptCreateInput = z.infer<typeof goodsReceiptCreateSchema>;

// ============================================================
// Stock & Batch
// ============================================================

export const stockMovementCreateSchema = z
  .object({
    productId: z.string().trim().min(1, "Produk wajib dipilih."),
    type: z.enum(STOCK_MOVEMENT_TYPES, {
      errorMap: () => ({ message: "Jenis mutasi stok tidak valid." }),
    }),
    // in/out: kirim angka positif (servis yang memberi tanda).
    // adjustment: kirim angka bertanda (+/-).
    quantity: z
      .number({ invalid_type_error: "Jumlah harus berupa angka." })
      .int("Jumlah harus bilangan bulat.")
      .min(-1_000_000, "Jumlah terlalu kecil.")
      .max(1_000_000, "Jumlah terlalu besar.")
      .refine((value) => value !== 0, "Jumlah tidak boleh 0."),
    reason: z.enum(STOCK_MOVEMENT_REASONS).optional(),
    unitCost: integer("Harga satuan").nullable().optional(),
    batchId: optionalText(40, "Batch"),
    batchNumber: optionalText(60, "Nomor batch"),
    productionDate: optionalDate,
    expiryDate: optionalDate,
    note: optionalText(500, "Catatan"),
    occurredAt: optionalDate,
  })
  .superRefine((value, ctx) => {
    if (value.type === "in" && value.quantity <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["quantity"],
        message: "Jumlah barang masuk harus lebih dari 0.",
      });
    }
    if (value.type === "out" && value.quantity <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["quantity"],
        message: "Jumlah barang keluar harus lebih dari 0.",
      });
    }
    if (value.type === "in" && value.reason === "purchase_receipt") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["reason"],
        message:
          "Penerimaan pembelian harus melalui Purchase Order agar jurnal kas ikut tercatat.",
      });
    }
    if (value.productionDate && value.expiryDate) {
      const production = new Date(value.productionDate).getTime();
      const expiry = new Date(value.expiryDate).getTime();
      if (expiry <= production) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["expiryDate"],
          message: "Tanggal kedaluwarsa harus setelah tanggal produksi.",
        });
      }
    }
  });

export const stockMovementQuerySchema = z.object({
  type: z.enum(STOCK_MOVEMENT_TYPES).optional(),
  reason: z.enum(STOCK_MOVEMENT_REASONS).optional(),
});

export const batchQuerySchema = z.object({
  status: z.enum([...BATCH_STATUSES, "expiring", "all"]).optional(),
});

export const purchaseOrderStatusSchema = z.enum(PURCHASE_ORDER_STATUSES);

export type StockMovementCreateInput = z.infer<typeof stockMovementCreateSchema>;
