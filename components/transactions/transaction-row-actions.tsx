"use client";

import { Ban, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import type { ApiResponse } from "@/types/api";
import type { TransactionDTO } from "@/types/domain";

interface TransactionRowActionsProps {
  transaction: Pick<TransactionDTO, "id" | "code" | "status">;
  canVoid: boolean;
}

export function TransactionRowActions({
  transaction,
  canVoid,
}: TransactionRowActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  if (!canVoid || transaction.status === "void") {
    return <span className="text-xs text-slate-300">—</span>;
  }

  async function handleVoid() {
    if (
      !window.confirm(
        `Batalkan transaksi ${transaction.code}? Transaksi yang dibatalkan tidak dihitung dalam laporan.`,
      )
    ) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/transactions/${transaction.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "void" }),
      });
      const payload = (await response.json()) as ApiResponse<TransactionDTO>;

      if (!response.ok || !payload.success) {
        window.alert(
          payload.success ? "Gagal membatalkan transaksi." : payload.error.message,
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
    <Button
      variant="ghost"
      size="sm"
      onClick={handleVoid}
      disabled={loading}
      className="px-2 text-rose-500 hover:bg-rose-50 hover:text-rose-700"
      title="Batalkan transaksi"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Ban className="h-4 w-4" />
      )}
    </Button>
  );
}
