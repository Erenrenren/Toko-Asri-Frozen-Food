"use client";

import {
  ArrowDownLeft,
  ArrowUpRight,
  Calculator,
  Info,
  Loader2,
  Save,
  ShoppingCart,
  Wallet,
} from "lucide-react";
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
import {
  PRODUCT_UNIT_LABELS,
  TRANSACTION_CATEGORY_LABELS,
} from "@/lib/constants";
import { formatCurrency, formatDateInput, formatNumber } from "@/lib/format";
import type { ApiResponse } from "@/types/api";
import type {
  ProductUnit,
  TransactionCategory,
  TransactionDTO,
  TransactionType,
} from "@/types/domain";

interface ProductOption {
  id: string;
  sku: string;
  name: string;
  sellPrice: number;
  costPrice: number;
  unit: ProductUnit;
  stockQty: number;
}

interface TransactionFormProps {
  products: ProductOption[];
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

const categoriesByType: Record<TransactionType, TransactionCategory[]> = {
  income: ["sales", "other"],
  expense: ["purchase", "operational", "other"],
};

export function TransactionForm({ products }: TransactionFormProps) {
  const router = useRouter();
  const [type, setType] = useState<TransactionType>("income");
  const [category, setCategory] = useState<TransactionCategory>("sales");
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unitPrice, setUnitPrice] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [occurredAt, setOccurredAt] = useState(formatDateInput(new Date()));
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const selectedProduct = useMemo(
    () => products.find((product) => product.id === productId) ?? null,
    [productId, products],
  );

  const isSale = type === "income" && category === "sales";
  const numericQuantity = Number(quantity) || 0;
  const numericUnitPrice = Number(unitPrice) || 0;
  const numericAmount = Number(amount) || 0;
  const saleTotal = numericQuantity * numericUnitPrice;
  const estimatedCost = numericQuantity * (selectedProduct?.costPrice ?? 0);
  const estimatedProfit = saleTotal - estimatedCost;

  function changeType(nextType: TransactionType) {
    setType(nextType);
    const nextCategory = nextType === "income" ? "sales" : "operational";
    setCategory(nextCategory);
    setError(null);
    if (nextType === "expense") {
      setProductId("");
      setQuantity("1");
      setUnitPrice("");
    }
  }

  function changeCategory(nextCategory: TransactionCategory) {
    setCategory(nextCategory);
    if (!(type === "income" && nextCategory === "sales")) {
      setProductId("");
      setQuantity("1");
      setUnitPrice("");
    }
  }

  function changeProduct(nextProductId: string) {
    setProductId(nextProductId);
    const product = products.find((item) => item.id === nextProductId);
    if (product) {
      setUnitPrice(String(product.sellPrice));
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (description.trim().length < 3) {
      setError("Keterangan minimal 3 karakter.");
      return;
    }

    if (!occurredAt) {
      setError("Tanggal transaksi wajib diisi.");
      return;
    }

    if (isSale) {
      if (!productId) {
        setError("Pilih produk yang dijual terlebih dahulu.");
        return;
      }
      if (numericQuantity <= 0) {
        setError("Jumlah terjual harus lebih dari 0.");
        return;
      }
      if (numericUnitPrice <= 0) {
        setError("Harga satuan harus lebih dari 0.");
        return;
      }
    } else if (numericAmount <= 0) {
      setError("Nominal transaksi harus lebih dari 0.");
      return;
    }

    setLoading(true);
    try {
      const payload = isSale
        ? {
            type,
            category,
            description: description.trim(),
            occurredAt,
            productId,
            quantity: numericQuantity,
            unitPrice: numericUnitPrice,
          }
        : {
            type,
            category,
            description: description.trim(),
            occurredAt,
            amount: numericAmount,
          };

      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = (await response.json()) as ApiResponse<TransactionDTO>;

      if (!response.ok || !result.success) {
        setError(extractErrorMessage(result));
        return;
      }

      router.push("/dashboard/transactions");
      router.refresh();
    } catch {
      setError("Tidak dapat menghubungi server. Periksa koneksi Anda.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <Alert tone="danger" title="Gagal menyimpan transaksi">
          {error}
        </Alert>
      )}

      <div className="grid gap-5 xl:grid-cols-[1.35fr_1fr]">
        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Detail transaksi</CardTitle>
              <CardDescription>
                Pilih jenis, kategori, tanggal, dan keterangan transaksi.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="label-base">Jenis transaksi</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => changeType("income")}
                    className={
                      type === "income"
                        ? "flex items-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 px-3.5 py-3 text-left ring-2 ring-emerald-100"
                        : "flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-left transition hover:border-slate-300"
                    }
                  >
                    <span
                      className={
                        type === "income"
                          ? "grid h-9 w-9 place-items-center rounded-lg bg-emerald-100 text-emerald-700"
                          : "grid h-9 w-9 place-items-center rounded-lg bg-slate-100 text-slate-500"
                      }
                    >
                      <ArrowDownLeft className="h-4 w-4" />
                    </span>
                    <span>
                      <span className="block text-sm font-semibold text-slate-800">
                        Pemasukan
                      </span>
                      <span className="block text-[11px] text-slate-500">
                        Penjualan / pendapatan
                      </span>
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => changeType("expense")}
                    className={
                      type === "expense"
                        ? "flex items-center gap-2 rounded-xl border border-rose-300 bg-rose-50 px-3.5 py-3 text-left ring-2 ring-rose-100"
                        : "flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-left transition hover:border-slate-300"
                    }
                  >
                    <span
                      className={
                        type === "expense"
                          ? "grid h-9 w-9 place-items-center rounded-lg bg-rose-100 text-rose-700"
                          : "grid h-9 w-9 place-items-center rounded-lg bg-slate-100 text-slate-500"
                      }
                    >
                      <ArrowUpRight className="h-4 w-4" />
                    </span>
                    <span>
                      <span className="block text-sm font-semibold text-slate-800">
                        Pengeluaran
                      </span>
                      <span className="block text-[11px] text-slate-500">
                        Restock / operasional
                      </span>
                    </span>
                  </button>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="category" className="label-base">
                    Kategori <span className="text-rose-500">*</span>
                  </label>
                  <Select
                    id="category"
                    value={category}
                    onChange={(event) =>
                      changeCategory(event.target.value as TransactionCategory)
                    }
                  >
                    {categoriesByType[type].map((item) => (
                      <option key={item} value={item}>
                        {TRANSACTION_CATEGORY_LABELS[item]}
                      </option>
                    ))}
                  </Select>
                </div>

                <div>
                  <label htmlFor="occurredAt" className="label-base">
                    Tanggal transaksi <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    id="occurredAt"
                    type="date"
                    value={occurredAt}
                    max={formatDateInput(new Date())}
                    onChange={(event) => setOccurredAt(event.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="description" className="label-base">
                  Keterangan <span className="text-rose-500">*</span>
                </label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder={
                    isSale
                      ? "Contoh: Penjualan nugget ayam 3 pack ke pelanggan"
                      : "Contoh: Pembelian plastik kemasan dan label harga"
                  }
                  maxLength={500}
                  required
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Nilai transaksi</CardTitle>
              <CardDescription>
                {isSale
                  ? "Pilih produk, jumlah, dan harga jual. Nominal dihitung otomatis."
                  : "Masukkan nominal pengeluaran atau pemasukan non-penjualan."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isSale ? (
                <>
                  <div>
                    <label htmlFor="productId" className="label-base">
                      Produk <span className="text-rose-500">*</span>
                    </label>
                    <Select
                      id="productId"
                      value={productId}
                      onChange={(event) => changeProduct(event.target.value)}
                    >
                      <option value="">Pilih produk...</option>
                      {products.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.name} ({product.sku}) · stok {product.stockQty}{" "}
                          {PRODUCT_UNIT_LABELS[product.unit]}
                        </option>
                      ))}
                    </Select>
                    {products.length === 0 && (
                      <p className="mt-1 text-[11px] text-rose-600">
                        Belum ada produk aktif. Tambahkan produk terlebih dahulu.
                      </p>
                    )}
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="quantity" className="label-base">
                        Jumlah terjual <span className="text-rose-500">*</span>
                      </label>
                      <Input
                        id="quantity"
                        type="number"
                        min={1}
                        value={quantity}
                        onChange={(event) => setQuantity(event.target.value)}
                        required
                      />
                      {selectedProduct && (
                        <p className="mt-1 text-[11px] text-slate-400">
                          Satuan: {PRODUCT_UNIT_LABELS[selectedProduct.unit]}
                        </p>
                      )}
                    </div>
                    <div>
                      <label htmlFor="unitPrice" className="label-base">
                        Harga satuan <span className="text-rose-500">*</span>
                      </label>
                      <Input
                        id="unitPrice"
                        type="number"
                        min={1}
                        value={unitPrice}
                        onChange={(event) => setUnitPrice(event.target.value)}
                        placeholder="38000"
                        required
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div>
                  <label htmlFor="amount" className="label-base">
                    Nominal <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-400">
                      Rp
                    </span>
                    <Input
                      id="amount"
                      type="number"
                      min={1}
                      value={amount}
                      onChange={(event) => setAmount(event.target.value)}
                      placeholder="1250000"
                      className="pl-9"
                      required
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-slate-400">
                    Masukkan angka tanpa titik atau koma.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Ringkasan</CardTitle>
              <CardDescription>Pratinjau sebelum transaksi disimpan.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-xl bg-slate-900 p-4 text-white">
                <p className="text-[10px] uppercase tracking-wide text-slate-400">
                  {isSale ? "Total penjualan" : "Nominal transaksi"}
                </p>
                <p className="mt-1 text-2xl font-bold">
                  {formatCurrency(isSale ? saleTotal : numericAmount)}
                </p>
                <p className="mt-1 text-[11px] text-slate-400">
                  {isSale
                    ? `${formatNumber(numericQuantity)} × ${formatCurrency(numericUnitPrice)}`
                    : TRANSACTION_CATEGORY_LABELS[category]}
                </p>
              </div>

              {isSale && (
                <div className="space-y-2 rounded-xl border border-slate-200 p-4 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Estimasi HPP</span>
                    <span className="font-semibold text-slate-700">
                      {formatCurrency(estimatedCost)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Estimasi laba kotor</span>
                    <span
                      className={
                        estimatedProfit >= 0
                          ? "font-semibold text-emerald-700"
                          : "font-semibold text-rose-700"
                      }
                    >
                      {formatCurrency(estimatedProfit)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-t border-slate-100 pt-2">
                    <span className="text-slate-500">Margin</span>
                    <span className="font-semibold text-brand-700">
                      {saleTotal > 0
                        ? `${((estimatedProfit / saleTotal) * 100)
                            .toFixed(1)
                            .replace(".", ",")}%`
                        : "—"}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-2 rounded-xl bg-sky-50 p-3 text-[11px] leading-relaxed text-sky-800">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                Tahap 1 hanya mencatat transaksi keuangan. Pengurangan stok otomatis
                dan restock akan ditangani modul SCM pada Tahap 2.
              </div>

              <Button type="submit" size="lg" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Menyimpan...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" /> Simpan transaksi
                  </>
                )}
              </Button>
              <Link
                href="/dashboard/transactions"
                className={buttonClasses({
                  variant: "outline",
                  size: "lg",
                  className: "w-full",
                })}
              >
                Batal
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                <Calculator className="h-4 w-4 text-brand-600" /> Alur pencatatan
              </div>
              <div className="space-y-2 text-[11px] leading-relaxed text-slate-500">
                <p className="flex items-start gap-2">
                  <ShoppingCart className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-500" />
                  Penjualan menyimpan snapshot HPP, sehingga laba kotor historis
                  tidak berubah saat harga produk diperbarui.
                </p>
                <p className="flex items-start gap-2">
                  <Wallet className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-500" />
                  Pengeluaran restock dan operasional langsung mengurangi laba
                  bersih bulan berjalan.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  );
}
