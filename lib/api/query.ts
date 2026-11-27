import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from "@/lib/constants";

export function readString(
  params: URLSearchParams,
  key: string,
): string | undefined {
  const value = params.get(key)?.trim();
  return value ? value : undefined;
}

export function readPagination(params: URLSearchParams): {
  page: number;
  pageSize: number;
  skip: number;
} {
  const rawPage = Number(params.get("page") ?? "1");
  const rawPageSize = Number(params.get("pageSize") ?? DEFAULT_PAGE_SIZE);

  const page = Number.isFinite(rawPage) && rawPage > 0 ? Math.floor(rawPage) : 1;
  const pageSize =
    Number.isFinite(rawPageSize) && rawPageSize > 0
      ? Math.min(Math.floor(rawPageSize), MAX_PAGE_SIZE)
      : DEFAULT_PAGE_SIZE;

  return { page, pageSize, skip: (page - 1) * pageSize };
}

export function readDate(
  params: URLSearchParams,
  key: string,
): Date | undefined {
  const value = params.get(key);
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}
