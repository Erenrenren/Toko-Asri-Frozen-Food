import { prisma } from "@/lib/db/prisma";
import { formatDateInput } from "@/lib/format";
import {
  listRecentTransactions,
  transactionInclude,
} from "@/lib/services/transaction.service";
import { PRODUCT_CATEGORIES } from "@/types/domain";
import type { DashboardSummary, ProductCategory, ProductUnit } from "@/types/domain";

function getJakartaMonthRange(now = new Date()) {
  const [year, month] = formatDateInput(now).split("-").map(Number);
  const monthStart = new Date(
    `${year}-${String(month).padStart(2, "0")}-01T00:00:00+07:00`,
  );
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  const monthEnd = new Date(
    `${nextYear}-${String(nextMonth).padStart(2, "0")}-01T00:00:00+07:00`,
  );

  const label = new Intl.DateTimeFormat("id-ID", {
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(monthStart);

  return { monthStart, monthEnd, label };
}

function getLastSevenDays(now = new Date()) {
  const todayKey = formatDateInput(now);
  const todayMidnight = new Date(`${todayKey}T00:00:00+07:00`);
  const keys: string[] = [];

  for (let index = 6; index >= 0; index -= 1) {
    const date = new Date(todayMidnight.getTime() - index * 86_400_000);
    keys.push(formatDateInput(date));
  }

  const start = new Date(`${keys[0]}T00:00:00+07:00`);
  return { keys, start };
}

function dayLabel(key: string) {
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "short",
    day: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(new Date(`${key}T12:00:00+07:00`));
}

export async function getDashboardSummary(
  now = new Date(),
): Promise<DashboardSummary> {
  const { monthStart, monthEnd, label } = getJakartaMonthRange(now);
  const { keys: trendKeys, start: trendStart } = getLastSevenDays(now);

  const [
    monthTransactions,
    trendTransactions,
    totalProducts,
    activeProducts,
    allActiveProducts,
    totalUsers,
    recentTransactions,
  ] = await Promise.all([
    prisma.financialTransaction.findMany({
      where: {
        occurredAt: { gte: monthStart, lt: monthEnd },
        status: "posted",
      },
      include: transactionInclude,
    }),
    prisma.financialTransaction.findMany({
      where: {
        occurredAt: { gte: trendStart },
        status: "posted",
        type: "income",
        category: "sales",
      },
      select: { occurredAt: true, amount: true },
    }),
    prisma.product.count(),
    prisma.product.count({ where: { isActive: true } }),
    prisma.product.findMany({
      where: { isActive: true },
      select: {
        id: true,
        sku: true,
        name: true,
        category: true,
        stockQty: true,
        minStockQty: true,
        unit: true,
      },
    }),
    prisma.user.count(),
    listRecentTransactions(6),
  ]);

  const sales = monthTransactions.filter(
    (transaction) =>
      transaction.type === "income" && transaction.category === "sales",
  );
  const otherIncome = monthTransactions
    .filter(
      (transaction) =>
        transaction.type === "income" && transaction.category !== "sales",
    )
    .reduce((total, transaction) => total + transaction.amount, 0);

  const revenue = sales.reduce(
    (total, transaction) => total + transaction.amount,
    0,
  );
  const cogs = sales.reduce(
    (total, transaction) =>
      total + (transaction.quantity ?? 0) * (transaction.unitCost ?? 0),
    0,
  );
  const expenses = monthTransactions
    .filter((transaction) => transaction.type === "expense")
    .reduce((total, transaction) => total + transaction.amount, 0);

  const grossProfit = revenue - cogs;
  const netProfit = grossProfit + otherIncome - expenses;
  const grossMargin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;

  const categoryMap = new Map<
    ProductCategory,
    { category: ProductCategory; products: number; stockQty: number }
  >(
    PRODUCT_CATEGORIES.map((category) => [
      category,
      { category, products: 0, stockQty: 0 },
    ]),
  );

  for (const product of allActiveProducts) {
    const category = product.category as ProductCategory;
    const entry = categoryMap.get(category);
    if (entry) {
      entry.products += 1;
      entry.stockQty += product.stockQty;
    }
  }

  const topProductMap = new Map<
    string,
    { productId: string; name: string; sku: string; quantity: number; revenue: number }
  >();

  for (const transaction of sales) {
    if (!transaction.productId || !transaction.product) continue;
    const entry = topProductMap.get(transaction.productId) ?? {
      productId: transaction.productId,
      name: transaction.product.name,
      sku: transaction.product.sku,
      quantity: 0,
      revenue: 0,
    };
    entry.quantity += transaction.quantity ?? 0;
    entry.revenue += transaction.amount;
    topProductMap.set(transaction.productId, entry);
  }

  const trendMap = new Map(
    trendKeys.map((key) => [
      key,
      {
        date: key,
        label: dayLabel(key),
        revenue: 0,
        transactions: 0,
      },
    ]),
  );

  for (const transaction of trendTransactions) {
    const key = formatDateInput(transaction.occurredAt);
    const entry = trendMap.get(key);
    if (entry) {
      entry.revenue += transaction.amount;
      entry.transactions += 1;
    }
  }

  const lowStock = allActiveProducts
    .filter((product) => product.stockQty <= product.minStockQty)
    .sort(
      (a, b) =>
        a.stockQty - a.minStockQty - (b.stockQty - b.minStockQty),
    )
    .slice(0, 6)
    .map((product) => ({
      id: product.id,
      sku: product.sku,
      name: product.name,
      stockQty: product.stockQty,
      minStockQty: product.minStockQty,
      unit: product.unit as ProductUnit,
    }));

  return {
    period: {
      label,
      start: monthStart.toISOString(),
      end: monthEnd.toISOString(),
    },
    metrics: {
      revenue,
      cogs,
      grossProfit,
      expenses,
      netProfit,
      grossMargin: Math.round(grossMargin * 10) / 10,
      totalProducts,
      activeProducts,
      lowStockProducts: allActiveProducts.filter(
        (product) => product.stockQty <= product.minStockQty,
      ).length,
      totalUsers,
      transactionCount: monthTransactions.length,
    },
    salesTrend: Array.from(trendMap.values()),
    categoryBreakdown: Array.from(categoryMap.values()),
    topProducts: Array.from(topProductMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5),
    recentTransactions,
    lowStockList: lowStock,
  };
}
