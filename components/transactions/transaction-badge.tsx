import { Badge } from "@/components/ui/badge";
import { TRANSACTION_CATEGORY_LABELS, TRANSACTION_TYPE_LABELS } from "@/lib/constants";
import type { TransactionCategory, TransactionType } from "@/types/domain";

export function TransactionTypeBadge({ type }: { type: TransactionType }) {
  return (
    <Badge tone={type === "income" ? "green" : "rose"}>
      {TRANSACTION_TYPE_LABELS[type]}
    </Badge>
  );
}

export function TransactionCategoryBadge({
  category,
}: {
  category: TransactionCategory;
}) {
  const tone =
    category === "sales"
      ? "brand"
      : category === "purchase"
        ? "sky"
        : category === "operational"
          ? "amber"
          : "slate";

  return <Badge tone={tone}>{TRANSACTION_CATEGORY_LABELS[category]}</Badge>;
}
