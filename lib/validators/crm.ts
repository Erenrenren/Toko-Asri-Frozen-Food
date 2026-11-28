import { z } from "zod";

import { ORDER_STATUS_TRANSITIONS } from "@/lib/constants";
import {
  CUSTOMER_TYPES,
  INTERACTION_STATUSES,
  INTERACTION_TYPES,
  ORDER_STATUSES,
} from "@/types/domain";

// ------------------------------------------------------------
// Helper lokal (mengikuti pola lib/validators/scm.ts)
// ------------------------------------------------------------

const emptyToNull = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? null : value;

const optionalText = (max: number, label: string) =>
  z.preprocess(
    emptyToNull,
    z.string().trim().max(max, `${label} maksimal ${max} karakter.`).nullable().optional(),
  );

const optionalDate = z.preprocess(
  emptyToNull,
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

const requiredText = (min: number, max: number, label: string) =>
  z
    .string({ required_error: `${label} wajib diisi.` })
    .trim()
    .min(min, `${label} minimal ${min} karakter.`)
    .max(max, `${label} maksimal ${max} karakter.`);

const integer = (label: string, min = 0, max = 1_000_000_000) =>
  z
    .number({ invalid_type_error: `${label} harus berupa angka.` })
    .int(`${label} harus bilangan bulat.`)
    .min(min, `${label} minimal ${min}.`)
    .max(max, `${label} terlalu besar.`);

const requiredPhone = z
  .string({ required_error: "Nomor telepon wajib diisi." })
  .trim()
  .regex(/^[0-9+\-\s()]{8,20}$/, "Nomor telepon tidak valid.");

const idSchema = (label: string) =>
  z.string({ required_error: `${label} wajib dipilih.` }).trim().min(1, `${label} wajib dipilih.`);

// ============================================================
// Profil & alamat customer
// ============================================================

export const customerProfileUpdateSchema = z.object({
  customerType: z.enum(CUSTOMER_TYPES),
  preferenceNotes: optionalText(1000, "Catatan preferensi"),
});

const customerAddressBaseFields = {
  label: requiredText(2, 40, "Label alamat"),
  recipientName: requiredText(2, 80, "Nama penerima"),
  phone: requiredPhone,
  addressLine: requiredText(5, 255, "Alamat"),
  district: optionalText(80, "Kecamatan"),
  city: requiredText(2, 80, "Kota"),
  postalCode: z.preprocess(
    emptyToNull,
    z
      .string()
      .trim()
      .regex(/^[0-9]{5}$/, "Kode pos harus 5 digit.")
      .nullable()
      .optional(),
  ),
  notes: optionalText(255, "Catatan alamat"),
  isPrimary: z.boolean(),
};

export const customerAddressCreateSchema = z.object({
  ...customerAddressBaseFields,
  isPrimary: customerAddressBaseFields.isPrimary.default(false),
});

export const customerAddressUpdateSchema = z.object(customerAddressBaseFields).partial();

export const customerQuerySchema = z.object({
  type: z.enum(CUSTOMER_TYPES).optional(),
  isActive: z.enum(["true", "false"]).optional(),
});

export type CustomerProfileUpdateInput = z.infer<typeof customerProfileUpdateSchema>;
export type CustomerAddressCreateInput = z.infer<typeof customerAddressCreateSchema>;
export type CustomerAddressUpdateInput = z.infer<typeof customerAddressUpdateSchema>;

// ============================================================
// Pesanan
// ============================================================

const orderItemInputSchema = z.object({
  productId: idSchema("Produk"),
  quantity: integer("Jumlah", 1, 100_000),
});

export const orderCreateSchema = z
  .object({
    customerId: idSchema("Pelanggan"),
    addressId: z.preprocess(emptyToNull, z.string().trim().nullable().optional()),
    shippingCost: integer("Biaya kirim", 0).default(0),
    discountAmount: integer("Diskon", 0).default(0),
    notes: optionalText(500, "Catatan"),
    items: z
      .array(orderItemInputSchema)
      .min(1, "Minimal satu item pesanan.")
      .max(100, "Maksimal 100 item per pesanan."),
  })
  .superRefine((value, ctx) => {
    const seen = new Set<string>();
    value.items.forEach((item, index) => {
      if (seen.has(item.productId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["items", index, "productId"],
          message: "Produk yang sama tidak boleh muncul dua kali dalam satu pesanan.",
        });
      }
      seen.add(item.productId);
    });
  });

export const orderStatusUpdateSchema = z
  .object({
    status: z.enum(ORDER_STATUSES),
    note: optionalText(500, "Catatan"),
  })
  .superRefine((value, ctx) => {
    if (value.status === "cancelled" && !value.note?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["note"],
        message: "Alasan pembatalan wajib diisi.",
      });
    }
  });

export const orderQuerySchema = z.object({
  status: z.enum(ORDER_STATUSES).optional(),
  customerId: z.string().trim().min(1).optional(),
  dateFrom: optionalDate,
  dateTo: optionalDate,
});

/** True bila transisi status pesanan diizinkan oleh aturan bisnis. */
export function isValidOrderTransition(
  from: (typeof ORDER_STATUSES)[number],
  to: (typeof ORDER_STATUSES)[number],
): boolean {
  return ORDER_STATUS_TRANSITIONS[from].includes(to);
}

export type OrderCreateInput = z.infer<typeof orderCreateSchema>;
export type OrderStatusUpdateInput = z.infer<typeof orderStatusUpdateSchema>;

// ============================================================
// Interaksi customer
// ============================================================

export const customerInteractionCreateSchema = z.object({
  customerId: idSchema("Pelanggan"),
  orderId: z.preprocess(emptyToNull, z.string().trim().nullable().optional()),
  type: z.enum(INTERACTION_TYPES),
  subject: requiredText(3, 120, "Subjek"),
  notes: optionalText(2000, "Catatan"),
  followUpAt: optionalDate,
});

export const customerInteractionUpdateSchema = z
  .object({
    type: z.enum(INTERACTION_TYPES),
    status: z.enum(INTERACTION_STATUSES),
    subject: requiredText(3, 120, "Subjek"),
    notes: optionalText(2000, "Catatan"),
    followUpAt: optionalDate,
  })
  .partial();

export const customerInteractionQuerySchema = z.object({
  type: z.enum(INTERACTION_TYPES).optional(),
  status: z.enum(INTERACTION_STATUSES).optional(),
  customerId: z.string().trim().min(1).optional(),
});

export type CustomerInteractionCreateInput = z.infer<typeof customerInteractionCreateSchema>;
export type CustomerInteractionUpdateInput = z.infer<typeof customerInteractionUpdateSchema>;
