import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { ProductForm } from "@/components/products/product-form";
import { buttonClasses } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";

export const metadata = {
  title: "Tambah Produk",
};

export default function NewProductPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Master data"
        title="Tambah produk"
        description="Lengkapi identitas, harga, dan informasi penyimpanan produk frozen food."
        action={
          <Link
            href="/dashboard/products"
            className={buttonClasses({ variant: "outline" })}
          >
            <ArrowLeft className="h-4 w-4" /> Kembali
          </Link>
        }
      />
      <ProductForm mode="create" />
    </div>
  );
}
