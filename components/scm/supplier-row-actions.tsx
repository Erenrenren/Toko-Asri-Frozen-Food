"use client";

import { Loader2, Pencil, Power } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { buttonClasses } from "@/components/ui/button";
import type { ApiResponse } from "@/types/api";
import type { SupplierDTO } from "@/types/domain";

interface SupplierRowActionsProps {
  supplier: Pick<SupplierDTO, "id" | "name" | "isActive">;
}

export function SupplierRowActions({ supplier }: SupplierRowActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function toggleStatus() {
    if (
      supplier.isActive &&
      !window.confirm(
        `Nonaktifkan supplier "${supplier.name}"? Supplier nonaktif tidak muncul di form purchase order.`,
      )
    ) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/scm/suppliers/${supplier.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !supplier.isActive }),
      });
      const payload = (await response.json()) as ApiResponse<SupplierDTO>;

      if (!response.ok || !payload.success) {
        window.alert(
          payload.success ? "Gagal mengubah status supplier." : payload.error.message,
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
        href={`/dashboard/scm/suppliers/${supplier.id}`}
        className={buttonClasses({
          variant: "ghost",
          size: "sm",
          className: "px-2 text-slate-500",
        })}
        title="Edit supplier"
      >
        <Pencil className="h-4 w-4" />
      </Link>
      <button
        type="button"
        onClick={toggleStatus}
        disabled={loading}
        title={supplier.isActive ? "Nonaktifkan supplier" : "Aktifkan supplier"}
        className={buttonClasses({
          variant: "ghost",
          size: "sm",
          className: supplier.isActive
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
