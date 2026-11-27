import type { ApiErrorCode } from "@/types/api";

export class ApiError extends Error {
  readonly status: number;
  readonly code: ApiErrorCode;
  readonly details?: unknown;

  constructor(
    status: number,
    code: ApiErrorCode,
    message: string,
    details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function badRequest(message: string, details?: unknown) {
  return new ApiError(400, "VALIDATION_ERROR", message, details);
}

export function unauthorized(message = "Silakan masuk terlebih dahulu.") {
  return new ApiError(401, "UNAUTHORIZED", message);
}

export function forbidden(message = "Anda tidak memiliki akses ke aksi ini.") {
  return new ApiError(403, "FORBIDDEN", message);
}

export function notFound(message = "Data tidak ditemukan.") {
  return new ApiError(404, "NOT_FOUND", message);
}

export function conflict(message: string, details?: unknown) {
  return new ApiError(409, "CONFLICT", message, details);
}

export function validationError(message: string, details?: unknown) {
  return new ApiError(422, "VALIDATION_ERROR", message, details);
}
