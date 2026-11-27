import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ProductForm } from "@/components/products/product-form";
import { buttonClasses } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { ApiError } from "@/lib/api/errors";
import { getProductById } from "@/lib/services/product.service";
import type { ProductDTO } from "@/types/domain";

export const metadata: Metadata = {
  title: "Edit Produk",
};

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let product: ProductDTO;
  try {
    product = await getProductById(id);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }
    throw error;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Master data"
        title={`Edit ${product.name}`}
        description={`SKU ${product.sku} · terakhir diperbarui ${new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeZone: "Asia/Jakarta" }).format(new Date(product.updatedAt))}`}
        action={
          <Link
            href="/dashboard/products"
            className={buttonClasses({ variant: "outline" })}
          >
            <ArrowLeft className="h-4 w-4" /> Kembali
          </Link>
        }
      />
      <ProductForm mode="edit" product={product} />
    </div>
  );
}
