import { z } from "zod";

import { PRODUCT_CATEGORIES, PRODUCT_UNITS } from "@/types/domain";

const descriptionSchema = z.preprocess(
  (value) =>
    typeof value === "string" && value.trim() === "" ? null : value,
  z.string().trim().max(500, "Deskripsi maksimal 500 karakter.").nullable().optional(),
);

const skuSchema = z
  .string()
  .trim()
  .min(3, "SKU minimal 3 karakter.")
  .max(32, "SKU maksimal 32 karakter.")
  .regex(
    /^[A-Za-z0-9-]+$/,
    "SKU hanya boleh berisi huruf, angka, dan tanda minus.",
  )
  .transform((value) => value.toUpperCase());

const baseProductFields = {
  sku: skuSchema,
  name: z
    .string()
    .trim()
    .min(2, "Nama produk minimal 2 karakter.")
    .max(120, "Nama produk maksimal 120 karakter."),
  category: z.enum(PRODUCT_CATEGORIES, {
    errorMap: () => ({ message: "Kategori produk tidak valid." }),
  }),
  description: descriptionSchema,
  storageTemperature: z
    .number({ invalid_type_error: "Suhu penyimpanan harus berupa angka." })
    .min(-60, "Suhu minimal -60°C.")
    .max(20, "Suhu maksimal 20°C.")
    .nullable()
    .optional(),
  shelfLifeDays: z
    .number({ invalid_type_error: "Masa simpan harus berupa angka." })
    .int("Masa simpan harus bilangan bulat.")
    .min(1, "Masa simpan minimal 1 hari.")
    .max(3650, "Masa simpan maksimal 3650 hari.")
    .nullable()
    .optional(),
  costPrice: z
    .number({ invalid_type_error: "HPP harus berupa angka." })
    .int("HPP harus bilangan bulat (Rupiah).")
    .min(0, "HPP tidak boleh negatif.")
    .max(1_000_000_000, "HPP terlalu besar."),
  sellPrice: z
    .number({ invalid_type_error: "Harga jual harus berupa angka." })
    .int("Harga jual harus bilangan bulat (Rupiah).")
    .min(0, "Harga jual tidak boleh negatif.")
    .max(1_000_000_000, "Harga jual terlalu besar."),
  unit: z.enum(PRODUCT_UNITS, {
    errorMap: () => ({ message: "Satuan produk tidak valid." }),
  }),
  packSize: z
    .number({ invalid_type_error: "Isi per kemasan harus berupa angka." })
    .int("Isi per kemasan harus bilangan bulat.")
    .min(1, "Isi per kemasan minimal 1.")
    .max(10_000, "Isi per kemasan terlalu besar.")
    .nullable()
    .optional(),
  stockQty: z
    .number({ invalid_type_error: "Stok harus berupa angka." })
    .int("Stok harus bilangan bulat.")
    .min(0, "Stok tidak boleh negatif.")
    .max(1_000_000, "Stok terlalu besar."),
  minStockQty: z
    .number({ invalid_type_error: "Stok minimum harus berupa angka." })
    .int("Stok minimum harus bilangan bulat.")
    .min(0, "Stok minimum tidak boleh negatif.")
    .max(1_000_000, "Stok minimum terlalu besar."),
  isActive: z.boolean().optional(),
};

export const productCreateSchema = z.object({
  ...baseProductFields,
  stockQty: baseProductFields.stockQty.default(0),
  minStockQty: baseProductFields.minStockQty.default(0),
  isActive: baseProductFields.isActive.default(true),
});

export const productUpdateSchema = z.object({
  sku: skuSchema.optional(),
  name: baseProductFields.name.optional(),
  category: baseProductFields.category.optional(),
  description: descriptionSchema,
  storageTemperature: baseProductFields.storageTemperature,
  shelfLifeDays: baseProductFields.shelfLifeDays,
  costPrice: baseProductFields.costPrice.optional(),
  sellPrice: baseProductFields.sellPrice.optional(),
  unit: baseProductFields.unit.optional(),
  packSize: baseProductFields.packSize,
  stockQty: baseProductFields.stockQty.optional(),
  minStockQty: baseProductFields.minStockQty.optional(),
  isActive: baseProductFields.isActive,
});

export type ProductCreateInput = z.infer<typeof productCreateSchema>;
export type ProductUpdateInput = z.infer<typeof productUpdateSchema>;
