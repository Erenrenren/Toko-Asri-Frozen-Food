import { Snowflake } from "lucide-react";
import type { ReactNode } from "react";

import { Logo } from "@/components/brand/logo";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 lg:grid lg:grid-cols-2">
      <aside className="relative hidden overflow-hidden bg-navy-950 p-10 text-white lg:flex lg:flex-col lg:justify-between xl:p-14">
        <div className="absolute inset-0 bg-grid-frost bg-[size:32px_32px] opacity-40" />
        <div className="absolute -right-24 top-16 h-80 w-80 rounded-full bg-brand-500/20 blur-3xl" />
        <div className="absolute -bottom-20 -left-16 h-72 w-72 rounded-full bg-accent-400/10 blur-3xl" />

        <div className="relative">
          <Logo variant="light" />
        </div>

        <div className="relative max-w-md">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-brand-200">
            <Snowflake className="h-3.5 w-3.5" />
            Sistem Informasi Manajemen · Tahap 1
          </span>
          <h2 className="mt-5 text-4xl font-bold leading-tight tracking-tight text-white">
            Satu sistem untuk katalog, kas, dan operasional frozen food.
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-slate-300">
            Fondasi ERP Toko Asri Frozen Food dirancang modular: autentikasi
            berbasis peran, master produk, jurnal kas, dan dashboard metrik yang
            siap disambungkan ke modul SCM, CRM, dan pembayaran.
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {[
              "RBAC admin, staff, customer",
              "Katalog SKU & HPP",
              "Jurnal pemasukan/pengeluaran",
              "Dashboard omzet & laba kotor",
            ].map((item) => (
              <div
                key={item}
                className="rounded-xl border border-white/10 bg-white/5 px-3.5 py-3 text-xs font-medium text-slate-200"
              >
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="relative text-xs text-slate-400">
          © {new Date().getFullYear()} Toko Asri Frozen Food. Tugas akhir SIM.
        </div>
      </aside>

      <main className="flex min-h-screen items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <div className="mb-8 flex justify-center lg:hidden">
            <Logo />
          </div>
          <div className="card p-6 shadow-float sm:p-8">{children}</div>
          <p className="mt-5 text-center text-[11px] text-slate-400">
            Dengan masuk, Anda menyetujui penggunaan data untuk keperluan operasional toko.
          </p>
        </div>
      </main>
    </div>
  );
}
