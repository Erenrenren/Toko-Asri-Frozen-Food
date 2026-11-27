import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

import { buildQueryString, cn } from "@/lib/format";
import type { PaginationMeta } from "@/types/api";

interface PaginationProps {
  meta: PaginationMeta;
  basePath: string;
  query?: Record<string, string | number | undefined | null>;
}

export function Pagination({ meta, basePath, query = {} }: PaginationProps) {
  if (meta.total === 0) return null;

  const from = (meta.page - 1) * meta.pageSize + 1;
  const to = Math.min(meta.page * meta.pageSize, meta.total);

  const prevHref = `${basePath}${buildQueryString({
    ...query,
    page: meta.page - 1,
  })}`;
  const nextHref = `${basePath}${buildQueryString({
    ...query,
    page: meta.page + 1,
  })}`;

  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:px-6">
      <p className="text-xs text-slate-500">
        Menampilkan <span className="font-semibold text-slate-700">{from}</span>–
        <span className="font-semibold text-slate-700">{to}</span> dari{" "}
        <span className="font-semibold text-slate-700">{meta.total}</span> data
      </p>
      <div className="flex items-center gap-2">
        <Link
          href={prevHref}
          aria-disabled={meta.page <= 1}
          className={cn(
            "inline-flex h-9 items-center gap-1 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-600 transition hover:border-brand-300 hover:text-brand-700",
            meta.page <= 1 && "pointer-events-none opacity-40",
          )}
        >
          <ChevronLeft className="h-3.5 w-3.5" /> Sebelumnya
        </Link>
        <span className="px-1 text-xs font-medium text-slate-500">
          {meta.page} / {meta.totalPages}
        </span>
        <Link
          href={nextHref}
          aria-disabled={meta.page >= meta.totalPages}
          className={cn(
            "inline-flex h-9 items-center gap-1 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-600 transition hover:border-brand-300 hover:text-brand-700",
            meta.page >= meta.totalPages && "pointer-events-none opacity-40",
          )}
        >
          Berikutnya <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
