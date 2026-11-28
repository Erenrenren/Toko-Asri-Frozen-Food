import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { SupplierForm } from "@/components/scm/supplier-form";
import { buttonClasses } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { listProductOptions } from "@/lib/services/product.service";

export const dynamic = "force-dynamic";
export const metadata = { title: "Tambah Supplier" };

export default async function NewSupplierPage() {
  const products = await listProductOptions();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Master data SCM"
        title="Tambah supplier"
        description="Hubungkan supplier dengan produk yang dipasok agar purchase order dapat dibuat lebih cepat."
        action={
          <Link
            href="/dashboard/scm/suppliers"
            className={buttonClasses({ variant: "outline" })}
          >
            <ArrowLeft className="h-4 w-4" /> Kembali
          </Link>
        }
      />
      <SupplierForm mode="create" products={products} />
    </div>
  );
}
