import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { PurchaseOrderForm } from "@/components/scm/purchase-order-form";
import { buttonClasses } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { listProductOptions } from "@/lib/services/product.service";
import { listSupplierOptions } from "@/lib/services/scm/supplier.service";

export const dynamic = "force-dynamic";
export const metadata = { title: "Buat Purchase Order" };

export default async function NewPurchaseOrderPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const defaultSupplierId =
    typeof params.supplier === "string" ? params.supplier : undefined;

  const [suppliers, products] = await Promise.all([
    listSupplierOptions(),
    listProductOptions(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Pengadaan"
        title="Buat purchase order"
        description="Pilih supplier, tentukan item dan jumlah restock, lalu simpan sebagai draft atau langsung kirim."
        action={
          <Link
            href="/dashboard/scm/purchase-orders"
            className={buttonClasses({ variant: "outline" })}
          >
            <ArrowLeft className="h-4 w-4" /> Kembali
          </Link>
        }
      />

      {suppliers.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-sm font-semibold text-slate-800">
            Belum ada supplier aktif
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Tambahkan supplier terlebih dahulu sebelum membuat purchase order.
          </p>
          <Link
            href="/dashboard/scm/suppliers/new"
            className={buttonClasses({ className: "mt-4" })}
          >
            Tambah supplier
          </Link>
        </div>
      ) : (
        <PurchaseOrderForm
          suppliers={suppliers}
          products={products}
          defaultSupplierId={defaultSupplierId}
        />
      )}
    </div>
  );
}
