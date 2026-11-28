import { ClipboardList, Plus, Search } from "lucide-react";
import Link from "next/link";

import { PurchaseOrderStatusBadge } from "@/components/scm/scm-badges";
import { Badge } from "@/components/ui/badge";
import { buttonClasses } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import {
  PURCHASE_ORDER_STATUSES,
  PURCHASE_ORDER_STATUS_LABELS,
} from "@/lib/constants";
import { formatCurrency, formatDate } from "@/lib/format";
import { listPurchaseOrders } from "@/lib/services/scm/purchase-order.service";
import type { PurchaseOrderStatus } from "@/types/domain";

export const dynamic = "force-dynamic";
export const metadata = { title: "Purchase Order" };

export default async function PurchaseOrdersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const rawSearch = typeof params.search === "string" ? params.search : undefined;
  const rawStatus = typeof params.status === "string" ? params.status : "";
  const rawPage = typeof params.page === "string" ? Number(params.page) : 1;

  const status = (PURCHASE_ORDER_STATUSES as readonly string[]).includes(rawStatus)
    ? (rawStatus as PurchaseOrderStatus)
    : undefined;
  const page = Number.isFinite(rawPage) && rawPage > 0 ? Math.floor(rawPage) : 1;
  const pageSize = 10;

  const result = await listPurchaseOrders({
    search: rawSearch,
    status,
    page,
    pageSize,
    skip: (page - 1) * pageSize,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Pengadaan"
        title="Purchase order"
        description="Buat pesanan ke supplier, kirim, lalu catat penerimaan barang untuk menambah stok otomatis."
        action={
          <Link
            href="/dashboard/scm/purchase-orders/new"
            className={buttonClasses()}
          >
            <Plus className="h-4 w-4" /> Buat PO
          </Link>
        }
      />

      <Card>
        <div className="border-b border-slate-100 p-5 sm:p-6">
          <form className="grid gap-3 sm:grid-cols-[1fr_220px_auto]" method="get">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                name="search"
                defaultValue={rawSearch ?? ""}
                placeholder="Cari nomor PO atau supplier..."
                className="input-base pl-9"
              />
            </div>
            <select
              name="status"
              defaultValue={status ?? ""}
              className="input-base"
              aria-label="Filter status PO"
            >
              <option value="">Semua status</option>
              {PURCHASE_ORDER_STATUSES.map((item) => (
                <option key={item} value={item}>
                  {PURCHASE_ORDER_STATUS_LABELS[item]}
                </option>
              ))}
            </select>
            <button type="submit" className={buttonClasses()}>
              Terapkan
            </button>
          </form>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
            <Badge tone="slate">{result.meta.total} purchase order</Badge>
            <span>·</span>
            <span>Beban pembelian dicatat saat penerimaan barang.</span>
          </div>
        </div>

        {result.items.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="Belum ada purchase order"
            description="Buat PO pertama untuk memulai alur pengadaan dan restock."
            action={
              <Link
                href="/dashboard/scm/purchase-orders/new"
                className={buttonClasses({ size: "sm" })}
              >
                <Plus className="h-3.5 w-3.5" /> Buat PO
              </Link>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr>
                  <th>Nomor PO</th>
                  <th>Supplier</th>
                  <th>Tanggal</th>
                  <th>Estimasi tiba</th>
                  <th>Total</th>
                  <th>Progres</th>
                  <th>Status</th>
                  <th className="text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {result.items.map((order) => (
                  <tr key={order.id}>
                    <td>
                      <p className="text-sm font-semibold text-slate-800">
                        {order.number}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {order.items.length} item · dibuat{" "}
                        {order.createdBy?.name ?? "—"}
                      </p>
                    </td>
                    <td>
                      <p className="max-w-[180px] truncate text-sm font-medium text-slate-700">
                        {order.supplier.name}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {order.supplier.code}
                      </p>
                    </td>
                    <td className="whitespace-nowrap text-xs text-slate-600">
                      {formatDate(order.orderDate)}
                    </td>
                    <td className="whitespace-nowrap text-xs text-slate-600">
                      {order.expectedDate ? formatDate(order.expectedDate) : "—"}
                    </td>
                    <td className="whitespace-nowrap text-sm font-semibold text-slate-800">
                      {formatCurrency(order.totalAmount)}
                    </td>
                    <td>
                      <div className="w-28">
                        <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-brand-500"
                            style={{ width: `${order.progress.percent}%` }}
                          />
                        </div>
                        <p className="mt-1 text-[10px] text-slate-500">
                          {order.progress.percent}% diterima
                        </p>
                      </div>
                    </td>
                    <td>
                      <PurchaseOrderStatusBadge status={order.status} />
                    </td>
                    <td className="text-right">
                      <Link
                        href={`/dashboard/scm/purchase-orders/${order.id}`}
                        className="text-xs font-semibold text-brand-700 hover:text-brand-800"
                      >
                        Detail
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
          basePath="/dashboard/scm/purchase-orders"
          query={{ search: rawSearch, status }}
        />
      </Card>
    </div>
  );
}
