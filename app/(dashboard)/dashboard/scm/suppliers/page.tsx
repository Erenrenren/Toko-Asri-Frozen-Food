import { Plus, Search, Truck } from "lucide-react";
import Link from "next/link";

import { ActiveStatusBadge } from "@/components/scm/scm-badges";
import { SupplierRowActions } from "@/components/scm/supplier-row-actions";
import { Badge } from "@/components/ui/badge";
import { buttonClasses } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import {
  SUPPLIER_DELIVERY_DAY_LABELS,
} from "@/lib/constants";
import { formatNumber } from "@/lib/format";
import { listSuppliers } from "@/lib/services/scm/supplier.service";

export const dynamic = "force-dynamic";
export const metadata = { title: "Supplier" };

export default async function SuppliersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const rawSearch = typeof params.search === "string" ? params.search : undefined;
  const rawStatus = typeof params.status === "string" ? params.status : "all";
  const rawPage = typeof params.page === "string" ? Number(params.page) : 1;

  const status = ["active", "inactive", "all"].includes(rawStatus)
    ? (rawStatus as "active" | "inactive" | "all")
    : "all";
  const page = Number.isFinite(rawPage) && rawPage > 0 ? Math.floor(rawPage) : 1;
  const pageSize = 10;

  const result = await listSuppliers({
    search: rawSearch,
    status,
    page,
    pageSize,
    skip: (page - 1) * pageSize,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Master data SCM"
        title="Supplier / pemasok"
        description="Kelola kontak, jadwal pengiriman, lead time, termin pembayaran, dan produk yang disuplai."
        action={
          <Link
            href="/dashboard/scm/suppliers/new"
            className={buttonClasses()}
          >
            <Plus className="h-4 w-4" /> Tambah supplier
          </Link>
        }
      />

      <Card>
        <div className="border-b border-slate-100 p-5 sm:p-6">
          <form className="grid gap-3 sm:grid-cols-[1fr_180px_auto]" method="get">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                name="search"
                defaultValue={rawSearch ?? ""}
                placeholder="Cari nama, kode, kontak, atau kota..."
                className="input-base pl-9"
              />
            </div>
            <select
              name="status"
              defaultValue={status}
              className="input-base"
              aria-label="Filter status supplier"
            >
              <option value="all">Semua status</option>
              <option value="active">Aktif</option>
              <option value="inactive">Nonaktif</option>
            </select>
            <button type="submit" className={buttonClasses()}>
              Terapkan
            </button>
          </form>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
            <Badge tone="slate">{result.meta.total} supplier</Badge>
            <span>·</span>
            <span>Lead time dipakai untuk estimasi tanggal PO.</span>
          </div>
        </div>

        {result.items.length === 0 ? (
          <EmptyState
            icon={Truck}
            title="Supplier tidak ditemukan"
            description="Ubah filter atau tambahkan supplier pertama untuk memulai pengadaan."
            action={
              <Link
                href="/dashboard/scm/suppliers/new"
                className={buttonClasses({ size: "sm" })}
              >
                <Plus className="h-3.5 w-3.5" /> Tambah supplier
              </Link>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr>
                  <th>Supplier</th>
                  <th>Kontak</th>
                  <th>Pengiriman</th>
                  <th>Produk</th>
                  <th>Purchase order</th>
                  <th>Status</th>
                  <th className="text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {result.items.map((supplier) => (
                  <tr key={supplier.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600 ring-1 ring-brand-100">
                          <Truck className="h-4 w-4" />
                        </span>
                        <div className="min-w-0">
                          <p className="max-w-[220px] truncate text-sm font-semibold text-slate-800">
                            {supplier.name}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {supplier.code}
                            {supplier.city ? ` · ${supplier.city}` : ""}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <p className="text-xs font-medium text-slate-700">
                        {supplier.contactName ?? "—"}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {supplier.phone ?? supplier.email ?? "Kontak belum diisi"}
                      </p>
                    </td>
                    <td>
                      <p className="text-xs text-slate-700">
                        Lead time {supplier.leadTimeDays} hari
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Termin {supplier.paymentTermDays} hari
                      </p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {supplier.deliveryDays.length === 0 ? (
                          <span className="text-[10px] text-slate-400">
                            Jadwal belum diatur
                          </span>
                        ) : (
                          supplier.deliveryDays.map((day) => (
                            <Badge key={day} tone="sky" className="text-[10px]">
                              {SUPPLIER_DELIVERY_DAY_LABELS[day]}
                            </Badge>
                          ))
                        )}
                      </div>
                    </td>
                    <td>
                      <Badge tone="brand">
                        {formatNumber(supplier.suppliedProducts.length)} produk
                      </Badge>
                      <p className="mt-1 max-w-[180px] truncate text-[10px] text-slate-400">
                        {supplier.suppliedProducts
                          .slice(0, 2)
                          .map((item) => item.name)
                          .join(", ") || "Belum ada produk"}
                      </p>
                    </td>
                    <td>
                      <p className="text-sm font-semibold text-slate-800">
                        {formatNumber(supplier.purchaseOrderCount)}
                      </p>
                      <p className="text-[11px] text-amber-600">
                        {supplier.openPurchaseOrderCount} berjalan
                      </p>
                    </td>
                    <td>
                      <ActiveStatusBadge isActive={supplier.isActive} />
                    </td>
                    <td>
                      <SupplierRowActions supplier={supplier} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Pagination
          meta={result.meta}
          basePath="/dashboard/scm/suppliers"
          query={{ search: rawSearch, status }}
        />
      </Card>
    </div>
  );
}
