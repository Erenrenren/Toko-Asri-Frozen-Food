import { Boxes, PackageX, Search, Snowflake, Timer } from "lucide-react";
import Link from "next/link";

import { BatchStatusBadge } from "@/components/scm/scm-badges";
import { Badge } from "@/components/ui/badge";
import { buttonClasses } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { StatCard } from "@/components/ui/stat-card";
import { PRODUCT_UNIT_LABELS } from "@/lib/constants";
import { formatDate, formatNumber } from "@/lib/format";
import {
  getBatchSummary,
  listBatches,
} from "@/lib/services/scm/stock.service";

export const dynamic = "force-dynamic";
export const metadata = { title: "Batch & Expiry" };

const STATUS_OPTIONS = [
  { value: "all", label: "Semua batch" },
  { value: "active", label: "Aktif" },
  { value: "expiring", label: "≤ 30 hari" },
  { value: "expired", label: "Kedaluwarsa" },
  { value: "depleted", label: "Habis" },
];

export default async function BatchesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const rawSearch = typeof params.search === "string" ? params.search : undefined;
  const rawStatus = typeof params.status === "string" ? params.status : "all";
  const rawPage = typeof params.page === "string" ? Number(params.page) : 1;

  const status = ["all", "active", "expiring", "expired", "depleted"].includes(
    rawStatus,
  )
    ? (rawStatus as "all" | "active" | "expiring" | "expired" | "depleted")
    : "all";
  const page = Number.isFinite(rawPage) && rawPage > 0 ? Math.floor(rawPage) : 1;
  const pageSize = 10;

  const [result, summary] = await Promise.all([
    listBatches({
      search: rawSearch,
      status,
      page,
      pageSize,
      skip: (page - 1) * pageSize,
    }),
    getBatchSummary(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Cold chain"
        title="Batch & tanggal kedaluwarsa"
        description="Lacak nomor batch, tanggal produksi, expiry, dan sisa stok untuk produk beku."
        action={
          <Link
            href="/dashboard/scm/stock"
            className={buttonClasses({ variant: "outline" })}
          >
            <Boxes className="h-4 w-4" /> Stok produk
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Batch aktif"
          value={formatNumber(summary.activeBatches)}
          hint="Masih memiliki sisa stok"
          icon={Snowflake}
          tone="green"
        />
        <StatCard
          label="≤ 30 hari"
          value={formatNumber(summary.expiringBatches)}
          hint="Segera jual / FIFO"
          icon={Timer}
          tone="amber"
        />
        <StatCard
          label="Kedaluwarsa"
          value={formatNumber(summary.expiredBatches)}
          hint="Perlu tindakan pemusnahan"
          icon={PackageX}
          tone="rose"
        />
      </div>

      <Card>
        <div className="border-b border-slate-100 p-5 sm:p-6">
          <form className="grid gap-3 sm:grid-cols-[1fr_180px_auto]" method="get">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                name="search"
                defaultValue={rawSearch ?? ""}
                placeholder="Cari batch, nama, atau SKU produk..."
                className="input-base pl-9"
              />
            </div>
            <select
              name="status"
              defaultValue={status}
              className="input-base"
              aria-label="Filter status batch"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <button type="submit" className={buttonClasses()}>
              Terapkan
            </button>
          </form>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
            <Badge tone="slate">{result.meta.total} batch</Badge>
            <span>·</span>
            <span>Urut berdasarkan tanggal kedaluwarsa terdekat.</span>
          </div>
        </div>

        {result.items.length === 0 ? (
          <EmptyState
            icon={Snowflake}
            title="Batch tidak ditemukan"
            description="Batch dibuat otomatis saat penerimaan PO atau stok masuk dengan nomor batch."
            action={
              <Link
                href="/dashboard/scm/purchase-orders/new"
                className={buttonClasses({ size: "sm" })}
              >
                Buat PO restock
              </Link>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr>
                  <th>Batch</th>
                  <th>Produk</th>
                  <th>Produksi</th>
                  <th>Kedaluwarsa</th>
                  <th>Sisa / masuk</th>
                  <th>Supplier</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {result.items.map((batch) => (
                  <tr key={batch.id}>
                    <td>
                      <p className="text-xs font-semibold text-slate-800">
                        {batch.batchNumber}
                      </p>
                      {batch.goodsReceiptNumber && (
                        <p className="text-[10px] text-slate-400">
                          {batch.goodsReceiptNumber}
                        </p>
                      )}
                    </td>
                    <td>
                      <Link
                        href={`/dashboard/scm/stock/${batch.productId}`}
                        className="text-sm font-medium text-slate-800 hover:text-brand-700"
                      >
                        {batch.productName}
                      </Link>
                      <p className="text-[11px] text-slate-400">
                        {batch.sku} · {PRODUCT_UNIT_LABELS[batch.unit]}
                      </p>
                    </td>
                    <td className="whitespace-nowrap text-xs text-slate-600">
                      {batch.productionDate
                        ? formatDate(batch.productionDate)
                        : "—"}
                    </td>
                    <td className="whitespace-nowrap text-xs">
                      <span
                        className={
                          batch.daysToExpiry !== null && batch.daysToExpiry < 0
                            ? "font-semibold text-rose-600"
                            : batch.daysToExpiry !== null &&
                                batch.daysToExpiry <= 30
                              ? "font-semibold text-amber-600"
                              : "text-slate-600"
                        }
                      >
                        {batch.expiryDate ? formatDate(batch.expiryDate) : "—"}
                      </span>
                      {batch.daysToExpiry !== null && (
                        <p className="text-[10px] text-slate-400">
                          {batch.daysToExpiry < 0
                            ? `Lewat ${Math.abs(batch.daysToExpiry)} hari`
                            : `${batch.daysToExpiry} hari lagi`}
                        </p>
                      )}
                    </td>
                    <td className="text-xs text-slate-700">
                      <span className="font-semibold text-slate-900">
                        {formatNumber(batch.remainingQty)}
                      </span>{" "}
                      / {formatNumber(batch.receivedQty)}
                    </td>
                    <td className="max-w-[140px] truncate text-xs text-slate-600">
                      {batch.supplierName ?? "—"}
                    </td>
                    <td>
                      <BatchStatusBadge status={batch.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Pagination
          meta={result.meta}
          basePath="/dashboard/scm/batches"
          query={{ search: rawSearch, status }}
        />
      </Card>
    </div>
  );
}
