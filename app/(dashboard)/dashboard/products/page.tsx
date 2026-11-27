import { Package, Plus, Snowflake } from "lucide-react";
import Link from "next/link";

import { ProductFilters } from "@/components/products/product-filters";
import { ProductRowActions } from "@/components/products/product-row-actions";
import { Badge } from "@/components/ui/badge";
import { buttonClasses } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import {
  PRODUCT_CATEGORIES,
  PRODUCT_CATEGORY_LABELS,
  PRODUCT_UNIT_LABELS,
} from "@/lib/constants";
import { formatCurrency, formatNumber } from "@/lib/format";
import { listProducts } from "@/lib/services/product.service";
import type { ProductCategory } from "@/types/domain";

export const dynamic = "force-dynamic";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const rawSearch = typeof params.search === "string" ? params.search : undefined;
  const rawCategory =
    typeof params.category === "string" ? params.category : undefined;
  const rawStatus = typeof params.status === "string" ? params.status : "all";
  const rawPage = typeof params.page === "string" ? Number(params.page) : 1;

  const category = (PRODUCT_CATEGORIES as readonly string[]).includes(
    rawCategory ?? "",
  )
    ? (rawCategory as ProductCategory)
    : undefined;
  const status = ["active", "inactive", "all"].includes(rawStatus)
    ? (rawStatus as "active" | "inactive" | "all")
    : "all";
  const page = Number.isFinite(rawPage) && rawPage > 0 ? Math.floor(rawPage) : 1;

  const result = await listProducts({
    search: rawSearch,
    category,
    status,
    page,
    pageSize: 10,
    skip: (page - 1) * 10,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Master data"
        title="Katalog produk"
        description="Kelola SKU, kategori, HPP, harga jual, satuan kemasan, dan status produk frozen food."
        action={
          <Link href="/dashboard/products/new" className={buttonClasses()}>
            <Plus className="h-4 w-4" /> Tambah produk
          </Link>
        }
      />

      <Card>
        <div className="border-b border-slate-100 p-5 sm:p-6">
          <ProductFilters
            search={rawSearch}
            category={category}
            status={status}
          />
          <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
            <Badge tone="slate">{result.meta.total} produk</Badge>
            <span>·</span>
            <span>Harga dalam Rupiah, HPP diambil dari master produk.</span>
          </div>
        </div>

        {result.items.length === 0 ? (
          <EmptyState
            icon={Package}
            title="Produk tidak ditemukan"
            description="Ubah kata kunci/filter, atau tambahkan produk frozen food pertama Anda."
            action={
              <Link
                href="/dashboard/products/new"
                className={buttonClasses({ size: "sm" })}
              >
                <Plus className="h-3.5 w-3.5" /> Tambah produk
              </Link>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr>
                  <th>Produk</th>
                  <th>Kategori</th>
                  <th>Harga</th>
                  <th>Stok</th>
                  <th>Penyimpanan</th>
                  <th>Status</th>
                  <th className="text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {result.items.map((product) => (
                  <tr key={product.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600 ring-1 ring-brand-100">
                          <Snowflake className="h-4 w-4" />
                        </span>
                        <div className="min-w-0">
                          <p className="max-w-[240px] truncate text-sm font-semibold text-slate-800">
                            {product.name}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {product.sku} · per {PRODUCT_UNIT_LABELS[product.unit]}
                            {product.packSize && product.packSize > 1
                              ? ` · isi ${product.packSize}`
                              : ""}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <Badge tone="brand">
                        {PRODUCT_CATEGORY_LABELS[product.category]}
                      </Badge>
                    </td>
                    <td>
                      <p className="text-sm font-semibold text-slate-800">
                        {formatCurrency(product.sellPrice)}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        HPP {formatCurrency(product.costPrice)} · margin{" "}
                        {product.margin}%
                      </p>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-700">
                          {formatNumber(product.stockQty)}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {PRODUCT_UNIT_LABELS[product.unit]}
                        </span>
                      </div>
                      {product.stockQty <= product.minStockQty && (
                        <Badge tone="amber" className="mt-1">
                          Min. {formatNumber(product.minStockQty)}
                        </Badge>
                      )}
                    </td>
                    <td className="whitespace-nowrap text-xs text-slate-500">
                      {product.storageTemperature !== null
                        ? `${product.storageTemperature}°C`
                        : "—"}
                      <span className="mx-1 text-slate-300">·</span>
                      {product.shelfLifeDays !== null
                        ? `${product.shelfLifeDays} hari`
                        : "—"}
                    </td>
                    <td>
                      {product.isActive ? (
                        <Badge tone="green">Aktif</Badge>
                      ) : (
                        <Badge tone="slate">Nonaktif</Badge>
                      )}
                    </td>
                    <td>
                      <ProductRowActions product={product} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Pagination
          meta={result.meta}
          basePath="/dashboard/products"
          query={{
            search: rawSearch,
            category,
            status,
          }}
        />
      </Card>
    </div>
  );
}
