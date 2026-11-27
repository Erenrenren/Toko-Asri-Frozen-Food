"use client";

import { Loader2, Save, Snowflake, TrendingUp } from "lucide-react";
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
  PRODUCT_CATEGORIES,
  PRODUCT_CATEGORY_LABELS,
  PRODUCT_UNITS,
  PRODUCT_UNIT_LABELS,
} from "@/lib/constants";
import { formatCurrency } from "@/lib/format";
import type { ApiResponse } from "@/types/api";
import type { ProductCategory, ProductDTO, ProductUnit } from "@/types/domain";

interface ProductFormProps {
  mode: "create" | "edit";
  product?: ProductDTO;
}

interface FormState {
  sku: string;
  name: string;
  category: ProductCategory;
  description: string;
  storageTemperature: string;
  shelfLifeDays: string;
  costPrice: string;
  sellPrice: string;
  unit: ProductUnit;
  packSize: string;
  stockQty: string;
  minStockQty: string;
  isActive: boolean;
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

export function ProductForm({ mode, product }: ProductFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>({
    sku: product?.sku ?? "",
    name: product?.name ?? "",
    category: product?.category ?? "nugget",
    description: product?.description ?? "",
    storageTemperature:
      product?.storageTemperature !== null && product?.storageTemperature !== undefined
        ? String(product.storageTemperature)
        : "-18",
    shelfLifeDays:
      product?.shelfLifeDays !== null && product?.shelfLifeDays !== undefined
        ? String(product.shelfLifeDays)
        : "180",
    costPrice: product ? String(product.costPrice) : "",
    sellPrice: product ? String(product.sellPrice) : "",
    unit: product?.unit ?? "pack",
    packSize:
      product?.packSize !== null && product?.packSize !== undefined
        ? String(product.packSize)
        : "1",
    stockQty: product ? String(product.stockQty) : "0",
    minStockQty: product ? String(product.minStockQty) : "5",
    isActive: product?.isActive ?? true,
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const margin = useMemo(() => {
    const cost = Number(form.costPrice);
    const sell = Number(form.sellPrice);
    if (!Number.isFinite(cost) || !Number.isFinite(sell) || sell <= 0) return null;
    return {
      percent: ((sell - cost) / sell) * 100,
      profit: sell - cost,
    };
  }, [form.costPrice, form.sellPrice]);

  function updateField<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const toNumberOrNull = (value: string) =>
      value.trim() === "" ? null : Number(value);
    const toNumber = (value: string, fallback = 0) =>
      value.trim() === "" ? fallback : Number(value);

    const payload = {
      sku: form.sku.trim(),
      name: form.name.trim(),
      category: form.category,
      description: form.description.trim() || null,
      storageTemperature: toNumberOrNull(form.storageTemperature),
      shelfLifeDays: toNumberOrNull(form.shelfLifeDays),
      costPrice: toNumber(form.costPrice),
      sellPrice: toNumber(form.sellPrice),
      unit: form.unit,
      packSize: toNumberOrNull(form.packSize),
      stockQty: toNumber(form.stockQty),
      minStockQty: toNumber(form.minStockQty),
      isActive: form.isActive,
    };

    try {
      const endpoint =
        mode === "create" ? "/api/products" : `/api/products/${product?.id}`;
      const response = await fetch(endpoint, {
        method: mode === "create" ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = (await response.json()) as ApiResponse<ProductDTO>;

      if (!response.ok || !result.success) {
        setError(extractErrorMessage(result));
        return;
      }

      router.push("/dashboard/products");
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
        <Alert tone="danger" title="Gagal menyimpan produk">
          {error}
        </Alert>
      )}

      <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Informasi produk</CardTitle>
              <CardDescription>
                Identitas produk yang akan tampil di katalog dan transaksi.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="sku" className="label-base">
                  Kode / SKU <span className="text-rose-500">*</span>
                </label>
                <Input
                  id="sku"
                  value={form.sku}
                  onChange={(event) =>
                    updateField("sku", event.target.value.toUpperCase())
                  }
                  placeholder="NGT-001"
                  maxLength={32}
                  required
                />
                <p className="mt-1 text-[11px] text-slate-400">
                  Huruf, angka, dan tanda minus. Harus unik.
                </p>
              </div>

              <div>
                <label htmlFor="name" className="label-base">
                  Nama produk <span className="text-rose-500">*</span>
                </label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(event) => updateField("name", event.target.value)}
                  placeholder="Nugget Ayam Premium 500g"
                  required
                />
              </div>

              <div>
                <label htmlFor="category" className="label-base">
                  Kategori <span className="text-rose-500">*</span>
                </label>
                <Select
                  id="category"
                  value={form.category}
                  onChange={(event) =>
                    updateField("category", event.target.value as ProductCategory)
                  }
                >
                  {PRODUCT_CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {PRODUCT_CATEGORY_LABELS[category]}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <label htmlFor="unit" className="label-base">
                  Satuan jual <span className="text-rose-500">*</span>
                </label>
                <Select
                  id="unit"
                  value={form.unit}
                  onChange={(event) =>
                    updateField("unit", event.target.value as ProductUnit)
                  }
                >
                  {PRODUCT_UNITS.map((unit) => (
                    <option key={unit} value={unit}>
                      {PRODUCT_UNIT_LABELS[unit]}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <label htmlFor="packSize" className="label-base">
                  Isi per kemasan
                </label>
                <Input
                  id="packSize"
                  type="number"
                  min={1}
                  value={form.packSize}
                  onChange={(event) => updateField("packSize", event.target.value)}
                  placeholder="Contoh: 10"
                />
                <p className="mt-1 text-[11px] text-slate-400">
                  Jumlah pcs di dalam pack/karton (opsional).
                </p>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="description" className="label-base">
                  Deskripsi
                </label>
                <Textarea
                  id="description"
                  value={form.description}
                  onChange={(event) => updateField("description", event.target.value)}
                  placeholder="Deskripsi singkat produk, keunggulan, atau cara penyajian..."
                  maxLength={500}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Penyimpanan & stok</CardTitle>
              <CardDescription>
                Informasi cold-chain dasar. Logika restock otomatis akan masuk pada
                modul SCM (Tahap 2).
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="storageTemperature" className="label-base">
                  Suhu penyimpanan (°C)
                </label>
                <Input
                  id="storageTemperature"
                  type="number"
                  step="0.5"
                  min={-60}
                  max={20}
                  value={form.storageTemperature}
                  onChange={(event) =>
                    updateField("storageTemperature", event.target.value)
                  }
                  placeholder="-18"
                />
              </div>

              <div>
                <label htmlFor="shelfLifeDays" className="label-base">
                  Masa simpan (hari)
                </label>
                <Input
                  id="shelfLifeDays"
                  type="number"
                  min={1}
                  value={form.shelfLifeDays}
                  onChange={(event) =>
                    updateField("shelfLifeDays", event.target.value)
                  }
                  placeholder="180"
                />
              </div>

              <div>
                <label htmlFor="stockQty" className="label-base">
                  Stok saat ini
                </label>
                <Input
                  id="stockQty"
                  type="number"
                  min={0}
                  value={form.stockQty}
                  onChange={(event) => updateField("stockQty", event.target.value)}
                />
              </div>

              <div>
                <label htmlFor="minStockQty" className="label-base">
                  Stok minimum
                </label>
                <Input
                  id="minStockQty"
                  type="number"
                  min={0}
                  value={form.minStockQty}
                  onChange={(event) =>
                    updateField("minStockQty", event.target.value)
                  }
                />
                <p className="mt-1 text-[11px] text-slate-400">
                  Dipakai untuk peringatan stok menipis di dashboard.
                </p>
              </div>

              <label className="sm:col-span-2 flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(event) => updateField("isActive", event.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                />
                <span>
                  <span className="block text-sm font-medium text-slate-800">
                    Produk aktif
                  </span>
                  <span className="mt-0.5 block text-xs text-slate-500">
                    Produk aktif dapat dipilih saat mencatat penjualan dan tampil di
                    katalog pelanggan.
                  </span>
                </span>
              </label>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Harga & margin</CardTitle>
              <CardDescription>
                Semua nominal dalam Rupiah tanpa desimal.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label htmlFor="costPrice" className="label-base">
                  Harga beli / HPP <span className="text-rose-500">*</span>
                </label>
                <Input
                  id="costPrice"
                  type="number"
                  min={0}
                  value={form.costPrice}
                  onChange={(event) => updateField("costPrice", event.target.value)}
                  placeholder="28000"
                  required
                />
              </div>

              <div>
                <label htmlFor="sellPrice" className="label-base">
                  Harga jual <span className="text-rose-500">*</span>
                </label>
                <Input
                  id="sellPrice"
                  type="number"
                  min={0}
                  value={form.sellPrice}
                  onChange={(event) => updateField("sellPrice", event.target.value)}
                  placeholder="38000"
                  required
                />
              </div>

              <div className="rounded-xl border border-brand-100 bg-brand-50/60 p-4">
                <div className="flex items-center gap-2 text-brand-800">
                  <TrendingUp className="h-4 w-4" />
                  <p className="text-xs font-semibold">Pratinjau margin</p>
                </div>
                {margin ? (
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-brand-700/70">
                        Margin
                      </p>
                      <p className="text-lg font-bold text-brand-900">
                        {margin.percent.toFixed(1).replace(".", ",")}%
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-brand-700/70">
                        Laba / unit
                      </p>
                      <p className="text-lg font-bold text-brand-900">
                        {formatCurrency(margin.profit)}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="mt-2 text-xs text-brand-700">
                    Isi HPP dan harga jual untuk melihat margin.
                  </p>
                )}
              </div>

              <div className="flex items-start gap-2 rounded-xl bg-slate-50 p-3 text-[11px] leading-relaxed text-slate-500">
                <Snowflake className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-500" />
                Harga jual di bawah HPP tetap diizinkan untuk strategi clearance,
                tetapi margin akan bernilai negatif.
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-3">
              <Button type="submit" size="lg" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Menyimpan...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    {mode === "create" ? "Simpan produk" : "Simpan perubahan"}
                  </>
                )}
              </Button>
              <Link
                href="/dashboard/products"
                className={buttonClasses({
                  variant: "outline",
                  size: "lg",
                  className: "w-full",
                })}
              >
                Batal
              </Link>
              <p className="text-center text-[11px] text-slate-400">
                Field bertanda <span className="text-rose-500">*</span> wajib diisi.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  );
}
