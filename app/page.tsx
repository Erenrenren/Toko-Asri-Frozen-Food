import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  CreditCard,
  Database,
  Layers,
  LockKeyhole,
  Package,
  Snowflake,
  Truck,
  Users,
  Wallet,
} from "lucide-react";
import Link from "next/link";

import { Logo } from "@/components/brand/logo";
import { buttonClasses } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getCurrentUser } from "@/lib/auth/session";
import { defaultRouteForRole } from "@/lib/auth/rbac";
import { formatCompactCurrency } from "@/lib/format";

export const dynamic = "force-dynamic";

const modules = [
  {
    icon: Package,
    title: "ERP Inti",
    stage: "Tahap 1 · Aktif",
    tone: "brand" as const,
    description:
      "Master produk frozen food, SKU, HPP, harga jual, satuan, serta jurnal pemasukan dan pengeluaran.",
    href: "/dashboard",
  },
  {
    icon: Truck,
    title: "Supply Chain (SCM)",
    stage: "Tahap 2",
    tone: "sky" as const,
    description:
      "Rencana restock, supplier, purchase order, dan pemantauan cold-chain akan ditambahkan pada tahap berikutnya.",
    href: "/dashboard/scm",
  },
  {
    icon: Users,
    title: "Customer Relation (CRM)",
    stage: "Tahap 3",
    tone: "violet" as const,
    description:
      "Loyalty pelanggan, riwayat pembelian, dan segmentasi pelanggan disiapkan sebagai modul terpisah.",
    href: "/dashboard/crm",
  },
  {
    icon: CreditCard,
    title: "Pembayaran",
    stage: "Tahap 4",
    tone: "amber" as const,
    description:
      "Integrasi payment gateway, rekonsiliasi pembayaran, dan status pesanan pelanggan.",
    href: "/dashboard/payments",
  },
];

const foundations = [
  {
    icon: LockKeyhole,
    title: "Autentikasi & RBAC",
    description:
      "Login JWT httpOnly dengan peran admin, staff, dan customer. Setiap route dan API dilindungi sesuai peran.",
  },
  {
    icon: Database,
    title: "Kontrak data konsisten",
    description:
      "Response API seragam, tipe domain bersama, dan validasi Zod agar modul tahap 2–4 tinggal menyambung.",
  },
  {
    icon: Layers,
    title: "Struktur modular",
    description:
      "Pemisahan app router, komponen UI, service layer, validator, dan Prisma schema yang siap berkembang.",
  },
];

export default async function LandingPage() {
  const user = await getCurrentUser();
  const primaryHref = user ? defaultRouteForRole(user.role) : "/login";
  const primaryLabel = user
    ? user.role === "customer"
      ? "Buka Portal Pelanggan"
      : "Buka Dashboard ERP"
    : "Masuk ke Dashboard";

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/85 backdrop-blur-md">
        <div className="container-page flex h-16 items-center justify-between">
          <Link href="/" aria-label="Toko Asri Frozen Food">
            <Logo />
          </Link>
          <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex">
            <a href="#modul" className="hover:text-brand-700">
              Modul
            </a>
            <a href="#fondasi" className="hover:text-brand-700">
              Fondasi
            </a>
            <a href="#alur" className="hover:text-brand-700">
              Alur Tahap
            </a>
          </nav>
          <div className="flex items-center gap-2">
            {user ? (
              <Link href={primaryHref} className={buttonClasses({ size: "sm" })}>
                {primaryLabel}
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            ) : (
              <>
                <Link
                  href="/register"
                  className={buttonClasses({ variant: "ghost", size: "sm" })}
                >
                  Daftar
                </Link>
                <Link href="/login" className={buttonClasses({ size: "sm" })}>
                  Masuk
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden border-b border-slate-200 bg-slate-50">
        <div className="absolute inset-0 bg-grid-frost bg-[size:36px_36px]" />
        <div className="absolute -right-32 -top-24 h-96 w-96 rounded-full bg-brand-200/50 blur-3xl" />
        <div className="absolute -bottom-32 left-1/4 h-80 w-80 rounded-full bg-accent-200/40 blur-3xl" />

        <div className="container-page relative grid gap-12 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-24">
          <div>
            <Badge tone="brand" className="mb-5 px-3 py-1">
              <Snowflake className="h-3.5 w-3.5" />
              SaaS ERP untuk Toko Asri Frozen Food
            </Badge>
            <h1 className="max-w-2xl text-balance text-4xl font-bold leading-[1.08] tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
              Kelola katalog beku, kas, dan operasional toko dalam satu sistem.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-600">
              Fondasi aplikasi SaaS untuk tugas akhir Sistem Informasi Manajemen:
              autentikasi berbasis peran, master produk frozen food, pencatatan
              transaksi, dan dashboard laba kotor yang transparan.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href={primaryHref}
                className={buttonClasses({ size: "lg", variant: "primary" })}
              >
                {primaryLabel}
                <ArrowRight className="h-4 w-4" />
              </Link>
              {!user && (
                <Link
                  href="/register"
                  className={buttonClasses({ size: "lg", variant: "outline" })}
                >
                  Buat akun pelanggan
                </Link>
              )}
            </div>

            <div className="mt-10 grid max-w-lg grid-cols-3 gap-4 border-t border-slate-200 pt-6">
              {[
                { value: "3", label: "Peran pengguna" },
                { value: "7", label: "Kategori produk" },
                { value: "100%", label: "Kontrak API" },
              ].map((stat) => (
                <div key={stat.label}>
                  <p className="text-2xl font-bold tracking-tight text-slate-900">
                    {stat.value}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-brand-500/20 via-transparent to-accent-300/20 blur-2xl" />
            <div className="relative rounded-2xl border border-slate-200 bg-white p-4 shadow-float sm:p-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2.5">
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-50 text-brand-600 ring-1 ring-brand-100">
                    <BarChart3 className="h-[18px] w-[18px]" />
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-slate-900">
                      Ringkasan Bulan Ini
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Toko Asri Frozen Food
                    </p>
                  </div>
                </div>
                <Badge tone="green">Live demo</Badge>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-slate-900 p-4 text-white">
                  <p className="text-[10px] uppercase tracking-wide text-slate-400">
                    Omzet
                  </p>
                  <p className="mt-1 text-xl font-bold">
                    {formatCompactCurrency(4_860_000)}
                  </p>
                  <p className="mt-1 text-[10px] text-emerald-300">
                    +12,4% vs bulan lalu
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-[10px] uppercase tracking-wide text-slate-500">
                    Laba kotor
                  </p>
                  <p className="mt-1 text-xl font-bold text-slate-900">
                    {formatCompactCurrency(1_742_000)}
                  </p>
                  <p className="mt-1 text-[10px] text-brand-700">
                    Margin 35,8%
                  </p>
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-slate-200 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-slate-700">
                    Tren penjualan 7 hari
                  </p>
                  <span className="text-[10px] text-slate-400">Rupiah</span>
                </div>
                <div className="mt-4 flex h-28 items-end gap-2">
                  {[42, 65, 48, 78, 58, 88, 72].map((height, index) => (
                    <div
                      key={index}
                      className="flex-1 rounded-t-md bg-gradient-to-t from-brand-600 to-brand-300"
                      style={{ height: `${height}%` }}
                    />
                  ))}
                </div>
                <div className="mt-2 flex justify-between text-[9px] text-slate-400">
                  {["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"].map((day) => (
                    <span key={day}>{day}</span>
                  ))}
                </div>
              </div>

              <div className="mt-4 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-amber-100 text-amber-700">
                  <Package className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-amber-900">
                    2 produk stok menipis
                  </p>
                  <p className="text-[11px] text-amber-700">
                    Ikan Dori Fillet & Dimsum Udang Hakau
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="modul" className="container-page py-16 lg:py-24">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
            Peta modul
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
            Satu fondasi, empat tahap pengembangan.
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-600">
            Tahap 1 menyiapkan fondasi yang tidak akan diubah kontraknya. Modul
            SCM, CRM, dan pembayaran sudah memiliki pintu masuk dan placeholder
            yang aman.
          </p>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {modules.map((module) => {
            const Icon = module.icon;
            return (
              <div
                key={module.title}
                className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-card transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-float"
              >
                <div className="flex items-start justify-between gap-4">
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-600 ring-1 ring-brand-100">
                    <Icon className="h-5 w-5" />
                  </span>
                  <Badge tone={module.tone}>{module.stage}</Badge>
                </div>
                <h3 className="mt-4 text-lg font-semibold text-slate-900">
                  {module.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  {module.description}
                </p>
                <Link
                  href={module.href}
                  className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-brand-700 hover:text-brand-800"
                >
                  Lihat modul <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            );
          })}
        </div>
      </section>

      <section id="fondasi" className="border-y border-slate-200 bg-slate-50">
        <div className="container-page py-16 lg:py-24">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
                Fondasi Tahap 1
              </p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                Dibangun agar tim tahap berikutnya tidak bentrok.
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                Semua modul berbagi tipe domain, format response API, dan
                struktur folder yang sama. Perubahan pada tahap 2–4 cukup
                menambah service dan route baru.
              </p>
              <div className="mt-6 space-y-2.5">
                {[
                  "JWT httpOnly + middleware proteksi route",
                  "Validasi input berlapis dengan Zod",
                  "Service layer terpisah dari komponen UI",
                  "Prisma schema siap migrasi ke PostgreSQL",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2 text-sm text-slate-700">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {foundations.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.title}
                    className="rounded-2xl border border-slate-200 bg-white p-5"
                  >
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-slate-900 text-brand-300">
                      <Icon className="h-5 w-5" />
                    </span>
                    <h3 className="mt-4 text-sm font-semibold text-slate-900">
                      {item.title}
                    </h3>
                    <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
                      {item.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section id="alur" className="container-page py-16 lg:py-24">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
            Alur pengembangan
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
            Tahap 1 selesai, tiga tahap berikutnya tinggal menyambung.
          </h2>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-4">
          {[
            {
              step: "01",
              title: "Fondasi & ERP",
              detail: "Auth RBAC, produk, transaksi, dashboard.",
              active: true,
            },
            {
              step: "02",
              title: "SCM",
              detail: "Supplier, restock, purchase order, cold-chain.",
              active: false,
            },
            {
              step: "03",
              title: "CRM",
              detail: "Loyalty, riwayat pelanggan, segmentasi.",
              active: false,
            },
            {
              step: "04",
              title: "Pembayaran",
              detail: "Gateway, rekonsiliasi, status pesanan.",
              active: false,
            },
          ].map((item) => (
            <div
              key={item.step}
              className={
                item.active
                  ? "rounded-2xl border border-brand-200 bg-brand-50 p-5 ring-1 ring-brand-100"
                  : "rounded-2xl border border-slate-200 bg-white p-5"
              }
            >
              <div className="flex items-center justify-between">
                <span
                  className={
                    item.active
                      ? "text-xs font-bold text-brand-700"
                      : "text-xs font-bold text-slate-400"
                  }
                >
                  {item.step}
                </span>
                {item.active && <Badge tone="green">Aktif</Badge>}
              </div>
              <h3 className="mt-3 text-sm font-semibold text-slate-900">
                {item.title}
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">
                {item.detail}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="container-page pb-16 lg:pb-24">
        <div className="relative overflow-hidden rounded-3xl bg-navy-950 px-6 py-12 text-white sm:px-10 lg:px-14 lg:py-16">
          <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-brand-500/20 blur-3xl" />
          <div className="absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-accent-400/10 blur-3xl" />
          <div className="relative flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-center">
            <div className="max-w-xl">
              <div className="flex items-center gap-2 text-brand-200">
                <Wallet className="h-5 w-5" />
                <span className="text-xs font-semibold uppercase tracking-[0.16em]">
                  Siap dicoba
                </span>
              </div>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Mulai dari dashboard, atau jelajahi katalog sebagai pelanggan.
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-300">
                Gunakan akun demo untuk melihat perbedaan akses admin, staff, dan
                customer secara langsung.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href={primaryHref}
                className={buttonClasses({ variant: "accent", size: "lg" })}
              >
                {primaryLabel} <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/login"
                className={buttonClasses({
                  variant: "outline",
                  size: "lg",
                  className:
                    "border-white/20 bg-white/5 text-white hover:border-white/40 hover:bg-white/10 hover:text-white",
                })}
              >
                Lihat akun demo
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white">
        <div className="container-page flex flex-col items-center justify-between gap-4 py-8 sm:flex-row">
          <Logo />
          <p className="text-center text-xs text-slate-500">
            © {new Date().getFullYear()} Toko Asri Frozen Food · Tugas Akhir Sistem
            Informasi Manajemen.
          </p>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Snowflake className="h-3.5 w-3.5 text-brand-600" />
            Tahap 1 · Fondasi ERP
          </div>
        </div>
      </footer>
    </div>
  );
}
