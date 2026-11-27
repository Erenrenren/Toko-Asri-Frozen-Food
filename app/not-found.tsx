import { Home, Snowflake } from "lucide-react";
import Link from "next/link";

import { buttonClasses } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="card w-full max-w-lg p-8 text-center sm:p-10">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand-50 text-brand-600 ring-1 ring-brand-100">
          <Snowflake className="h-7 w-7" />
        </span>
        <p className="mt-5 text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
          404
        </p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">
          Halaman tidak ditemukan
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-500">
          Halaman yang Anda cari mungkin sudah dipindahkan atau belum tersedia
          pada Tahap 1.
        </p>
        <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
          <Link href="/" className={buttonClasses()}>
            <Home className="h-4 w-4" /> Kembali ke beranda
          </Link>
          <Link
            href="/dashboard"
            className={buttonClasses({ variant: "outline" })}
          >
            Buka dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
