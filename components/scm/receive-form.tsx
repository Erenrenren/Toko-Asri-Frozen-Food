"use client";

import { CheckCircle2, Loader2, PackageCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PRODUCT_UNIT_LABELS } from "@/lib/constants";
import { formatCurrency, formatNumber } from "@/lib/format";
import type { ApiResponse } from "@/types/api";
import type { PurchaseOrderDTO } from "@/types/domain";

interface ReceiveFormProps {
  order: PurchaseOrderDTO;
}

interface ReceiptRow {
  itemId: string;
  quantity: string;
  batchNumber: string;
  productionDate: string;
  expiryDate: string;
}

interface ReceivePayload {
  receipt: { id: string; number: string; totalValue: number };
  financialTransactionCode: string;
}

function toDateInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function buildRows(order: PurchaseOrderDTO): ReceiptRow[] {
  const today = new Date();
  return order.items
    .filter((item) => item.remainingQty > 0)
    .map((item) => {
      const expiry = new Date();
      if (item.shelfLifeDays) {
        expiry.setDate(expiry.getDate() + item.shelfLifeDays);
      }
      return {
        itemId: item.id,
        quantity: String(item.remainingQty),
        batchNumber: `${order.number}-${item.sku}`,
        productionDate: toDateInput(today),
        expiryDate: item.shelfLifeDays ? toDateInput(expiry) : "",
      };
    });
}

function extractErrorMessage(payload: ApiResponse<unknown>): string {
  if (payload.success) return "Terjadi kesalahan. Silakan coba lagi.";
  const details = payload.error.details;
  if (details && typeof details === "object" && "fieldErrors" in details) {
    const fieldErrors = (details as { fieldErrors?: Record<string, string[]> })
      .fieldErrors;
    if (fieldErrors) {
      for (const messages of Object.values(fieldErrors)) {
        if (messages.length > 0) return messages[0];
      }
    }
  }
  return payload.error.message;
}

export function ReceiveForm({ order }: ReceiveFormProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<ReceiptRow[]>(() => buildRows(order));
  const [receivedAt, setReceivedAt] = useState(() => toDateInput(new Date()));
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<ReceivePayload | null>(null);
  const [loading, setLoading] = useState(false);

  const canReceive =
    order.status === "ordered" || order.status === "partially_received";

  if (!canReceive || order.items.every((item) => item.remainingQty <= 0)) {
    return null;
  }

  function updateRow(itemId: string, patch: Partial<ReceiptRow>) {
    setRows((current) =>
      current.map((row) => (row.itemId === itemId ? { ...row, ...patch } : row)),
    );
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    const payloadItems = rows
      .filter((row) => Number(row.quantity) > 0)
      .map((row) => ({
        purchaseOrderItemId: row.itemId,
        quantity: Number(row.quantity),
        batchNumber: row.batchNumber.trim() || null,
        productionDate: row.productionDate || null,
        expiryDate: row.expiryDate || null,
      }));

    if (payloadItems.length === 0) {
      setError("Isi minimal satu jumlah barang yang diterima.");
      return;
    }
    if (payloadItems.some((item) => !item.batchNumber)) {
      setError("Nomor batch wajib diisi untuk setiap barang yang diterima.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `/api/scm/purchase-orders/${order.id}/receive`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            receivedAt,
            notes: notes.trim() || null,
            items: payloadItems,
          }),
        },
      );
      const result = (await response.json()) as ApiResponse<ReceivePayload>;

      if (!response.ok || !result.success) {
        setError(extractErrorMessage(result));
        return;
      }

      setSuccess(result.data);
      router.refresh();
    } catch {
      setError("Tidak dapat menghubungi server. Periksa koneksi Anda.");
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)}>
        <PackageCheck className="h-4 w-4" /> Terima barang
      </Button>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <PackageCheck className="h-4 w-4 text-brand-600" />
          <CardTitle>Penerimaan barang (Goods Receipt)</CardTitle>
        </div>
        <CardDescription>
          Stok produk, batch, mutasi stok, dan jurnal pengeluaran akan dibuat
          otomatis dalam satu proses.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        {error && <Alert tone="danger">{error}</Alert>}

        {success && (
          <Alert tone="success" title={`Penerimaan ${success.receipt.number} berhasil`}>
            Nilai penerimaan {formatCurrency(success.receipt.totalValue)} telah
            tercatat sebagai pengeluaran pembelian (
            <code className="text-[11px]">{success.financialTransactionCode}</code>
            ).
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="receivedAt" className="label-base">
                Tanggal terima
              </label>
              <Input
                id="receivedAt"
                type="date"
                value={receivedAt}
                onChange={(event) => setReceivedAt(event.target.value)}
              />
            </div>
            <div className="flex items-end">
              <p className="rounded-xl bg-slate-50 px-3 py-2 text-[11px] leading-relaxed text-slate-500">
                Batch dan expiry diisi per item di bawah. Penerimaan bisa
                sebagian.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {order.items
              .filter((item) => item.remainingQty > 0)
              .map((item) => {
                const row = rows.find((entry) => entry.itemId === item.id);
                if (!row) return null;
                return (
                  <div
                    key={item.id}
                    className="rounded-xl border border-slate-200 bg-slate-50/50 p-3"
                  >
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-slate-800">
                          {item.name}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {item.sku} · sisa pesanan {formatNumber(item.remainingQty)}{" "}
                          {PRODUCT_UNIT_LABELS[item.unit]} · harga{" "}
                          {formatCurrency(item.unitCost)}
                        </p>
                      </div>
                      <div className="w-28">
                        <label className="mb-1 block text-[11px] font-medium text-slate-500">
                          Diterima
                        </label>
                        <Input
                          type="number"
                          min={0}
                          max={item.remainingQty}
                          value={row.quantity}
                          onChange={(event) =>
                            updateRow(item.id, { quantity: event.target.value })
                          }
                        />
                      </div>
                    </div>

                    <div className="mt-3 grid gap-2 sm:grid-cols-3">
                      <div>
                        <label className="mb-1 block text-[11px] font-medium text-slate-500">
                          Nomor batch <span className="text-rose-500">*</span>
                        </label>
                        <Input
                          value={row.batchNumber}
                          onChange={(event) =>
                            updateRow(item.id, { batchNumber: event.target.value })
                          }
                          placeholder="BATCH-001"
                          className="text-xs"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-[11px] font-medium text-slate-500">
                          Tanggal produksi
                        </label>
                        <Input
                          type="date"
                          value={row.productionDate}
                          onChange={(event) =>
                            updateRow(item.id, {
                              productionDate: event.target.value,
                            })
                          }
                          className="text-xs"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-[11px] font-medium text-slate-500">
                          Kedaluwarsa
                        </label>
                        <Input
                          type="date"
                          value={row.expiryDate}
                          onChange={(event) =>
                            updateRow(item.id, { expiryDate: event.target.value })
                          }
                          className="text-xs"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>

          <div>
            <label htmlFor="receiptNoteLong" className="label-base">
              Catatan penerimaan
            </label>
            <Textarea
              id="receiptNoteLong"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Mis. 1 pack penyok, sisanya kondisi beku baik..."
              className="min-h-[4rem]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Menyimpan...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" /> Konfirmasi penerimaan
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Tutup
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
