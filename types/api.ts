/**
 * Kontrak response API yang WAJIB dipertahankan pada Tahap 2-4.
 *
 * Sukses:
 * { "success": true, "data": ..., "meta"?: ..., "message"?: ... }
 *
 * Gagal:
 * { "success": false, "error": { "code": "...", "message": "...", "details"?: ... } }
 */

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface ApiSuccess<T> {
  success: true;
  data: T;
  meta?: PaginationMeta;
  message?: string;
}

export interface ApiFailure {
  success: false;
  error: {
    code: ApiErrorCode;
    message: string;
    details?: unknown;
  };
}

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export type ApiErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "INTERNAL_ERROR";

export interface PaginatedResult<T> {
  items: T[];
  meta: PaginationMeta;
}
