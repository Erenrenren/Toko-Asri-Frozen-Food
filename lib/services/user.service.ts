import type { User } from "@prisma/client";

import { conflict, notFound, unauthorized } from "@/lib/api/errors";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { prisma } from "@/lib/db/prisma";
import type { RegisterInput } from "@/lib/validators/auth";
import type { CreateUserInput, UpdateUserInput } from "@/lib/validators/user";
import type { Role, UserDTO } from "@/types/domain";

export function mapUser(user: User): UserDTO {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role as Role,
    isActive: user.isActive,
    createdAt: user.createdAt.toISOString(),
  };
}

export async function authenticateUser(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    throw unauthorized("Email atau password salah.");
  }

  const passwordValid = await verifyPassword(password, user.passwordHash);
  if (!passwordValid) {
    throw unauthorized("Email atau password salah.");
  }

  if (!user.isActive) {
    throw unauthorized("Akun Anda sedang dinonaktifkan. Hubungi admin toko.");
  }

  return mapUser(user);
}

export async function registerCustomer(input: RegisterInput): Promise<UserDTO> {
  const existing = await prisma.user.findUnique({
    where: { email: input.email },
    select: { id: true },
  });

  if (existing) {
    throw conflict("Email sudah terdaftar. Silakan masuk atau gunakan email lain.");
  }

  const passwordHash = await hashPassword(input.password);
  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      phone: input.phone ?? null,
      passwordHash,
      role: "customer",
    },
  });

  return mapUser(user);
}

export interface ListUsersParams {
  search?: string;
  role?: Role;
  status?: "active" | "inactive" | "all";
  page: number;
  pageSize: number;
  skip: number;
}

export async function listUsers(params: ListUsersParams) {
  const where = {
    ...(params.role ? { role: params.role } : {}),
    ...(params.status === "active"
      ? { isActive: true }
      : params.status === "inactive"
        ? { isActive: false }
        : {}),
    ...(params.search
      ? {
          OR: [
            { name: { contains: params.search } },
            { email: { contains: params.search } },
          ],
        }
      : {}),
  };

  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: [{ role: "asc" }, { createdAt: "desc" }],
      skip: params.skip,
      take: params.pageSize,
    }),
  ]);

  return {
    items: users.map(mapUser),
    meta: {
      page: params.page,
      pageSize: params.pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / params.pageSize)),
    },
  };
}

export async function createUser(input: CreateUserInput): Promise<UserDTO> {
  const existing = await prisma.user.findUnique({
    where: { email: input.email },
    select: { id: true },
  });

  if (existing) {
    throw conflict("Email sudah terdaftar.");
  }

  const passwordHash = await hashPassword(input.password);
  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      phone: input.phone ?? null,
      passwordHash,
      role: input.role,
    },
  });

  return mapUser(user);
}

export async function updateUser(
  id: string,
  input: UpdateUserInput,
  actor: { id: string; role: Role },
): Promise<UserDTO> {
  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) {
    throw notFound("Pengguna tidak ditemukan.");
  }

  const isSelf = target.id === actor.id;

  if (isSelf && input.isActive === false) {
    throw conflict("Anda tidak dapat menonaktifkan akun sendiri.");
  }

  if (isSelf && input.role && input.role !== "admin") {
    throw conflict("Anda tidak dapat mengubah peran akun sendiri.");
  }

  const demotesAdmin =
    input.role !== undefined && input.role !== "admin";
  const removesAdmin =
    target.role === "admin" &&
    target.isActive &&
    (demotesAdmin || input.isActive === false);

  if (removesAdmin) {
    const activeAdmins = await prisma.user.count({
      where: { role: "admin", isActive: true },
    });
    if (activeAdmins <= 1) {
      throw conflict("Minimal harus ada satu admin aktif di dalam sistem.");
    }
  }

  const user = await prisma.user.update({
    where: { id },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.phone !== undefined ? { phone: input.phone ?? null } : {}),
      ...(input.role !== undefined ? { role: input.role } : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
    },
  });

  return mapUser(user);
}
