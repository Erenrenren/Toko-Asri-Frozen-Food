"use client";

import { ArrowDownToLine, ArrowUpFromLine, Loader2, Scale, SlidersHorizontal } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

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
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PRODUCT_UNIT_LABELS, STOCK_MOVEMENT_REASON_LABELS } from "@/lib/constants";
import { formatNumber } from "@/lib/format";
import type { ApiResponse } from "@/types/api";
import type {
  ProductUnit,
  StockMovementDTO,
  StockMovementReason,
  StockMovementType,
} from "@/types/domain";

interface BatchOption {
  id: string;
  batchNumber: string;
  remainingQty: number;
  expiryDate: string | null;
}

interface StockAdjustmentFormProps {
  product: {
    id: string;
    name: string;
    unit: ProductUnit;
    stockQty: number;
    costPrice: number;
  };
  batches: BatchOption[];
}

const IN_REASONS: StockMovementReason[] = ["manual_in", "return", "initial_stock"];
const OUT_REASONS: StockMovementReason[] = [
  "manual_out",
  "sale",
  "damage",
  "expired",
  "return",
];

function toDateInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
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

export function StockAdjustmentForm({
  product,
  batches,
}: StockAdjustmentFormProps) {
  const router = useRouter();
  const [type, setType] = useState<StockMovementType>("in");
  const [quantity, setQuantity] = useState("1");
  const [reason, setReason] = useState<StockMovementReason>("manual_in");
  const [unitCost, setUnitCost] = useState(String(product.costPrice));
  const [batchId, setBatchId] = useState("");
  const [batchNumber, setBatchNumber] = useState("");
  const [productionDate, setProductionDate] = useState(() =>
    toDateInput(new Date()),
  );
  const [expiryDate, setExpiryDate] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const showNewBatchFields =
    type === "in" || (type === "adjustment" && Number(quantity) > 0);

  const preview = useMemo(() => {
    const value = Number(quantity);
    if (!Number.isFinite(value)) return product.stockQty;
    if (type === "in") return product.stockQty + Math.abs(value);
    if (type === "out") return product.stockQty - Math.abs(value);
    return product.stockQty + value;
  }, [product.stockQty, quantity, type]);

  function changeType(next: StockMovementType) {
    setType(next);
    setReason(
      next === "in" ? "manual_in" : next === "out" ? "manual_out" : "adjustment",
    );
    setBatchId("");
    setBatchNumber("");
    setError(null);
    setSuccess(null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    const numeric = Number(quantity);
    if (!Number.isFinite(numeric) || numeric === 0) {
      setError("Jumlah mutasi harus berupa angka dan tidak boleh 0.");
      return;
    }
    if (type !== "adjustment" && numeric < 0) {
      setError("Jumlah barang masuk/keluar harus positif.");
      return;
    }
    if (preview < 0) {
      setError("Mutasi ini akan membuat stok menjadi negatif.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/scm/stock-movements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          type,
          quantity:
            type === "adjustment" ? numeric : Math.abs(numeric),
          reason,
          unitCost: showNewBatchFields ? Number(unitCost) || 0 : null,
          batchId: type === "out" && batchId ? batchId : null,
          batchNumber: showNewBatchFields && batchNumber.trim()
            ? batchNumber.trim()
            : null,
          productionDate: showNewBatchFields ? productionDate || null : null,
          expiryDate: showNewBatchFields ? expiryDate || null : null,
          note: note.trim() || null,
        }),
      });
      const result = (await response.json()) as ApiResponse<StockMovementDTO>;

      if (!response.ok || !result.success) {
        setError(extractErrorMessage(result));
        return;
      }

      setSuccess(
        `Mutasi ${result.data.reference} tercatat. Stok sekarang ${formatNumber(
          result.data.stockAfter,
        )} ${PRODUCT_UNIT_LABELS[product.unit]}.`,
      );
      setQuantity("1");
      setBatchNumber("");
      setExpiryDate("");
      setNote("");
      router.refresh();
    } catch {
      setError("Tidak dapat menghubungi server. Periksa koneksi Anda.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-brand-600" />
          <CardTitle>Mutasi stok</CardTitle>
        </div>
        <CardDescription>
          Catat barang masuk, keluar, atau penyesuaian stok opname. Setiap mutasi
          masuk ke log audit.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        {error && <Alert tone="danger">{error}</Alert>}
        {success && <Alert tone="success">{success}</Alert>}

        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => changeType("in")}
            className={
              type === "in"
                ? "rounded-xl border border-emerald-300 bg-emerald-50 px-2 py-2 text-xs font-semibold text-emerald-800"
                : "rounded-xl border border-slate-200 px-2 py-2 text-xs font-medium text-slate-500 hover:border-emerald-200"
            }
          >
            <ArrowDownToLine className="mx-auto mb-1 h-4 w-4" /> Masuk
          </button>
          <button
            type="button"
            onClick={() => changeType("out")}
            className={
              type === "out"
                ? "rounded-xl border border-sky-300 bg-sky-50 px-2 py-2 text-xs font-semibold text-sky-800"
                : "rounded-xl border border-slate-200 px-2 py-2 text-xs font-medium text-slate-500 hover:border-sky-200"
            }
          >
            <ArrowUpFromLine className="mx-auto mb-1 h-4 w-4" /> Keluar
          </button>
          <button
            type="button"
            onClick={() => changeType("adjustment")}
            className={
              type === "adjustment"
                ? "rounded-xl border border-violet-300 bg-violet-50 px-2 py-2 text-xs font-semibold text-violet-800"
                : "rounded-xl border border-slate-200 px-2 py-2 text-xs font-medium text-slate-500 hover:border-violet-200"
            }
          >
            <Scale className="mx-auto mb-1 h-4 w-4" /> Opname
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="quantity" className="label-base">
                {type === "adjustment"
                  ? "Perubahan stok (+/-)"
                  : "Jumlah"}
              </label>
              <Input
                id="quantity"
                type="number"
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
                required
              />
              <p className="mt-1 text-[11px] text-slate-400">
                Stok saat ini {formatNumber(product.stockQty)}{" "}
                {PRODUCT_UNIT_LABELS[product.unit]} → setelah mutasi{" "}
                {formatNumber(preview)}
              </p>
            </div>

            <div>
              <label htmlFor="reason" className="label-base">
                Alasan
              </label>
              <Select
                id="reason"
                value={reason}
                onChange={(event) =>
                  setReason(event.target.value as StockMovementReason)
                }
              >
                {(type === "in"
                  ? IN_REASONS
                  : type === "out"
                    ? OUT_REASONS
                    : (["adjustment"] as StockMovementReason[])
                ).map((item) => (
                  <option key={item} value={item}>
                    {STOCK_MOVEMENT_REASON_LABELS[item]}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          {type === "out" && batches.length > 0 && (
            <div>
              <label htmlFor="batchId" className="label-base">
                Batch sumber (opsional)
              </label>
              <Select
                id="batchId"
                value={batchId}
                onChange={(event) => setBatchId(event.target.value)}
              >
                <option value="">Otomatis FIFO (expiry terdekat)</option>
                {batches.map((batch) => (
                  <option key={batch.id} value={batch.id}>
                    {batch.batchNumber} · sisa {batch.remainingQty}
                  </option>
                ))}
              </Select>
            </div>
          )}

          {showNewBatchFields && (
            <div className="rounded-xl border border-brand-100 bg-brand-50/40 p-3">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-brand-700">
                Informasi batch baru (opsional)
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="batchNumber" className="label-base">
                    Nomor batch
                  </label>
                  <Input
                    id="batchNumber"
                    value={batchNumber}
                    onChange={(event) => setBatchNumber(event.target.value)}
                    placeholder="BATCH-001"
                  />
                </div>
                <div>
                  <label htmlFor="unitCost" className="label-base">
                    Harga per unit (Rp)
                  </label>
                  <Input
                    id="unitCost"
                    type="number"
                    min={0}
                    value={unitCost}
                    onChange={(event) => setUnitCost(event.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="productionDate" className="label-base">
                    Tanggal produksi
                  </label>
                  <Input
                    id="productionDate"
                    type="date"
                    value={productionDate}
                    onChange={(event) => setProductionDate(event.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="expiryDate" className="label-base">
                    Kedaluwarsa
                  </label>
                  <Input
                    id="expiryDate"
                    type="date"
                    value={expiryDate}
                    onChange={(event) => setExpiryDate(event.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          <div>
            <label htmlFor="note" className="label-base">
              Catatan
            </label>
            <Textarea
              id="note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Mis. hasil stock opname mingguan, barang rusak saat bongkar..."
              className="min-h-[3.5rem]"
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Menyimpan...
              </>
            ) : (
              "Simpan mutasi stok"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
