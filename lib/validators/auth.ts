import { z } from "zod";

export const emailSchema = z
  .string()
  .trim()
  .min(1, "Email wajib diisi.")
  .email("Format email tidak valid.")
  .max(160, "Email terlalu panjang.")
  .transform((value) => value.toLowerCase());

export const passwordSchema = z
  .string()
  .min(8, "Password minimal 8 karakter.")
  .max(72, "Password maksimal 72 karakter.")
  .regex(/[A-Za-z]/, "Password harus mengandung huruf.")
  .regex(/[0-9]/, "Password harus mengandung angka.");

export const phoneSchema = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z
    .string()
    .trim()
    .regex(/^[0-9+\-\s()]{8,20}$/, "Nomor telepon tidak valid.")
    .optional(),
);

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password wajib diisi."),
});

export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Nama minimal 2 karakter.")
    .max(80, "Nama maksimal 80 karakter."),
  email: emailSchema,
  password: passwordSchema,
  phone: phoneSchema,
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
