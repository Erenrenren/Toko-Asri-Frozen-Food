"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="card w-full max-w-lg p-8 text-center sm:p-10">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-rose-50 text-rose-600 ring-1 ring-rose-100">
          <AlertTriangle className="h-7 w-7" />
        </span>
        <h1 className="mt-5 text-2xl font-bold text-slate-900">
          Terjadi kesalahan
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-500">
          Sistem tidak dapat memproses permintaan ini. Coba muat ulang halaman,
          atau kembali ke dashboard.
        </p>
        {error.digest && (
          <p className="mt-2 text-[11px] text-slate-400">Kode: {error.digest}</p>
        )}
        <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
          <Button onClick={reset}>
            <RotateCcw className="h-4 w-4" /> Coba lagi
          </Button>
          <Link
            href="/dashboard"
            className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Kembali ke dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
