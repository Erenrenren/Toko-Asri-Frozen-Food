import {
  ArrowRight,
  Boxes,
  Package,
  Plus,
  ReceiptText,
  TrendingDown,
  TrendingUp,
  TriangleAlert,
  Wallet,
} from "lucide-react";
import Link from "next/link";

import { SalesChart } from "@/components/dashboard/sales-chart";
import {
  TransactionCategoryBadge,
} from "@/components/transactions/transaction-badge";
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
import { requireUser } from "@/lib/auth/session";
import {
  PRODUCT_CATEGORY_LABELS,
  TRANSACTION_TYPE_LABELS,
} from "@/lib/constants";
import {
  formatCompactCurrency,
  formatCurrency,
  formatDate,
  formatDateTime,
  formatNumber,
  formatPercent,
} from "@/lib/format";
import { getDashboardSummary } from "@/lib/services/dashboard.service";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [user, summary] = await Promise.all([requireUser(), getDashboardSummary()]);
  const { metrics } = summary;
  const maxCategoryStock = Math.max(
    ...summary.categoryBreakdown.map((item) => item.stockQty),
    1,
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="ERP Inti"
        title={`Halo, ${user.name.split(" ")[0]} 👋`}
        description={`Ringkasan operasional Toko Asri Frozen Food untuk periode ${summary.period.label}. Data dihitung dari transaksi berstatus posted.`}
        action={
          <Link
            href="/dashboard/transactions/new"
            className={buttonClasses({ size: "md" })}
          >
            <Plus className="h-4 w-4" /> Catat transaksi
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Omzet bulan ini"
          value={formatCurrency(metrics.revenue)}
          hint={`${metrics.transactionCount} transaksi tercatat`}
          icon={TrendingUp}
          tone="brand"
          trend={<Badge tone="green">Penjualan</Badge>}
        />
        <StatCard
          label="Laba kotor"
          value={formatCurrency(metrics.grossProfit)}
          hint={`HPP ${formatCompactCurrency(metrics.cogs)}`}
          icon={Wallet}
          tone="green"
          trend={<Badge tone="brand">Margin {formatPercent(metrics.grossMargin)}</Badge>}
        />
        <StatCard
          label="Pengeluaran"
          value={formatCurrency(metrics.expenses)}
          hint="Restock & operasional"
          icon={TrendingDown}
          tone="amber"
          trend={<Badge tone="amber">Kas keluar</Badge>}
        />
        <StatCard
          label="Produk aktif"
          value={formatNumber(metrics.activeProducts)}
          hint={`dari ${formatNumber(metrics.totalProducts)} produk`}
          icon={Package}
          tone="violet"
          trend={
            metrics.lowStockProducts > 0 ? (
              <Badge tone="rose">{metrics.lowStockProducts} stok menipis</Badge>
            ) : (
              <Badge tone="green">Stok aman</Badge>
            )
          }
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.55fr_1fr]">
        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle>Tren penjualan</CardTitle>
              <CardDescription>Omzet penjualan tujuh hari terakhir.</CardDescription>
            </div>
            <Badge tone="brand">7 hari</Badge>
          </CardHeader>
          <CardContent>
            <SalesChart data={summary.salesTrend} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle>Perlu perhatian</CardTitle>
              <CardDescription>Produk dengan stok di bawah minimum.</CardDescription>
            </div>
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-amber-50 text-amber-600 ring-1 ring-amber-100">
              <TriangleAlert className="h-4 w-4" />
            </span>
          </CardHeader>
          <CardContent className="pt-4">
            {summary.lowStockList.length === 0 ? (
              <EmptyState
                icon={Boxes}
                title="Semua stok aman"
                description="Tidak ada produk aktif yang berada di bawah ambang minimum."
                className="py-8"
              />
            ) : (
              <div className="space-y-3">
                {summary.lowStockList.map((product) => (
                  <Link
                    key={product.id}
                    href={`/dashboard/products/${product.id}`}
                    className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 px-3.5 py-3 transition hover:border-brand-200 hover:bg-brand-50/40"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-800">
                        {product.name}
                      </p>
                      <p className="mt-0.5 text-[11px] text-slate-500">
                        {product.sku} · min. {formatNumber(product.minStockQty)}{" "}
                        {product.unit}
                      </p>
                    </div>
                    <Badge tone={product.stockQty === 0 ? "rose" : "amber"}>
                      {formatNumber(product.stockQty)} {product.unit}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
            <Link
              href="/dashboard/products?status=active"
              className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-brand-700 hover:text-brand-800"
            >
              Kelola produk <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle>Transaksi terbaru</CardTitle>
              <CardDescription>Enam aktivitas kas terakhir di toko.</CardDescription>
            </div>
            <Link
              href="/dashboard/transactions"
              className="text-xs font-semibold text-brand-700 hover:text-brand-800"
            >
              Lihat semua
            </Link>
          </CardHeader>
          <CardContent className="px-0 pb-2 pt-4 sm:px-0">
            {summary.recentTransactions.length === 0 ? (
              <EmptyState
                icon={ReceiptText}
                title="Belum ada transaksi"
                description="Mulai catat penjualan atau pengeluaran pertama Anda."
                action={
                  <Link
                    href="/dashboard/transactions/new"
                    className={buttonClasses({ size: "sm" })}
                  >
                    <Plus className="h-3.5 w-3.5" /> Catat transaksi
                  </Link>
                }
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="table-base">
                  <thead>
                    <tr>
                      <th>Transaksi</th>
                      <th>Kategori</th>
                      <th>Tanggal</th>
                      <th className="text-right">Nominal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.recentTransactions.map((transaction) => (
                      <tr key={transaction.id}>
                        <td>
                          <div className="flex items-center gap-2">
                            <span
                              className={
                                transaction.type === "income"
                                  ? "grid h-8 w-8 place-items-center rounded-lg bg-emerald-50 text-emerald-600"
                                  : "grid h-8 w-8 place-items-center rounded-lg bg-rose-50 text-rose-600"
                              }
                            >
                              {transaction.type === "income" ? (
                                <TrendingUp className="h-4 w-4" />
                              ) : (
                                <TrendingDown className="h-4 w-4" />
                              )}
                            </span>
                            <div className="min-w-0">
                              <p className="max-w-[220px] truncate text-sm font-medium text-slate-800">
                                {transaction.description}
                              </p>
                              <p className="text-[11px] text-slate-400">
                                {transaction.code}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td>
                          <TransactionCategoryBadge category={transaction.category} />
                        </td>
                        <td className="whitespace-nowrap text-xs text-slate-500">
                          {formatDate(transaction.occurredAt)}
                        </td>
                        <td
                          className={
                            transaction.type === "income"
                              ? "whitespace-nowrap text-right text-sm font-semibold text-emerald-700"
                              : "whitespace-nowrap text-right text-sm font-semibold text-rose-700"
                          }
                        >
                          {transaction.type === "income" ? "+" : "−"}
                          {formatCurrency(transaction.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Produk terlaris</CardTitle>
              <CardDescription>Berdasarkan omzet bulan ini.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              {summary.topProducts.length === 0 ? (
                <p className="py-6 text-center text-sm text-slate-500">
                  Belum ada penjualan bulan ini.
                </p>
              ) : (
                summary.topProducts.map((product, index) => (
                  <div key={product.productId} className="flex items-center gap-3">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-slate-100 text-xs font-bold text-slate-500">
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-slate-800">
                        {product.name}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {formatNumber(product.quantity)} terjual · {product.sku}
                      </p>
                    </div>
                    <span className="text-xs font-semibold text-slate-700">
                      {formatCompactCurrency(product.revenue)}
                    </span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Komposisi kategori</CardTitle>
              <CardDescription>Jumlah stok per kategori aktif.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 pt-4">
              {summary.categoryBreakdown
                .filter((item) => item.products > 0)
                .map((item) => (
                  <div key={item.category}>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-700">
                        {PRODUCT_CATEGORY_LABELS[item.category]}
                      </span>
                      <span className="text-slate-500">
                        {formatNumber(item.stockQty)} unit
                      </span>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-300"
                        style={{
                          width: `${Math.max(4, (item.stockQty / maxCategoryStock) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle>Jurnal kas bulan ini</CardTitle>
            <CardDescription>
              Rekap pemasukan, HPP, laba kotor, dan pengeluaran operasional.
            </CardDescription>
          </div>
          <Badge tone="slate">{summary.period.label}</Badge>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                label: "Pemasukan penjualan",
                value: metrics.revenue,
                tone: "text-emerald-700",
              },
              { label: "HPP penjualan", value: metrics.cogs, tone: "text-amber-700" },
              {
                label: "Laba kotor",
                value: metrics.grossProfit,
                tone: "text-brand-700",
              },
              {
                label: "Laba bersih (setelah beban)",
                value: metrics.netProfit,
                tone: metrics.netProfit >= 0 ? "text-emerald-700" : "text-rose-700",
              },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-xl border border-slate-100 bg-slate-50/60 p-4"
              >
                <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                  {item.label}
                </p>
                <p className={`mt-1.5 text-lg font-bold ${item.tone}`}>
                  {formatCurrency(item.value)}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
            <span>
              {TRANSACTION_TYPE_LABELS.income} − {TRANSACTION_TYPE_LABELS.expense} − HPP
            </span>
            <span>
              Diperbarui {formatDateTime(new Date())} WIB · {summary.metrics.totalUsers}{" "}
              akun terdaftar
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
