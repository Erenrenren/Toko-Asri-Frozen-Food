import {
  AlertTriangle,
  ArrowRight,
  ClipboardList,
  PackageX,
  ShoppingCart,
  Snowflake,
  Timer,
  Truck,
  Wallet,
  Warehouse,
} from "lucide-react";
import Link from "next/link";

import {
  BatchStatusBadge,
  MovementTypeBadge,
  PurchaseOrderStatusBadge,
  StockLevelBadge,
} from "@/components/scm/scm-badges";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { buttonClasses } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import {
  PRODUCT_UNIT_LABELS,
  STOCK_MOVEMENT_REASON_LABELS,
} from "@/lib/constants";
import {
  formatCurrency,
  formatDate,
  formatNumber,
} from "@/lib/format";
import { getScmOverview } from "@/lib/services/scm/overview.service";

export const dynamic = "force-dynamic";
export const metadata = { title: "SCM" };

export default async function ScmOverviewPage() {
  const overview = await getScmOverview();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Modul SCM · Tahap 2"
        title="Supply Chain & Cold Chain"
        description="Pantau supplier, purchase order, stok minimum, batch beku, dan mutasi stok Toko Asri dalam satu tempat."
        action={
          <>
            <Link
              href="/dashboard/scm/purchase-orders/new"
              className={buttonClasses()}
            >
              <ShoppingCart className="h-4 w-4" /> Buat PO
            </Link>
            <Link
              href="/dashboard/scm/stock"
              className={buttonClasses({ variant: "outline" })}
            >
              <Warehouse className="h-4 w-4" /> Kelola stok
            </Link>
          </>
        }
      />

      <Alert tone="info" title="Integrasi otomatis dengan ERP Tahap 1">
        Penerimaan barang menambah <strong>stok produk</strong>, membuat{" "}
        <strong>batch cold-chain</strong>, mencatat <strong>mutasi stok</strong>,
        dan memposting <strong>pengeluaran pembelian</strong> ke jurnal kas
        (source <code>scm</code>) dalam satu transaksi database.
      </Alert>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Supplier aktif"
          value={`${overview.metrics.suppliersActive} / ${overview.metrics.suppliersTotal}`}
          hint="Supplier siap dipilih di purchase order"
          icon={Truck}
          tone="brand"
        />
        <StatCard
          label="PO berjalan"
          value={formatNumber(overview.metrics.openPurchaseOrders)}
          hint="Dikirim / diterima sebagian"
          icon={ClipboardList}
          tone="amber"
        />
        <StatCard
          label="Nilai stok"
          value={formatCurrency(overview.metrics.totalStockValue)}
          hint={`${formatNumber(overview.metrics.lowStockProducts)} produk menipis · ${formatNumber(
            overview.metrics.outOfStockProducts,
          )} habis`}
          icon={Warehouse}
          tone="green"
        />
        <StatCard
          label="Pembelian bulan ini"
          value={formatCurrency(overview.metrics.purchaseValueThisMonth)}
          hint="Pengeluaran kategori pembelian"
          icon={Wallet}
          tone="violet"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Link
          href="/dashboard/scm/stock?status=low"
          className="card flex items-center gap-4 p-4 transition hover:border-amber-200 hover:bg-amber-50/40"
        >
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-amber-50 text-amber-600 ring-1 ring-amber-100">
            <AlertTriangle className="h-5 w-5" />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Stok menipis
            </p>
            <p className="text-xl font-bold text-slate-900">
              {formatNumber(overview.metrics.lowStockProducts)} produk
            </p>
          </div>
        </Link>

        <Link
          href="/dashboard/scm/batches?status=expiring"
          className="card flex items-center gap-4 p-4 transition hover:border-rose-200 hover:bg-rose-50/40"
        >
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-rose-50 text-rose-600 ring-1 ring-rose-100">
            <Timer className="h-5 w-5" />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Batch ≤ 30 hari
            </p>
            <p className="text-xl font-bold text-slate-900">
              {formatNumber(overview.metrics.expiringBatches)} batch
            </p>
          </div>
        </Link>

        <Link
          href="/dashboard/scm/batches?status=expired"
          className="card flex items-center gap-4 p-4 transition hover:border-slate-300 hover:bg-slate-50"
        >
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-slate-100 text-slate-600 ring-1 ring-slate-200">
            <PackageX className="h-5 w-5" />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Batch kedaluwarsa
            </p>
            <p className="text-xl font-bold text-slate-900">
              {formatNumber(overview.metrics.expiredBatches)} batch
            </p>
          </div>
        </Link>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                <CardTitle>Prioritas restock</CardTitle>
              </div>
              <CardDescription>
                Produk yang menyentuh atau melewati stok minimum.
              </CardDescription>
            </div>
            <Link
              href="/dashboard/scm/stock?status=low"
              className="shrink-0 text-xs font-semibold text-brand-700 hover:text-brand-800"
            >
              Lihat semua
            </Link>
          </CardHeader>
          <CardContent className="pt-4">
            {overview.lowStock.length === 0 ? (
              <EmptyState
                icon={Warehouse}
                title="Semua stok aman"
                description="Tidak ada produk yang berada di bawah reorder point."
                className="py-8"
              />
            ) : (
              <div className="space-y-2">
                {overview.lowStock.map((item) => (
                  <Link
                    key={item.productId}
                    href={`/dashboard/scm/stock/${item.productId}`}
                    className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2.5 transition hover:border-brand-200 hover:bg-white"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-800">
                        {item.name}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {item.sku} · min {formatNumber(item.minStockQty)}{" "}
                        {PRODUCT_UNIT_LABELS[item.unit]}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="text-sm font-bold text-slate-800">
                        {formatNumber(item.stockQty)}
                      </span>
                      <StockLevelBadge status={item.status} />
                      <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Snowflake className="h-4 w-4 text-sky-500" />
                <CardTitle>Batch mendekati kedaluwarsa</CardTitle>
              </div>
              <CardDescription>
                Prioritaskan penjualan/FIFO untuk batch di bawah 30 hari.
              </CardDescription>
            </div>
            <Link
              href="/dashboard/scm/batches?status=expiring"
              className="shrink-0 text-xs font-semibold text-brand-700 hover:text-brand-800"
            >
              Lihat semua
            </Link>
          </CardHeader>
          <CardContent className="pt-4">
            {overview.expiring.length === 0 ? (
              <EmptyState
                icon={Snowflake}
                title="Tidak ada batch mendesak"
                description="Semua batch aktif masih memiliki masa simpan lebih dari 30 hari."
                className="py-8"
              />
            ) : (
              <div className="space-y-2">
                {overview.expiring.map((batch) => (
                  <Link
                    key={batch.id}
                    href={`/dashboard/scm/stock/${batch.productId}`}
                    className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2.5 transition hover:border-brand-200 hover:bg-white"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-800">
                        {batch.productName}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {batch.batchNumber} · sisa {formatNumber(batch.remainingQty)}{" "}
                        {PRODUCT_UNIT_LABELS[batch.unit]}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2 text-right">
                      <div>
                        <p className="text-xs font-semibold text-rose-600">
                          {batch.daysToExpiry} hari
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {batch.expiryDate ? formatDate(batch.expiryDate) : "—"}
                        </p>
                      </div>
                      <BatchStatusBadge status={batch.status} />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-3">
            <div>
              <CardTitle>Purchase order terbaru</CardTitle>
              <CardDescription>
                Alur draft → dikirim → diterima, lengkap dengan progres.
              </CardDescription>
            </div>
            <Link
              href="/dashboard/scm/purchase-orders"
              className="shrink-0 text-xs font-semibold text-brand-700 hover:text-brand-800"
            >
              Lihat semua
            </Link>
          </CardHeader>
          <CardContent className="pt-4">
            {overview.recentPurchaseOrders.length === 0 ? (
              <EmptyState
                icon={ClipboardList}
                title="Belum ada purchase order"
                description="Buat PO pertama untuk memulai alur pengadaan."
                action={
                  <Link
                    href="/dashboard/scm/purchase-orders/new"
                    className={buttonClasses({ size: "sm" })}
                  >
                    Buat PO
                  </Link>
                }
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="table-base">
                  <thead>
                    <tr>
                      <th>Nomor</th>
                      <th>Supplier</th>
                      <th>Total</th>
                      <th>Status</th>
                      <th className="text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {overview.recentPurchaseOrders.map((order) => (
                      <tr key={order.id}>
                        <td>
                          <p className="text-xs font-semibold text-slate-800">
                            {order.number}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {formatDate(order.orderDate)}
                          </p>
                        </td>
                        <td>
                          <p className="max-w-[160px] truncate text-xs font-medium text-slate-700">
                            {order.supplier.name}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {order.progress.percent}% diterima
                          </p>
                        </td>
                        <td className="text-xs font-semibold text-slate-800">
                          {formatCurrency(order.totalAmount)}
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Mutasi stok terakhir</CardTitle>
            <CardDescription>Jejak audit masuk/keluar/adjustment.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 pt-4">
            {overview.recentMovements.length === 0 ? (
              <EmptyState
                icon={Warehouse}
                title="Belum ada mutasi"
                description="Mutasi muncul saat penerimaan PO atau penyesuaian stok."
                className="py-8"
              />
            ) : (
              overview.recentMovements.map((movement) => (
                <div
                  key={movement.id}
                  className="rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="min-w-0 truncate text-xs font-semibold text-slate-800">
                      {movement.productName}
                    </p>
                    <span
                      className={
                        movement.quantity > 0
                          ? "text-xs font-bold text-emerald-600"
                          : "text-xs font-bold text-rose-600"
                      }
                    >
                      {movement.quantity > 0 ? "+" : ""}
                      {formatNumber(movement.quantity)}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    <MovementTypeBadge type={movement.type} />
                    <Badge tone="slate">
                      {STOCK_MOVEMENT_REASON_LABELS[movement.reason]}
                    </Badge>
                    <span className="text-[10px] text-slate-400">
                      {movement.stockBefore} → {movement.stockAfter} ·{" "}
                      {formatDate(movement.occurredAt)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
