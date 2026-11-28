"use client";

import { Loader2, Plus, Save, Send, Trash2, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { Alert } from "@/components/ui/alert";
import { Button, buttonClasses } from "@/components/ui/button";
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
import { PRODUCT_UNIT_LABELS } from "@/lib/constants";
import { formatCurrency, formatNumber } from "@/lib/format";
import type { ApiResponse } from "@/types/api";
import type { ProductUnit, PurchaseOrderDTO } from "@/types/domain";

interface SupplierOption {
  id: string;
  code: string;
  name: string;
  leadTimeDays: number;
  deliveryDays: string[];
  paymentTermDays: number;
  minimumOrder: number;
  products: Array<{
    productId: string;
    lastPrice: number | null;
    isPreferred: boolean;
  }>;
}

interface ProductOption {
  id: string;
  sku: string;
  name: string;
  unit: ProductUnit;
  costPrice: number;
  stockQty: number;
  minStockQty: number;
}

interface PurchaseOrderFormProps {
  suppliers: SupplierOption[];
  products: ProductOption[];
  defaultSupplierId?: string;
}

interface ItemRow {
  key: string;
  productId: string;
  quantity: string;
  unitCost: string;
}

let rowCounter = 0;

function createRow(): ItemRow {
  rowCounter += 1;
  return {
    key: `row-${rowCounter}`,
    productId: "",
    quantity: "1",
    unitCost: "",
  };
}

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

export function PurchaseOrderForm({
  suppliers,
  products,
  defaultSupplierId,
}: PurchaseOrderFormProps) {
  const router = useRouter();
  const initialSupplier = suppliers.find((item) => item.id === defaultSupplierId);
  const [supplierId, setSupplierId] = useState(initialSupplier?.id ?? "");
  const [expectedDate, setExpectedDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() + (initialSupplier?.leadTimeDays ?? 2));
    return toDateInput(date);
  });
  const [shippingCost, setShippingCost] = useState("0");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<ItemRow[]>([createRow()]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const supplier = suppliers.find((item) => item.id === supplierId);

  const linkedProductIds = useMemo(() => {
    if (!supplier) return null;
    const ids = supplier.products.map((item) => item.productId);
    return ids.length > 0 ? new Set(ids) : null;
  }, [supplier]);

  const availableProducts = useMemo(() => {
    if (!linkedProductIds) return products;
    return products.filter((product) => linkedProductIds.has(product.id));
  }, [products, linkedProductIds]);

  const subtotal = useMemo(
    () =>
      items.reduce((sum, item) => {
        const qty = Number(item.quantity);
        const cost = Number(item.unitCost);
        if (!Number.isFinite(qty) || !Number.isFinite(cost)) return sum;
        return sum + qty * cost;
      }, 0),
    [items],
  );

  const shipping = Number(shippingCost) || 0;
  const total = subtotal + shipping;
  const belowMinimum =
    supplier && supplier.minimumOrder > 0 && subtotal < supplier.minimumOrder;

  function handleSupplierChange(nextSupplierId: string) {
    setSupplierId(nextSupplierId);
    const nextSupplier = suppliers.find((item) => item.id === nextSupplierId);
    if (nextSupplier) {
      const date = new Date();
      date.setDate(date.getDate() + nextSupplier.leadTimeDays);
      setExpectedDate(toDateInput(date));
    }
    setItems([createRow()]);
  }

  function updateRow(key: string, patch: Partial<ItemRow>) {
    setItems((current) =>
      current.map((row) => (row.key === key ? { ...row, ...patch } : row)),
    );
  }

  function handleProductChange(key: string, productId: string) {
    const product = products.find((item) => item.id === productId);
    const link = supplier?.products.find((item) => item.productId === productId);
    const price = link?.lastPrice ?? product?.costPrice ?? 0;
    updateRow(key, {
      productId,
      unitCost: productId ? String(price) : "",
    });
  }

  function addRow() {
    setItems((current) => [...current, createRow()]);
  }

  function removeRow(key: string) {
    setItems((current) =>
      current.length > 1 ? current.filter((row) => row.key !== key) : current,
    );
  }

  async function handleSubmit(status: "draft" | "ordered") {
    setError(null);

    if (!supplierId) {
      setError("Pilih supplier terlebih dahulu.");
      return;
    }

    const payloadItems = items
      .filter((item) => item.productId)
      .map((item) => ({
        productId: item.productId,
        quantity: Number(item.quantity),
        unitCost: Number(item.unitCost),
      }));

    if (payloadItems.length === 0) {
      setError("Tambahkan minimal satu produk pada purchase order.");
      return;
    }
    if (
      payloadItems.some(
        (item) =>
          !Number.isFinite(item.quantity) ||
          item.quantity <= 0 ||
          !Number.isFinite(item.unitCost) ||
          item.unitCost < 0,
      )
    ) {
      setError("Jumlah dan harga satuan harus berupa angka yang valid.");
      return;
    }
    if (
      new Set(payloadItems.map((item) => item.productId)).size !==
      payloadItems.length
    ) {
      setError("Produk yang sama tidak boleh dipilih dua kali.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/scm/purchase-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supplierId,
          status,
          expectedDate: expectedDate || null,
          shippingCost: shipping,
          notes: notes.trim() || null,
          items: payloadItems,
        }),
      });
      const result = (await response.json()) as ApiResponse<PurchaseOrderDTO>;

      if (!response.ok || !result.success) {
        setError(extractErrorMessage(result));
        return;
      }

      router.push(`/dashboard/scm/purchase-orders/${result.data.id}`);
      router.refresh();
    } catch {
      setError("Tidak dapat menghubungi server. Periksa koneksi Anda.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void handleSubmit("draft");
      }}
      className="space-y-5"
    >
      {error && (
        <Alert tone="danger" title="Gagal membuat purchase order">
          {error}
        </Alert>
      )}

      <div className="grid gap-5 xl:grid-cols-[1.5fr_1fr]">
        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Supplier & jadwal</CardTitle>
              <CardDescription>
                PO hanya dapat dikirim ke supplier aktif yang terdaftar.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="supplierId" className="label-base">
                  Supplier <span className="text-rose-500">*</span>
                </label>
                <Select
                  id="supplierId"
                  value={supplierId}
                  onChange={(event) => handleSupplierChange(event.target.value)}
                  required
                >
                  <option value="">Pilih supplier...</option>
                  {suppliers.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} ({item.code})
                    </option>
                  ))}
                </Select>
                {supplier && (
                  <p className="mt-1 text-[11px] text-slate-400">
                    Lead time {supplier.leadTimeDays} hari · termin{" "}
                    {supplier.paymentTermDays} hari · min. order{" "}
                    {formatCurrency(supplier.minimumOrder)}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="expectedDate" className="label-base">
                  Estimasi tanggal tiba
                </label>
                <Input
                  id="expectedDate"
                  type="date"
                  value={expectedDate}
                  onChange={(event) => setExpectedDate(event.target.value)}
                />
                <p className="mt-1 text-[11px] text-slate-400">
                  Otomatis mengikuti lead time supplier, bisa diubah.
                </p>
              </div>

              <div>
                <label htmlFor="shippingCost" className="label-base">
                  Biaya kirim (Rp)
                </label>
                <Input
                  id="shippingCost"
                  type="number"
                  min={0}
                  value={shippingCost}
                  onChange={(event) => setShippingCost(event.target.value)}
                />
              </div>

              <div>
                <label htmlFor="notes" className="label-base">
                  Catatan untuk supplier
                </label>
                <Input
                  id="notes"
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Kirim pagi, sertakan surat jalan..."
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Item purchase order</CardTitle>
              <CardDescription>
                Harga satuan otomatis memakai harga beli terakhir supplier. Stok
                saat ini membantu menentukan jumlah restock.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 pt-4">
              {availableProducts.length === 0 ? (
                <Alert tone="warning" title="Belum ada produk untuk supplier ini">
                  Hubungkan produk ke supplier terlebih dahulu di menu Supplier.
                </Alert>
              ) : (
                <div className="space-y-2">
                  {items.map((row, index) => {
                    const product = products.find((item) => item.id === row.productId);
                    return (
                      <div
                        key={row.key}
                        className="grid gap-2 rounded-xl border border-slate-200 bg-slate-50/50 p-3 sm:grid-cols-[minmax(0,1.6fr)_90px_130px_36px] sm:items-end"
                      >
                        <div>
                          <label className="mb-1 block text-[11px] font-medium text-slate-500">
                            Produk #{index + 1}
                          </label>
                          <Select
                            value={row.productId}
                            onChange={(event) =>
                              handleProductChange(row.key, event.target.value)
                            }
                          >
                            <option value="">Pilih produk...</option>
                            {availableProducts.map((item) => (
                              <option key={item.id} value={item.id}>
                                {item.name} — {item.sku}
                              </option>
                            ))}
                          </Select>
                          {product && (
                            <p className="mt-1 text-[10px] text-slate-400">
                              Stok {formatNumber(product.stockQty)}{" "}
                              {PRODUCT_UNIT_LABELS[product.unit]} · min{" "}
                              {formatNumber(product.minStockQty)}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="mb-1 block text-[11px] font-medium text-slate-500">
                            Jumlah
                          </label>
                          <Input
                            type="number"
                            min={1}
                            value={row.quantity}
                            onChange={(event) =>
                              updateRow(row.key, { quantity: event.target.value })
                            }
                          />
                        </div>

                        <div>
                          <label className="mb-1 block text-[11px] font-medium text-slate-500">
                            Harga satuan
                          </label>
                          <Input
                            type="number"
                            min={0}
                            value={row.unitCost}
                            onChange={(event) =>
                              updateRow(row.key, { unitCost: event.target.value })
                            }
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => removeRow(row.key)}
                          disabled={items.length === 1}
                          className={buttonClasses({
                            variant: "ghost",
                            size: "sm",
                            className:
                              "h-10 w-9 justify-center px-0 text-rose-500 hover:bg-rose-50 hover:text-rose-700 disabled:opacity-30",
                          })}
                          title="Hapus baris"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              <Button variant="outline" size="sm" onClick={addRow} type="button">
                <Plus className="h-3.5 w-3.5" /> Tambah item
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Ringkasan</CardTitle>
              <CardDescription>Nominal dalam Rupiah.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Subtotal</span>
                <span className="font-semibold text-slate-800">
                  {formatCurrency(subtotal)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Biaya kirim</span>
                <span className="font-semibold text-slate-800">
                  {formatCurrency(shipping)}
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                <span className="text-sm font-semibold text-slate-700">
                  Total PO
                </span>
                <span className="text-lg font-bold text-brand-800">
                  {formatCurrency(total)}
                </span>
              </div>

              {belowMinimum && supplier && (
                <Alert tone="warning" title="Di bawah minimum order">
                  <span className="inline-flex items-center gap-1">
                    <TriangleAlert className="h-3.5 w-3.5" /> Minimum order
                    supplier {formatCurrency(supplier.minimumOrder)}.
                  </span>
                </Alert>
              )}

              <p className="rounded-xl bg-slate-50 p-3 text-[11px] leading-relaxed text-slate-500">
                Beban pembelian baru masuk jurnal kas saat barang diterima
                (Goods Receipt), bukan saat draft dibuat.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-3">
              <Button
                type="button"
                size="lg"
                className="w-full"
                disabled={loading}
                onClick={() => void handleSubmit("ordered")}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Memproses...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" /> Buat & kirim PO
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="w-full"
                disabled={loading}
                onClick={() => void handleSubmit("draft")}
              >
                <Save className="h-4 w-4" /> Simpan sebagai draft
              </Button>
              <Link
                href="/dashboard/scm/purchase-orders"
                className={buttonClasses({
                  variant: "ghost",
                  size: "lg",
                  className: "w-full",
                })}
              >
                Batal
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  );
}
