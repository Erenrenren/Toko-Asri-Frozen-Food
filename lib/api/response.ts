import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { ApiError } from "@/lib/api/errors";
import type { ApiFailure, ApiSuccess, PaginationMeta } from "@/types/api";

export function ok<T>(
  data: T,
  meta?: PaginationMeta,
  message?: string,
): NextResponse<ApiSuccess<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      ...(meta ? { meta } : {}),
      ...(message ? { message } : {}),
    },
    { status: 200 },
  );
}

export function created<T>(
  data: T,
  message = "Data berhasil dibuat.",
): NextResponse<ApiSuccess<T>> {
  return NextResponse.json(
    { success: true, data, message },
    { status: 201 },
  );
}

export function fail(
  status: number,
  code: ApiFailure["error"]["code"],
  message: string,
  details?: unknown,
): NextResponse<ApiFailure> {
  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message,
        ...(details !== undefined ? { details } : {}),
      },
    },
    { status },
  );
}

export function handleApiError(error: unknown): NextResponse<ApiFailure> {
  if (error instanceof ApiError) {
    return fail(error.status, error.code, error.message, error.details);
  }

  if (error instanceof ZodError) {
    return fail(
      422,
      "VALIDATION_ERROR",
      "Data yang dikirim tidak valid.",
      error.flatten(),
    );
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      const target = Array.isArray(error.meta?.target)
        ? (error.meta?.target as string[]).join(", ")
        : "data";
      return fail(409, "CONFLICT", `Data dengan ${target} tersebut sudah ada.`);
    }
    if (error.code === "P2025") {
      return fail(404, "NOT_FOUND", "Data tidak ditemukan.");
    }
  }

  console.error("[API_ERROR]", error);
  return fail(
    500,
    "INTERNAL_ERROR",
    "Terjadi kesalahan pada server. Silakan coba lagi.",
  );
}

export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new ApiError(400, "VALIDATION_ERROR", "Body request harus berupa JSON yang valid.");
  }
}
