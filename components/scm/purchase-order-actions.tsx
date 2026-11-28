"use client";

import { Ban, Loader2, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import type { ApiResponse } from "@/types/api";
import type { PurchaseOrderDTO } from "@/types/domain";

interface PurchaseOrderActionsProps {
  order: Pick<PurchaseOrderDTO, "id" | "number" | "status">;
  canCancel: boolean;
}

export function PurchaseOrderActions({
  order,
  canCancel,
}: PurchaseOrderActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<"submit" | "cancel" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function runAction(action: "submit" | "cancel") {
    if (
      action === "cancel" &&
      !window.confirm(`Batalkan purchase order ${order.number}?`)
    ) {
      return;
    }

    setError(null);
    setLoading(action);
    try {
      const response = await fetch(`/api/scm/purchase-orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const payload = (await response.json()) as ApiResponse<PurchaseOrderDTO>;

      if (!response.ok || !payload.success) {
        setError(
          payload.success
            ? "Gagal memproses purchase order."
            : payload.error.message,
        );
        return;
      }

      router.refresh();
    } catch {
      setError("Tidak dapat menghubungi server.");
    } finally {
      setLoading(null);
    }
  }

  if (order.status !== "draft" && order.status !== "ordered") {
    return null;
  }

  return (
    <div className="space-y-3">
      {error && <Alert tone="danger">{error}</Alert>}
      <div className="flex flex-wrap items-center gap-2">
        {order.status === "draft" && (
          <Button
            onClick={() => void runAction("submit")}
            disabled={loading !== null}
          >
            {loading === "submit" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Kirim ke supplier
          </Button>
        )}

        {canCancel && (
          <Button
            variant="outline"
            onClick={() => void runAction("cancel")}
            disabled={loading !== null}
            className="border-rose-200 text-rose-600 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700"
          >
            {loading === "cancel" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Ban className="h-4 w-4" />
            )}
            Batalkan PO
          </Button>
        )}
      </div>
    </div>
  );
}
