import {
  ArrowRight,
  CalendarClock,
  CreditCard,
  Package,
  ShoppingBag,
  Snowflake,
  Sparkles,
  Thermometer,
} from "lucide-react";
import Link from "next/link";

import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { buttonClasses } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { requireUser } from "@/lib/auth/session";
import {
  PRODUCT_CATEGORIES,
  PRODUCT_CATEGORY_LABELS,
  PRODUCT_UNIT_LABELS,
} from "@/lib/constants";
import { formatCurrency, formatNumber } from "@/lib/format";
import { listCustomerCatalog } from "@/lib/services/product.service";
import type { ProductCategory } from "@/types/domain";

export const dynamic = "force-dynamic";

export default async function PortalPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireUser();
  const params = await searchParams;
  const rawCategory =
    typeof params.category === "string" ? params.category : undefined;
  const activeCategory = (PRODUCT_CATEGORIES as readonly string[]).includes(
    rawCategory ?? "",
  )
    ? (rawCategory as ProductCategory)
    : undefined;

  const allProducts = await listCustomerCatalog();
  const products = activeCategory
    ? allProducts.filter((product) => product.category === activeCategory)
    : allProducts;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Portal pelanggan"
        title={`Halo, ${user.name.split(" ")[0]}!`}
        description="Jelajahi katalog frozen food Toko Asri. Harga yang tampil adalah harga jual toko per satuan."
        action={
          <Badge tone="brand" className="px-3 py-1">
            <Snowflake className="h-3.5 w-3.5" /> Katalog aktif
          </Badge>
        }
      />

      <div className="relative overflow-hidden rounded-2xl bg-navy-950 px-6 py-7 text-white sm:px-8">
        <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-brand-500/20 blur-3xl" />
        <div className="relative flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div className="max-w-xl">
            <div className="flex items-center gap-2 text-brand-200">
              <Sparkles className="h-4 w-4" />
              <span className="text-xs font-semibold uppercase tracking-[0.16em]">
                Belanja lebih mudah
              </span>
            </div>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-white">
              Pesanan online & pembayaran segera hadir.
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-300">
              Saat ini Anda dapat melihat katalog dan harga. Fitur keranjang,
              pesanan, loyalty, dan payment gateway akan aktif pada Tahap 3–4.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-center sm:shrink-0">
            <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
              <ShoppingBag className="mx-auto h-4 w-4 text-brand-300" />
              <p className="mt-1.5 text-[10px] text-slate-400">Pesanan</p>
              <p className="text-xs font-semibold text-white">Tahap 4</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
              <CreditCard className="mx-auto h-4 w-4 text-brand-300" />
              <p className="mt-1.5 text-[10px] text-slate-400">Pembayaran</p>
              <p className="text-xs font-semibold text-white">Tahap 4</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Link
          href="/portal"
          className={
            activeCategory
              ? "rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-brand-300 hover:text-brand-700"
              : "rounded-full bg-brand-600 px-3.5 py-1.5 text-xs font-semibold text-white"
          }
        >
          Semua produk
        </Link>
        {PRODUCT_CATEGORIES.map((category) => (
          <Link
            key={category}
            href={`/portal?category=${category}`}
            className={
              activeCategory === category
                ? "rounded-full bg-brand-600 px-3.5 py-1.5 text-xs font-semibold text-white"
                : "rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-brand-300 hover:text-brand-700"
            }
          >
            {PRODUCT_CATEGORY_LABELS[category]}
          </Link>
        ))}
      </div>

      {products.length === 0 ? (
        <EmptyState
          icon={Package}
          title="Belum ada produk pada kategori ini"
          description="Silakan pilih kategori lain atau kembali ke semua produk."
          action={
            <Link href="/portal" className={buttonClasses({ size: "sm" })}>
              Lihat semua produk
            </Link>
          }
          className="rounded-2xl border border-slate-200 bg-white"
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {products.map((product) => (
            <article
              key={product.id}
              className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-float"
            >
              <div className="relative flex h-36 items-center justify-center overflow-hidden bg-gradient-to-br from-brand-50 via-white to-sky-50">
                <div className="absolute inset-0 bg-grid-frost bg-[size:20px_20px] opacity-60" />
                <Snowflake className="relative h-12 w-12 text-brand-500/70 transition group-hover:scale-110" />
                <span className="absolute left-3 top-3">
                  <Badge tone="brand">
                    {PRODUCT_CATEGORY_LABELS[product.category]}
                  </Badge>
                </span>
                {product.stockQty === 0 ? (
                  <span className="absolute right-3 top-3">
                    <Badge tone="rose">Habis</Badge>
                  </span>
                ) : (
                  <span className="absolute right-3 top-3">
                    <Badge tone="green">Tersedia</Badge>
                  </span>
                )}
              </div>

              <div className="flex flex-1 flex-col p-5">
                <p className="text-[11px] font-medium text-slate-400">
                  {product.sku}
                </p>
                <h3 className="mt-0.5 text-base font-semibold text-slate-900">
                  {product.name}
                </h3>
                <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-slate-500">
                  {product.description ?? "Produk frozen food pilihan Toko Asri."}
                </p>

                <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-slate-500">
                  <span className="inline-flex items-center gap-1 rounded-lg bg-slate-50 px-2 py-1">
                    <Thermometer className="h-3 w-3 text-brand-500" />
                    {product.storageTemperature !== null
                      ? `${product.storageTemperature}°C`
                      : "Beku"}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-lg bg-slate-50 px-2 py-1">
                    <CalendarClock className="h-3 w-3 text-brand-500" />
                    {product.shelfLifeDays
                      ? `${product.shelfLifeDays} hari`
                      : "—"}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-lg bg-slate-50 px-2 py-1">
                    <Package className="h-3 w-3 text-brand-500" />
                    {formatNumber(product.stockQty)}{" "}
                    {PRODUCT_UNIT_LABELS[product.unit]}
                  </span>
                </div>

                <div className="mt-auto flex items-end justify-between gap-3 pt-5">
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-slate-400">
                      Harga
                    </p>
                    <p className="text-lg font-bold text-slate-900">
                      {formatCurrency(product.sellPrice)}
                      <span className="ml-1 text-[11px] font-normal text-slate-400">
                        / {PRODUCT_UNIT_LABELS[product.unit]}
                      </span>
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled
                    className="inline-flex h-9 cursor-not-allowed items-center gap-1.5 rounded-xl bg-slate-100 px-3 text-xs font-semibold text-slate-400"
                    title="Pemesanan online tersedia pada Tahap 4"
                  >
                    Pesan <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <Alert tone="info" title="Catatan untuk pelanggan">
        Harga dan ketersediaan dapat berubah. Untuk pemesanan saat ini, silakan
        hubungi admin Toko Asri Frozen Food. Fitur pemesanan mandiri akan hadir
        pada tahap pengembangan berikutnya.
      </Alert>
    </div>
  );
}
