import { Badge } from "@/components/ui/badge";
import {
  BATCH_STATUS_LABELS,
  PURCHASE_ORDER_STATUS_LABELS,
  STOCK_LEVEL_STATUS_LABELS,
  STOCK_MOVEMENT_TYPE_LABELS,
} from "@/lib/constants";
import type {
  BatchStatus,
  PurchaseOrderStatus,
  StockLevelStatus,
  StockMovementType,
} from "@/types/domain";

const poTones: Record<
  PurchaseOrderStatus,
  "slate" | "sky" | "amber" | "green" | "rose"
> = {
  draft: "slate",
  ordered: "sky",
  partially_received: "amber",
  received: "green",
  cancelled: "rose",
};

const stockTones: Record<StockLevelStatus, "rose" | "amber" | "green"> = {
  out: "rose",
  low: "amber",
  healthy: "green",
};

const batchTones: Record<BatchStatus, "green" | "slate" | "rose" | "violet"> = {
  active: "green",
  depleted: "slate",
  expired: "rose",
  disposed: "violet",
};

const movementTones: Record<StockMovementType, "green" | "sky" | "violet"> = {
  in: "green",
  out: "sky",
  adjustment: "violet",
};

export function PurchaseOrderStatusBadge({
  status,
}: {
  status: PurchaseOrderStatus;
}) {
  return <Badge tone={poTones[status]}>{PURCHASE_ORDER_STATUS_LABELS[status]}</Badge>;
}

export function StockLevelBadge({ status }: { status: StockLevelStatus }) {
  return (
    <Badge tone={stockTones[status]}>{STOCK_LEVEL_STATUS_LABELS[status]}</Badge>
  );
}

export function BatchStatusBadge({ status }: { status: BatchStatus }) {
  return <Badge tone={batchTones[status]}>{BATCH_STATUS_LABELS[status]}</Badge>;
}

export function MovementTypeBadge({ type }: { type: StockMovementType }) {
  return (
    <Badge tone={movementTones[type]}>{STOCK_MOVEMENT_TYPE_LABELS[type]}</Badge>
  );
}

export function ActiveStatusBadge({ isActive }: { isActive: boolean }) {
  return isActive ? (
    <Badge tone="green">Aktif</Badge>
  ) : (
    <Badge tone="slate">Nonaktif</Badge>
  );
}
