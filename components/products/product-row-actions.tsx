"use client";

import { Loader2, Pencil, Power } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { buttonClasses } from "@/components/ui/button";
import type { ApiResponse } from "@/types/api";
import type { ProductDTO } from "@/types/domain";

interface ProductRowActionsProps {
  product: Pick<ProductDTO, "id" | "name" | "isActive">;
}

export function ProductRowActions({ product }: ProductRowActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function toggleStatus() {
    const actionLabel = product.isActive ? "menonaktifkan" : "mengaktifkan";
    if (
      product.isActive &&
      !window.confirm(
        `Nonaktifkan produk "${product.name}"? Produk tidak akan tampil di katalog pelanggan.`,
      )
    ) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !product.isActive }),
      });
      const payload = (await response.json()) as ApiResponse<ProductDTO>;

      if (!response.ok || !payload.success) {
        window.alert(
          payload.success
            ? `Gagal ${actionLabel} produk.`
            : payload.error.message,
        );
        return;
      }

      router.refresh();
    } catch {
      window.alert("Tidak dapat menghubungi server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-end gap-1">
      <Link
        href={`/dashboard/products/${product.id}`}
        className={buttonClasses({
          variant: "ghost",
          size: "sm",
          className: "px-2 text-slate-500",
        })}
        title="Edit produk"
      >
        <Pencil className="h-4 w-4" />
      </Link>
      <button
        type="button"
        onClick={toggleStatus}
        disabled={loading}
        title={product.isActive ? "Nonaktifkan produk" : "Aktifkan produk"}
        className={buttonClasses({
          variant: "ghost",
          size: "sm",
          className: product.isActive
            ? "px-2 text-rose-500 hover:bg-rose-50 hover:text-rose-700"
            : "px-2 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700",
        })}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Power className="h-4 w-4" />
        )}
      </button>
    </div>
  );
}
