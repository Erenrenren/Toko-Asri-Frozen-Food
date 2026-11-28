import { prisma } from "@/lib/db/prisma";
import {
  listBatches,
  listRecentStockMovements,
  listStockLevels,
} from "@/lib/services/scm/stock.service";
import { listPurchaseOrders } from "@/lib/services/scm/purchase-order.service";
import { endOfMonth, startOfMonth } from "@/lib/services/scm/scm.utils";
import type { ScmOverview } from "@/types/domain";

export async function getScmOverview(): Promise<ScmOverview> {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const [
    suppliersTotal,
    suppliersActive,
    openPurchaseOrders,
    purchaseAggregate,
    stockLevels,
    expiring,
    expired,
    recentPurchaseOrders,
    recentMovements,
  ] = await Promise.all([
    prisma.supplier.count(),
    prisma.supplier.count({ where: { isActive: true } }),
    prisma.purchaseOrder.count({
      where: { status: { in: ["ordered", "partially_received"] } },
    }),
    prisma.financialTransaction.aggregate({
      where: {
        type: "expense",
        category: "purchase",
        status: "posted",
        occurredAt: { gte: monthStart, lte: monthEnd },
      },
      _sum: { amount: true },
    }),
    listStockLevels({
      page: 1,
      pageSize: 100,
      skip: 0,
      status: "all",
    }),
    listBatches({ status: "expiring", page: 1, pageSize: 5, skip: 0 }),
    listBatches({ status: "expired", page: 1, pageSize: 1, skip: 0 }),
    listPurchaseOrders({ page: 1, pageSize: 5, skip: 0 }),
    listRecentStockMovements(5),
  ]);

  const lowStockItems = stockLevels.items.filter(
    (item) => item.status === "low" || item.status === "out",
  );

  return {
    metrics: {
      suppliersTotal,
      suppliersActive,
      openPurchaseOrders,
      purchaseValueThisMonth: purchaseAggregate._sum.amount ?? 0,
      lowStockProducts: lowStockItems.length,
      outOfStockProducts: stockLevels.items.filter((item) => item.status === "out")
        .length,
      expiringBatches: expiring.meta.total,
      expiredBatches: expired.meta.total,
      totalStockValue: stockLevels.items.reduce(
        (sum, item) => sum + item.stockValue,
        0,
      ),
    },
    lowStock: lowStockItems.slice(0, 5),
    expiring: expiring.items,
    recentPurchaseOrders: recentPurchaseOrders.items,
    recentMovements,
  };
}
