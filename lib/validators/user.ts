import { z } from "zod";

import { ROLES } from "@/types/domain";
import {
  emailSchema,
  passwordSchema,
  phoneSchema,
} from "@/lib/validators/auth";

export const createUserSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Nama minimal 2 karakter.")
    .max(80, "Nama maksimal 80 karakter."),
  email: emailSchema,
  password: passwordSchema,
  phone: phoneSchema,
  role: z.enum(ROLES, {
    errorMap: () => ({ message: "Peran pengguna tidak valid." }),
  }),
});

export const updateUserSchema = z
  .object({
    name: z.string().trim().min(2).max(80).optional(),
    phone: phoneSchema,
    role: z.enum(ROLES).optional(),
    isActive: z.boolean().optional(),
  })
  .refine(
    (data) =>
      data.name !== undefined ||
      data.phone !== undefined ||
      data.role !== undefined ||
      data.isActive !== undefined,
    { message: "Tidak ada perubahan yang dikirim." },
  );

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
