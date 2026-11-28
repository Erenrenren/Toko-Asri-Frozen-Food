import {
  AlertTriangle,
  Boxes,
  PackageX,
  Search,
  Warehouse,
} from "lucide-react";
import Link from "next/link";

import { StockLevelBadge } from "@/components/scm/scm-badges";
import { Badge } from "@/components/ui/badge";
import { buttonClasses } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { StatCard } from "@/components/ui/stat-card";
import {
  PRODUCT_CATEGORIES,
  PRODUCT_CATEGORY_LABELS,
  PRODUCT_UNIT_LABELS,
} from "@/lib/constants";
import { formatCurrency, formatDate, formatNumber } from "@/lib/format";
import {
  getStockSummary,
  listStockLevels,
} from "@/lib/services/scm/stock.service";
import type { ProductCategory } from "@/types/domain";

export const dynamic = "force-dynamic";
export const metadata = { title: "Stok & Cold Chain" };

export default async function StockPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const rawSearch = typeof params.search === "string" ? params.search : undefined;
  const rawCategory =
    typeof params.category === "string" ? params.category : undefined;
  const rawStatus = typeof params.status === "string" ? params.status : "all";
  const rawPage = typeof params.page === "string" ? Number(params.page) : 1;

  const category = (PRODUCT_CATEGORIES as readonly string[]).includes(
    rawCategory ?? "",
  )
    ? (rawCategory as ProductCategory)
    : undefined;
  const status = ["all", "healthy", "low", "out"].includes(rawStatus)
    ? (rawStatus as "all" | "healthy" | "low" | "out")
    : "all";
  const page = Number.isFinite(rawPage) && rawPage > 0 ? Math.floor(rawPage) : 1;
  const pageSize = 10;

  const [result, summary] = await Promise.all([
    listStockLevels({
      search: rawSearch,
      category,
      status,
      page,
      pageSize,
      skip: (page - 1) * pageSize,
    }),
    getStockSummary(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Gudang & cold chain"
        title="Stok & reorder point"
        description="Bandingkan stok tersedia dengan stok minimum, pantau batch beku, dan catat mutasi stok."
        action={
          <Link
            href="/dashboard/scm/batches"
            className={buttonClasses({ variant: "outline" })}
          >
            <Boxes className="h-4 w-4" /> Batch & expiry
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total SKU aktif"
          value={formatNumber(summary.totalSkus)}
          hint="Produk aktif di katalog"
          icon={Warehouse}
          tone="brand"
        />
        <StatCard
          label="Stok menipis"
          value={formatNumber(summary.lowStockProducts)}
          hint="Menyentuh reorder point"
          icon={AlertTriangle}
          tone="amber"
        />
        <StatCard
          label="Stok habis"
          value={formatNumber(summary.outOfStockProducts)}
          hint="Perlu restock segera"
          icon={PackageX}
          tone="rose"
        />
        <StatCard
          label="Nilai persediaan"
          value={formatCurrency(summary.totalStockValue)}
          hint="Stok × HPP"
          icon={Boxes}
          tone="green"
        />
      </div>

      <Card>
        <div className="border-b border-slate-100 p-5 sm:p-6">
          <form
            className="grid gap-3 sm:grid-cols-[1fr_170px_170px_auto]"
            method="get"
          >
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                name="search"
                defaultValue={rawSearch ?? ""}
                placeholder="Cari nama atau SKU..."
                className="input-base pl-9"
              />
            </div>
            <select
              name="category"
              defaultValue={category ?? ""}
              className="input-base"
              aria-label="Filter kategori"
            >
              <option value="">Semua kategori</option>
              {PRODUCT_CATEGORIES.map((item) => (
                <option key={item} value={item}>
                  {PRODUCT_CATEGORY_LABELS[item]}
                </option>
              ))}
            </select>
            <select
              name="status"
              defaultValue={status}
              className="input-base"
              aria-label="Filter status stok"
            >
              <option value="all">Semua status</option>
              <option value="healthy">Aman</option>
              <option value="low">Menipis</option>
              <option value="out">Habis</option>
            </select>
            <button type="submit" className={buttonClasses()}>
              Terapkan
            </button>
          </form>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
            <Badge tone="slate">{result.meta.total} produk</Badge>
            <span>·</span>
            <span>
              Status dihitung dari <code>stockQty</code> terhadap{" "}
              <code>minStockQty</code>.
            </span>
          </div>
        </div>

        {result.items.length === 0 ? (
          <EmptyState
            icon={Warehouse}
            title="Tidak ada produk pada filter ini"
            description="Ubah filter atau tambahkan produk baru di katalog."
            action={
              <Link
                href="/dashboard/products/new"
                className={buttonClasses({ size: "sm" })}
              >
                Tambah produk
              </Link>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr>
                  <th>Produk</th>
                  <th>Stok tersedia</th>
                  <th>Reorder point</th>
                  <th>Status</th>
                  <th>Batch aktif</th>
                  <th>Expiry terdekat</th>
                  <th>Nilai stok</th>
                  <th className="text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {result.items.map((item) => (
                  <tr key={item.productId}>
                    <td>
                      <p className="max-w-[220px] truncate text-sm font-semibold text-slate-800">
                        {item.name}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {item.sku} · {PRODUCT_CATEGORY_LABELS[item.category]}
                      </p>
                    </td>
                    <td>
                      <p className="text-sm font-bold text-slate-900">
                        {formatNumber(item.stockQty)}{" "}
                        <span className="text-[11px] font-normal text-slate-400">
                          {PRODUCT_UNIT_LABELS[item.unit]}
                        </span>
                      </p>
                      <div className="mt-1 h-1.5 w-24 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className={
                            item.status === "out"
                              ? "h-full rounded-full bg-rose-500"
                              : item.status === "low"
                                ? "h-full rounded-full bg-amber-500"
                                : "h-full rounded-full bg-emerald-500"
                          }
                          style={{
                            width: `${Math.min(
                              100,
                              item.minStockQty > 0
                                ? (item.stockQty / (item.minStockQty * 2)) * 100
                                : 100,
                            )}%`,
                          }}
                        />
                      </div>
                    </td>
                    <td className="text-xs text-slate-600">
                      {formatNumber(item.minStockQty)}{" "}
                      {PRODUCT_UNIT_LABELS[item.unit]}
                    </td>
                    <td>
                      <StockLevelBadge status={item.status} />
                    </td>
                    <td>
                      <Badge tone={item.activeBatches > 0 ? "sky" : "slate"}>
                        {formatNumber(item.activeBatches)} batch
                      </Badge>
                    </td>
                    <td className="whitespace-nowrap text-xs text-slate-600">
                      {item.nearestExpiry
                        ? formatDate(item.nearestExpiry)
                        : "—"}
                    </td>
                    <td className="whitespace-nowrap text-sm font-semibold text-slate-800">
                      {formatCurrency(item.stockValue)}
                    </td>
                    <td className="text-right">
                      <Link
                        href={`/dashboard/scm/stock/${item.productId}`}
                        className="text-xs font-semibold text-brand-700 hover:text-brand-800"
                      >
                        Kelola
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Pagination
          meta={result.meta}
          basePath="/dashboard/scm/stock"
          query={{ search: rawSearch, category, status }}
        />
      </Card>
    </div>
  );
}
