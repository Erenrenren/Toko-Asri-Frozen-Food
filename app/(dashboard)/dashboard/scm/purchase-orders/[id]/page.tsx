import { ArrowLeft, Building2, CalendarClock, FileText, Receipt } from "lucide-react";
import Link from "next/link";

import { PurchaseOrderActions } from "@/components/scm/purchase-order-actions";
import { ReceiveForm } from "@/components/scm/receive-form";
import { PurchaseOrderStatusBadge } from "@/components/scm/scm-badges";
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
import { PRODUCT_UNIT_LABELS } from "@/lib/constants";
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatNumber,
} from "@/lib/format";
import { requireRole } from "@/lib/auth/session";
import { getPurchaseOrderById } from "@/lib/services/scm/purchase-order.service";

export const dynamic = "force-dynamic";

export default async function PurchaseOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [order, user] = await Promise.all([
    getPurchaseOrderById(id),
    requireRole(["admin", "staff"]),
  ]);

  const canReceive =
    order.status === "ordered" || order.status === "partially_received";

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Purchase order"
        title={order.number}
        description={`Dibuat ${formatDateTime(order.createdAt)} oleh ${
          order.createdBy?.name ?? "—"
        }`}
        action={
          <>
            <PurchaseOrderStatusBadge status={order.status} />
            <Link
              href="/dashboard/scm/purchase-orders"
              className={buttonClasses({ variant: "outline" })}
            >
              <ArrowLeft className="h-4 w-4" /> Kembali
            </Link>
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-brand-600" />
              <CardTitle>Supplier & jadwal</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 pt-2 sm:grid-cols-2">
            <div>
              <p className="text-[11px] uppercase tracking-wide text-slate-400">
                Supplier
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-800">
                {order.supplier.name}
              </p>
              <p className="text-[11px] text-slate-500">
                {order.supplier.code}
                {order.supplier.phone ? ` · ${order.supplier.phone}` : ""}
              </p>
              <div className="mt-2">
                <Badge tone={order.supplier.isActive ? "green" : "slate"}>
                  {order.supplier.isActive ? "Supplier aktif" : "Supplier nonaktif"}
                </Badge>
              </div>
            </div>

            <div className="space-y-2 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <CalendarClock className="h-3.5 w-3.5 text-slate-400" />
                <span>Tanggal PO {formatDate(order.orderDate)}</span>
              </div>
              <div className="flex items-center gap-2">
                <CalendarClock className="h-3.5 w-3.5 text-slate-400" />
                <span>
                  Estimasi tiba{" "}
                  {order.expectedDate ? formatDate(order.expectedDate) : "—"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <FileText className="h-3.5 w-3.5 text-slate-400" />
                <span>Lead time supplier {order.supplier.leadTimeDays} hari</span>
              </div>
              {order.receivedAt && (
                <div className="flex items-center gap-2 text-emerald-700">
                  <Receipt className="h-3.5 w-3.5" />
                  <span>Diterima lengkap {formatDateTime(order.receivedAt)}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ringkasan nilai</CardTitle>
            <CardDescription>Dalam Rupiah.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 pt-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Subtotal</span>
              <span className="font-semibold text-slate-800">
                {formatCurrency(order.subtotal)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Biaya kirim</span>
              <span className="font-semibold text-slate-800">
                {formatCurrency(order.shippingCost)}
              </span>
            </div>
            <div className="flex justify-between border-t border-slate-100 pt-2">
              <span className="font-semibold text-slate-700">Total PO</span>
              <span className="text-base font-bold text-brand-800">
                {formatCurrency(order.totalAmount)}
              </span>
            </div>
            <div className="mt-3 rounded-xl bg-slate-50 p-3">
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>Progres penerimaan</span>
                <span className="font-semibold text-slate-700">
                  {order.progress.receivedQty} / {order.progress.orderedQty}
                </span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-white">
                <div
                  className="h-full rounded-full bg-brand-500"
                  style={{ width: `${order.progress.percent}%` }}
                />
              </div>
              <p className="mt-1 text-[10px] text-slate-400">
                {order.progress.percent}% jumlah unit sudah diterima
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap items-start gap-3">
        <PurchaseOrderActions order={order} canCancel={user.role === "admin"} />
        {canReceive && <ReceiveForm order={order} />}
        {order.status === "received" && (
          <Badge tone="green">
            Semua barang sudah diterima dan jurnal pembelian sudah tercatat.
          </Badge>
        )}
        {order.status === "cancelled" && (
          <Badge tone="rose">Purchase order dibatalkan, tidak ada stok masuk.</Badge>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Item purchase order</CardTitle>
          <CardDescription>
            Jumlah diterima dihitung otomatis dari Goods Receipt.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr>
                  <th>Produk</th>
                  <th>Dipesan</th>
                  <th>Diterima</th>
                  <th>Sisa</th>
                  <th>Harga satuan</th>
                  <th>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <p className="text-sm font-semibold text-slate-800">
                        {item.name}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {item.sku} · per {PRODUCT_UNIT_LABELS[item.unit]}
                      </p>
                    </td>
                    <td className="text-sm text-slate-700">
                      {formatNumber(item.quantity)}{" "}
                      {PRODUCT_UNIT_LABELS[item.unit]}
                    </td>
                    <td>
                      <Badge
                        tone={
                          item.remainingQty === 0
                            ? "green"
                            : item.receivedQty > 0
                              ? "amber"
                              : "slate"
                        }
                      >
                        {formatNumber(item.receivedQty)}
                      </Badge>
                    </td>
                    <td className="text-sm font-medium text-slate-700">
                      {formatNumber(item.remainingQty)}
                    </td>
                    <td className="whitespace-nowrap text-sm text-slate-700">
                      {formatCurrency(item.unitCost)}
                    </td>
                    <td className="whitespace-nowrap text-sm font-semibold text-slate-800">
                      {formatCurrency(item.subtotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Receipt className="h-4 w-4 text-brand-600" />
            <CardTitle>Riwayat penerimaan barang</CardTitle>
          </div>
          <CardDescription>
            Setiap penerimaan membuat stock movement, batch, dan pengeluaran kas.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-3">
          {order.receipts.length === 0 ? (
            <EmptyState
              icon={Receipt}
              title="Belum ada penerimaan"
              description="Gunakan tombol Terima barang saat kiriman supplier tiba."
              className="py-8"
            />
          ) : (
            <div className="space-y-4">
              {order.receipts.map((receipt) => (
                <div
                  key={receipt.id}
                  className="rounded-xl border border-slate-200 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        {receipt.number}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {formatDateTime(receipt.receivedAt)} · diterima oleh{" "}
                        {receipt.receivedBy?.name ?? "—"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-slate-800">
                        {formatCurrency(receipt.totalValue)}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        total nilai penerimaan
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 overflow-x-auto">
                    <table className="table-base">
                      <thead>
                        <tr>
                          <th>Produk</th>
                          <th>Jumlah</th>
                          <th>Batch</th>
                          <th>Kedaluwarsa</th>
                          <th>Subtotal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {receipt.items.map((item) => (
                          <tr key={item.id}>
                            <td className="text-xs font-medium text-slate-700">
                              {item.name}
                              <span className="ml-1 text-[10px] text-slate-400">
                                {item.sku}
                              </span>
                            </td>
                            <td className="text-xs text-slate-700">
                              {formatNumber(item.quantity)}
                            </td>
                            <td className="text-xs text-slate-700">
                              {item.batchNumber ?? "—"}
                            </td>
                            <td className="text-xs text-slate-700">
                              {item.expiryDate ? formatDate(item.expiryDate) : "—"}
                            </td>
                            <td className="text-xs font-semibold text-slate-800">
                              {formatCurrency(item.subtotal)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {receipt.notes && (
                    <p className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-[11px] text-slate-500">
                      {receipt.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {order.notes && (
        <Card>
          <CardContent className="p-4 text-sm text-slate-600">
            <span className="font-semibold text-slate-800">Catatan PO: </span>
            {order.notes}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
