import { ArrowLeftRight, Search, Warehouse } from "lucide-react";
import Link from "next/link";

import { MovementTypeBadge } from "@/components/scm/scm-badges";
import { Badge } from "@/components/ui/badge";
import { buttonClasses } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import {
  STOCK_MOVEMENT_REASONS,
  STOCK_MOVEMENT_REASON_LABELS,
  STOCK_MOVEMENT_TYPES,
  STOCK_MOVEMENT_TYPE_LABELS,
} from "@/lib/constants";
import { formatDateTime, formatNumber } from "@/lib/format";
import { getStockLevel, listStockMovements } from "@/lib/services/scm/stock.service";
import type { StockMovementReason, StockMovementType } from "@/types/domain";

export const dynamic = "force-dynamic";
export const metadata = { title: "Mutasi Stok" };

export default async function StockMovementsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const rawSearch = typeof params.search === "string" ? params.search : undefined;
  const rawType = typeof params.type === "string" ? params.type : "";
  const rawReason = typeof params.reason === "string" ? params.reason : "";
  const rawProductId =
    typeof params.productId === "string" ? params.productId : undefined;
  const rawPage = typeof params.page === "string" ? Number(params.page) : 1;

  const type = (STOCK_MOVEMENT_TYPES as readonly string[]).includes(rawType)
    ? (rawType as StockMovementType)
    : undefined;
  const reason = (STOCK_MOVEMENT_REASONS as readonly string[]).includes(rawReason)
    ? (rawReason as StockMovementReason)
    : undefined;
  const page = Number.isFinite(rawPage) && rawPage > 0 ? Math.floor(rawPage) : 1;
  const pageSize = 15;

  const [result, product] = await Promise.all([
    listStockMovements({
      search: rawSearch,
      productId: rawProductId,
      type,
      reason,
      page,
      pageSize,
      skip: (page - 1) * pageSize,
    }),
    rawProductId ? getStockLevel(rawProductId) : Promise.resolve(null),
  ]);

  const totalIn = result.items
    .filter((item) => item.quantity > 0)
    .reduce((sum, item) => sum + item.quantity, 0);
  const totalOut = result.items
    .filter((item) => item.quantity < 0)
    .reduce((sum, item) => sum + Math.abs(item.quantity), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Audit persediaan"
        title="Mutasi stok"
        description="Jejak lengkap barang masuk, keluar, dan penyesuaian stok opname."
        action={
          <Link
            href="/dashboard/scm/stock"
            className={buttonClasses({ variant: "outline" })}
          >
            <Warehouse className="h-4 w-4" /> Stok produk
          </Link>
        }
      />

      {product && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-brand-100 bg-brand-50 px-4 py-3 text-xs text-brand-800">
          <span>Filter produk:</span>
          <Badge tone="brand">
            {product.name} ({product.sku})
          </Badge>
          <Link
            href="/dashboard/scm/stock-movements"
            className="ml-auto font-semibold text-brand-700 hover:text-brand-900"
          >
            Tampilkan semua
          </Link>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card flex items-center gap-4 p-4">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
            <ArrowLeftRight className="h-5 w-5" />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Total masuk (halaman ini)
            </p>
            <p className="text-xl font-bold text-slate-900">
              +{formatNumber(totalIn)}
            </p>
          </div>
        </div>
        <div className="card flex items-center gap-4 p-4">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-sky-50 text-sky-600 ring-1 ring-sky-100">
            <ArrowLeftRight className="h-5 w-5" />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Total keluar (halaman ini)
            </p>
            <p className="text-xl font-bold text-slate-900">
              -{formatNumber(totalOut)}
            </p>
          </div>
        </div>
        <div className="card flex items-center gap-4 p-4">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-600 ring-1 ring-brand-100">
            <Warehouse className="h-5 w-5" />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Total mutasi
            </p>
            <p className="text-xl font-bold text-slate-900">
              {formatNumber(result.meta.total)}
            </p>
          </div>
        </div>
      </div>

      <Card>
        <div className="border-b border-slate-100 p-5 sm:p-6">
          <form
            className="grid gap-3 sm:grid-cols-[1fr_170px_200px_auto]"
            method="get"
          >
            {rawProductId && (
              <input type="hidden" name="productId" value={rawProductId} />
            )}
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                name="search"
                defaultValue={rawSearch ?? ""}
                placeholder="Cari referensi, produk, atau batch..."
                className="input-base pl-9"
              />
            </div>
            <select
              name="type"
              defaultValue={type ?? ""}
              className="input-base"
              aria-label="Filter jenis mutasi"
            >
              <option value="">Semua jenis</option>
              {STOCK_MOVEMENT_TYPES.map((item) => (
                <option key={item} value={item}>
                  {STOCK_MOVEMENT_TYPE_LABELS[item]}
                </option>
              ))}
            </select>
            <select
              name="reason"
              defaultValue={reason ?? ""}
              className="input-base"
              aria-label="Filter alasan mutasi"
            >
              <option value="">Semua alasan</option>
              {STOCK_MOVEMENT_REASONS.map((item) => (
                <option key={item} value={item}>
                  {STOCK_MOVEMENT_REASON_LABELS[item]}
                </option>
              ))}
            </select>
            <button type="submit" className={buttonClasses()}>
              Terapkan
            </button>
          </form>
        </div>

        {result.items.length === 0 ? (
          <EmptyState
            icon={ArrowLeftRight}
            title="Belum ada mutasi"
            description="Mutasi tercatat saat penerimaan PO, stok keluar, atau stock opname."
            action={
              <Link
                href="/dashboard/scm/stock"
                className={buttonClasses({ size: "sm" })}
              >
                Pilih produk
              </Link>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr>
                  <th>Waktu / referensi</th>
                  <th>Produk</th>
                  <th>Jenis</th>
                  <th>Alasan</th>
                  <th>Qty</th>
                  <th>Stok sebelum → sesudah</th>
                  <th>Batch</th>
                  <th>Oleh</th>
                </tr>
              </thead>
              <tbody>
                {result.items.map((movement) => (
                  <tr key={movement.id}>
                    <td className="whitespace-nowrap">
                      <p className="text-xs text-slate-700">
                        {formatDateTime(movement.occurredAt)}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {movement.reference}
                      </p>
                    </td>
                    <td>
                      <Link
                        href={`/dashboard/scm/stock/${movement.productId}`}
                        className="text-xs font-medium text-slate-800 hover:text-brand-700"
                      >
                        {movement.productName}
                      </Link>
                      <p className="text-[10px] text-slate-400">{movement.sku}</p>
                    </td>
                    <td>
                      <MovementTypeBadge type={movement.type} />
                    </td>
                    <td className="text-xs text-slate-600">
                      {STOCK_MOVEMENT_REASON_LABELS[movement.reason]}
                    </td>
                    <td
                      className={
                        movement.quantity > 0
                          ? "text-xs font-bold text-emerald-600"
                          : "text-xs font-bold text-rose-600"
                      }
                    >
                      {movement.quantity > 0 ? "+" : ""}
                      {formatNumber(movement.quantity)}
                    </td>
                    <td className="whitespace-nowrap text-xs text-slate-600">
                      {formatNumber(movement.stockBefore)} →{" "}
                      <span className="font-semibold text-slate-900">
                        {formatNumber(movement.stockAfter)}
                      </span>
                    </td>
                    <td className="text-xs text-slate-600">
                      {movement.batchNumber ?? "—"}
                    </td>
                    <td className="text-xs text-slate-600">
                      {movement.createdBy?.name ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Pagination
          meta={result.meta}
          basePath="/dashboard/scm/stock-movements"
          query={{
            search: rawSearch,
            type,
            reason,
            productId: rawProductId,
          }}
        />
      </Card>
    </div>
  );
}
