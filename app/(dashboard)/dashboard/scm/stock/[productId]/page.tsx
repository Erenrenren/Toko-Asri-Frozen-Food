import { ArrowLeft, Boxes, Snowflake, Warehouse } from "lucide-react";
import Link from "next/link";

import {
  BatchStatusBadge,
  MovementTypeBadge,
  StockLevelBadge,
} from "@/components/scm/scm-badges";
import { StockAdjustmentForm } from "@/components/scm/stock-adjustment-form";
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
import {
  PRODUCT_CATEGORY_LABELS,
  PRODUCT_UNIT_LABELS,
  STOCK_MOVEMENT_REASON_LABELS,
} from "@/lib/constants";
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatNumber,
} from "@/lib/format";
import {
  getStockLevel,
  listBatches,
  listStockMovements,
} from "@/lib/services/scm/stock.service";

export const dynamic = "force-dynamic";

export default async function StockDetailPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;

  const [stock, batches, movements] = await Promise.all([
    getStockLevel(productId),
    listBatches({ productId, status: "all", page: 1, pageSize: 100, skip: 0 }),
    listStockMovements({ productId, page: 1, pageSize: 20, skip: 0 }),
  ]);

  const batchOptions = batches.items
    .filter((batch) => batch.remainingQty > 0 && batch.status !== "expired")
    .map((batch) => ({
      id: batch.id,
      batchNumber: batch.batchNumber,
      remainingQty: batch.remainingQty,
      expiryDate: batch.expiryDate,
    }));

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={`Stok · ${stock.sku}`}
        title={stock.name}
        description={`${PRODUCT_CATEGORY_LABELS[stock.category]} · satuan ${
          PRODUCT_UNIT_LABELS[stock.unit]
        } · HPP ${formatCurrency(stock.costPrice)}`}
        action={
          <>
            <StockLevelBadge status={stock.status} />
            <Link
              href="/dashboard/scm/stock"
              className={buttonClasses({ variant: "outline" })}
            >
              <ArrowLeft className="h-4 w-4" /> Kembali
            </Link>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="card p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Stok tersedia
          </p>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {formatNumber(stock.stockQty)}{" "}
            <span className="text-sm font-medium text-slate-400">
              {PRODUCT_UNIT_LABELS[stock.unit]}
            </span>
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Reorder point {formatNumber(stock.minStockQty)}
          </p>
        </div>

        <div className="card p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Nilai persediaan
          </p>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {formatCurrency(stock.stockValue)}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {formatNumber(stock.stockQty)} × {formatCurrency(stock.costPrice)}
          </p>
        </div>

        <div className="card p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Batch aktif
          </p>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {formatNumber(stock.activeBatches)}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {stock.nearestExpiry
              ? `Expiry terdekat ${formatDate(stock.nearestExpiry)}`
              : "Belum ada batch aktif"}
          </p>
        </div>

        <div className="card p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Status cold-chain
          </p>
          <div className="mt-2 flex items-center gap-2">
            <Snowflake className="h-5 w-5 text-sky-500" />
            <span className="text-sm font-semibold text-slate-800">
              {stock.status === "healthy"
                ? "Stok aman"
                : stock.status === "low"
                  ? "Perlu restock"
                  : "Stok habis"}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            {stock.activeBatches > 0
              ? "Gunakan FIFO berdasarkan expiry."
              : "Terima PO untuk membuat batch baru."}
          </p>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <div className="space-y-5">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Boxes className="h-4 w-4 text-brand-600" />
                <CardTitle>Batch & tanggal kedaluwarsa</CardTitle>
              </div>
              <CardDescription>
                Setiap batch menyimpan tanggal produksi, expiry, dan sisa stok.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-3">
              {batches.items.length === 0 ? (
                <EmptyState
                  icon={Boxes}
                  title="Belum ada batch"
                  description="Batch dibuat otomatis saat penerimaan PO atau stok masuk dengan nomor batch."
                  className="py-8"
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="table-base">
                    <thead>
                      <tr>
                        <th>Batch</th>
                        <th>Produksi</th>
                        <th>Kedaluwarsa</th>
                        <th>Sisa</th>
                        <th>Masuk</th>
                        <th>Supplier</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {batches.items.map((batch) => (
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
                          <td className="whitespace-nowrap text-xs text-slate-600">
                            {batch.productionDate
                              ? formatDate(batch.productionDate)
                              : "—"}
                          </td>
                          <td className="whitespace-nowrap text-xs">
                            <span
                              className={
                                batch.daysToExpiry !== null &&
                                batch.daysToExpiry < 0
                                  ? "font-semibold text-rose-600"
                                  : batch.daysToExpiry !== null &&
                                      batch.daysToExpiry <= 30
                                    ? "font-semibold text-amber-600"
                                    : "text-slate-600"
                              }
                            >
                              {batch.expiryDate
                                ? formatDate(batch.expiryDate)
                                : "—"}
                            </span>
                            {batch.daysToExpiry !== null && (
                              <p className="text-[10px] text-slate-400">
                                {batch.daysToExpiry < 0
                                  ? `Lewat ${Math.abs(batch.daysToExpiry)} hari`
                                  : `${batch.daysToExpiry} hari lagi`}
                              </p>
                            )}
                          </td>
                          <td className="text-xs font-semibold text-slate-800">
                            {formatNumber(batch.remainingQty)}
                          </td>
                          <td className="text-xs text-slate-600">
                            {formatNumber(batch.receivedQty)}
                          </td>
                          <td className="max-w-[120px] truncate text-xs text-slate-600">
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
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Warehouse className="h-4 w-4 text-brand-600" />
                  <CardTitle>Mutasi stok terakhir</CardTitle>
                </div>
                <CardDescription>
                  20 mutasi terbaru untuk produk ini.
                </CardDescription>
              </div>
              <Link
                href={`/dashboard/scm/stock-movements?productId=${stock.productId}`}
                className="shrink-0 text-xs font-semibold text-brand-700 hover:text-brand-800"
              >
                Lihat semua
              </Link>
            </CardHeader>
            <CardContent className="pt-3">
              {movements.items.length === 0 ? (
                <EmptyState
                  icon={Warehouse}
                  title="Belum ada mutasi"
                  description="Mutasi tercatat saat stok masuk, keluar, atau opname."
                  className="py-8"
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="table-base">
                    <thead>
                      <tr>
                        <th>Waktu</th>
                        <th>Tipe</th>
                        <th>Alasan</th>
                        <th>Qty</th>
                        <th>Stok</th>
                        <th>Batch</th>
                        <th>Oleh</th>
                      </tr>
                    </thead>
                    <tbody>
                      {movements.items.map((movement) => (
                        <tr key={movement.id}>
                          <td className="whitespace-nowrap text-xs text-slate-600">
                            {formatDateTime(movement.occurredAt)}
                            <p className="text-[10px] text-slate-400">
                              {movement.reference}
                            </p>
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
                            <span className="font-semibold text-slate-800">
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
            </CardContent>
          </Card>
        </div>

        <div className="space-y-5">
          <StockAdjustmentForm
            product={{
              id: stock.productId,
              name: stock.name,
              unit: stock.unit,
              stockQty: stock.stockQty,
              costPrice: stock.costPrice,
            }}
            batches={batchOptions}
          />

          <Card>
            <CardHeader>
              <CardTitle>Informasi produk</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 pt-2 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>SKU</span>
                <span className="font-semibold text-slate-800">{stock.sku}</span>
              </div>
              <div className="flex justify-between">
                <span>Kategori</span>
                <Badge tone="brand">
                  {PRODUCT_CATEGORY_LABELS[stock.category]}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>Satuan</span>
                <span>{PRODUCT_UNIT_LABELS[stock.unit]}</span>
              </div>
              <div className="flex justify-between">
                <span>HPP</span>
                <span>{formatCurrency(stock.costPrice)}</span>
              </div>
              <div className="flex justify-between">
                <span>Terakhir diubah</span>
                <span>{formatDate(stock.updatedAt)}</span>
              </div>
              <Link
                href={`/dashboard/products/${stock.productId}`}
                className={buttonClasses({
                  variant: "outline",
                  size: "sm",
                  className: "mt-2 w-full",
                })}
              >
                Edit master produk
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
