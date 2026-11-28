"use client";

import { Loader2, Save, Search, Truck } from "lucide-react";
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
  SUPPLIER_DELIVERY_DAYS,
  SUPPLIER_DELIVERY_DAY_LABELS,
} from "@/lib/constants";
import { formatCurrency } from "@/lib/format";
import type { ApiResponse } from "@/types/api";
import type {
  ProductUnit,
  SupplierDeliveryDay,
  SupplierDTO,
} from "@/types/domain";

interface ProductOption {
  id: string;
  sku: string;
  name: string;
  unit: ProductUnit;
  costPrice: number;
}

interface SupplierFormProps {
  mode: "create" | "edit";
  supplier?: SupplierDTO;
  products: ProductOption[];
}

interface FormState {
  name: string;
  contactName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  paymentTermDays: string;
  leadTimeDays: string;
  minimumOrder: string;
  notes: string;
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

export function SupplierForm({ mode, supplier, products }: SupplierFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>({
    name: supplier?.name ?? "",
    contactName: supplier?.contactName ?? "",
    phone: supplier?.phone ?? "",
    email: supplier?.email ?? "",
    address: supplier?.address ?? "",
    city: supplier?.city ?? "",
    paymentTermDays: String(supplier?.paymentTermDays ?? 30),
    leadTimeDays: String(supplier?.leadTimeDays ?? 2),
    minimumOrder: String(supplier?.minimumOrder ?? 0),
    notes: supplier?.notes ?? "",
    isActive: supplier?.isActive ?? true,
  });
  const [deliveryDays, setDeliveryDays] = useState<SupplierDeliveryDay[]>(
    supplier?.deliveryDays ?? [],
  );
  const [selected, setSelected] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    supplier?.suppliedProducts.forEach((item) => {
      initial[item.productId] = true;
    });
    return initial;
  });
  const [prices, setPrices] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    supplier?.suppliedProducts.forEach((item) => {
      initial[item.productId] =
        item.lastPrice !== null ? String(item.lastPrice) : "";
    });
    return initial;
  });
  const [productSearch, setProductSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const selectedCount = Object.values(selected).filter(Boolean).length;

  const filteredProducts = useMemo(() => {
    const keyword = productSearch.trim().toLowerCase();
    if (!keyword) return products;
    return products.filter(
      (product) =>
        product.name.toLowerCase().includes(keyword) ||
        product.sku.toLowerCase().includes(keyword),
    );
  }, [products, productSearch]);

  function updateField<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function toggleDay(day: SupplierDeliveryDay) {
    setDeliveryDays((current) =>
      current.includes(day)
        ? current.filter((item) => item !== day)
        : [...current, day],
    );
  }

  function toggleProduct(product: ProductOption) {
    setSelected((current) => {
      const next = { ...current, [product.id]: !current[product.id] };
      if (next[product.id] && !prices[product.id]) {
        setPrices((priceMap) => ({
          ...priceMap,
          [product.id]: String(product.costPrice),
        }));
      }
      return next;
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const chosen = products.filter((product) => selected[product.id]);
    if (chosen.length === 0) {
      setError("Pilih minimal satu produk yang disuplai.");
      return;
    }

    const toNumber = (value: string, fallback = 0) =>
      value.trim() === "" ? fallback : Number(value);

    const existingLinks = new Map(
      (supplier?.suppliedProducts ?? []).map((item) => [item.productId, item]),
    );

    const payload = {
      name: form.name.trim(),
      contactName: form.contactName.trim() || null,
      phone: form.phone.trim() || null,
      email: form.email.trim() || null,
      address: form.address.trim() || null,
      city: form.city.trim() || null,
      paymentTermDays: toNumber(form.paymentTermDays),
      leadTimeDays: toNumber(form.leadTimeDays),
      deliveryDays,
      minimumOrder: toNumber(form.minimumOrder),
      notes: form.notes.trim() || null,
      isActive: form.isActive,
      products: chosen.map((product) => ({
        productId: product.id,
        supplierSku: existingLinks.get(product.id)?.supplierSku ?? null,
        lastPrice: prices[product.id]?.trim()
          ? Number(prices[product.id])
          : null,
        isPreferred: existingLinks.get(product.id)?.isPreferred ?? false,
      })),
    };

    setLoading(true);
    try {
      const endpoint =
        mode === "create"
          ? "/api/scm/suppliers"
          : `/api/scm/suppliers/${supplier?.id}`;
      const response = await fetch(endpoint, {
        method: mode === "create" ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = (await response.json()) as ApiResponse<SupplierDTO>;

      if (!response.ok || !result.success) {
        setError(extractErrorMessage(result));
        return;
      }

      router.push("/dashboard/scm/suppliers");
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
        <Alert tone="danger" title="Gagal menyimpan supplier">
          {error}
        </Alert>
      )}

      <div className="grid gap-5 xl:grid-cols-[1.35fr_1fr]">
        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Identitas supplier</CardTitle>
              <CardDescription>
                Data kontak dan lokasi pemasok yang menjadi mitra Toko Asri.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="name" className="label-base">
                  Nama supplier / perusahaan{" "}
                  <span className="text-rose-500">*</span>
                </label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(event) => updateField("name", event.target.value)}
                  placeholder="PT Frozen Nusantara"
                  required
                />
              </div>

              <div>
                <label htmlFor="contactName" className="label-base">
                  Nama kontak
                </label>
                <Input
                  id="contactName"
                  value={form.contactName}
                  onChange={(event) =>
                    updateField("contactName", event.target.value)
                  }
                  placeholder="Pak Hendra"
                />
              </div>

              <div>
                <label htmlFor="phone" className="label-base">
                  Nomor telepon
                </label>
                <Input
                  id="phone"
                  value={form.phone}
                  onChange={(event) => updateField("phone", event.target.value)}
                  placeholder="0812-3456-7890"
                />
              </div>

              <div>
                <label htmlFor="email" className="label-base">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(event) => updateField("email", event.target.value)}
                  placeholder="sales@supplier.co.id"
                />
              </div>

              <div>
                <label htmlFor="city" className="label-base">
                  Kota
                </label>
                <Input
                  id="city"
                  value={form.city}
                  onChange={(event) => updateField("city", event.target.value)}
                  placeholder="Bandung"
                />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="address" className="label-base">
                  Alamat
                </label>
                <Textarea
                  id="address"
                  value={form.address}
                  onChange={(event) => updateField("address", event.target.value)}
                  placeholder="Alamat gudang / kantor supplier..."
                  className="min-h-[4.5rem]"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-brand-600" />
                <CardTitle>Produk yang disuplai</CardTitle>
              </div>
              <CardDescription>
                Pilih produk yang biasa dipasok. Harga beli terakhir dipakai sebagai
                default saat membuat purchase order.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 pt-4">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  value={productSearch}
                  onChange={(event) => setProductSearch(event.target.value)}
                  placeholder="Cari nama atau SKU produk..."
                  className="pl-9"
                />
              </div>

              <div className="rounded-xl border border-slate-200">
                <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  <span>Katalog produk</span>
                  <span>{selectedCount} dipilih</span>
                </div>
                <div className="subtle-scrollbar max-h-80 space-y-1 overflow-y-auto p-2">
                  {filteredProducts.length === 0 ? (
                    <p className="px-2 py-6 text-center text-xs text-slate-500">
                      Produk tidak ditemukan.
                    </p>
                  ) : (
                    filteredProducts.map((product) => {
                      const isSelected = Boolean(selected[product.id]);
                      return (
                        <div
                          key={product.id}
                          className="rounded-lg px-2 py-2 hover:bg-slate-50"
                        >
                          <label className="flex cursor-pointer items-start gap-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleProduct(product)}
                              className="mt-1 h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                            />
                            <span className="min-w-0 flex-1">
                              <span className="block text-sm font-medium text-slate-800">
                                {product.name}
                              </span>
                              <span className="text-[11px] text-slate-400">
                                {product.sku} · per{" "}
                                {PRODUCT_UNIT_LABELS[product.unit]} · HPP{" "}
                                {formatCurrency(product.costPrice)}
                              </span>
                            </span>
                          </label>
                          {isSelected && (
                            <div className="mt-2 pl-7">
                              <label className="mb-1 block text-[11px] font-medium text-slate-500">
                                Harga beli terakhir (Rp)
                              </label>
                              <Input
                                type="number"
                                min={0}
                                value={prices[product.id] ?? ""}
                                onChange={(event) =>
                                  setPrices((current) => ({
                                    ...current,
                                    [product.id]: event.target.value,
                                  }))
                                }
                                placeholder={String(product.costPrice)}
                                className="h-9 text-xs"
                              />
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Pengiriman & pembayaran</CardTitle>
              <CardDescription>
                Dipakai untuk estimasi tanggal PO dan penjadwalan restock.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label htmlFor="leadTimeDays" className="label-base">
                  Lead time (hari) <span className="text-rose-500">*</span>
                </label>
                <Input
                  id="leadTimeDays"
                  type="number"
                  min={0}
                  max={90}
                  value={form.leadTimeDays}
                  onChange={(event) =>
                    updateField("leadTimeDays", event.target.value)
                  }
                  required
                />
                <p className="mt-1 text-[11px] text-slate-400">
                  Estimasi barang tiba setelah PO dikirim.
                </p>
              </div>

              <div>
                <label htmlFor="paymentTermDays" className="label-base">
                  Termin pembayaran (hari)
                </label>
                <Input
                  id="paymentTermDays"
                  type="number"
                  min={0}
                  max={365}
                  value={form.paymentTermDays}
                  onChange={(event) =>
                    updateField("paymentTermDays", event.target.value)
                  }
                />
              </div>

              <div>
                <label htmlFor="minimumOrder" className="label-base">
                  Minimum order (Rp)
                </label>
                <Input
                  id="minimumOrder"
                  type="number"
                  min={0}
                  value={form.minimumOrder}
                  onChange={(event) =>
                    updateField("minimumOrder", event.target.value)
                  }
                />
              </div>

              <div>
                <span className="label-base">Jadwal pengiriman</span>
                <div className="grid grid-cols-2 gap-1.5">
                  {SUPPLIER_DELIVERY_DAYS.map((day) => {
                    const active = deliveryDays.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleDay(day)}
                        className={
                          active
                            ? "rounded-lg border border-brand-300 bg-brand-50 px-2 py-1.5 text-xs font-semibold text-brand-800"
                            : "rounded-lg border border-slate-200 px-2 py-1.5 text-xs font-medium text-slate-500 hover:border-brand-200 hover:text-brand-700"
                        }
                      >
                        {SUPPLIER_DELIVERY_DAY_LABELS[day]}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label htmlFor="notes" className="label-base">
                  Catatan
                </label>
                <Textarea
                  id="notes"
                  value={form.notes}
                  onChange={(event) => updateField("notes", event.target.value)}
                  placeholder="Mis. minimal kirim 20 karton, bisa titip di gudang..."
                  className="min-h-[4.5rem]"
                />
              </div>

              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(event) =>
                    updateField("isActive", event.target.checked)
                  }
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                />
                <span>
                  <span className="block text-sm font-medium text-slate-800">
                    Supplier aktif
                  </span>
                  <span className="mt-0.5 block text-xs text-slate-500">
                    Supplier aktif dapat dipilih saat membuat purchase order.
                  </span>
                </span>
              </label>
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
                    {mode === "create" ? "Simpan supplier" : "Simpan perubahan"}
                  </>
                )}
              </Button>
              <Link
                href="/dashboard/scm/suppliers"
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
        </div>
      </div>
    </form>
  );
}
