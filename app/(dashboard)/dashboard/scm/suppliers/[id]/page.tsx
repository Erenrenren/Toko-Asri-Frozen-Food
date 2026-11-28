import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { ActiveStatusBadge } from "@/components/scm/scm-badges";
import { SupplierForm } from "@/components/scm/supplier-form";
import { buttonClasses } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { listProductOptions } from "@/lib/services/product.service";
import { getSupplierById } from "@/lib/services/scm/supplier.service";

export const dynamic = "force-dynamic";

export default async function EditSupplierPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [supplier, products] = await Promise.all([
    getSupplierById(id),
    listProductOptions(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={`Supplier · ${supplier.code}`}
        title={supplier.name}
        description="Perbarui kontak, jadwal pengiriman, lead time, dan produk yang disuplai."
        action={
          <>
            <ActiveStatusBadge isActive={supplier.isActive} />
            <Link
              href="/dashboard/scm/suppliers"
              className={buttonClasses({ variant: "outline" })}
            >
              <ArrowLeft className="h-4 w-4" /> Kembali
            </Link>
          </>
        }
      />
      <SupplierForm mode="edit" supplier={supplier} products={products} />
    </div>
  );
}
