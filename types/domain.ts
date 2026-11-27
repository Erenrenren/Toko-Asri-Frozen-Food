/**
 * Tipe domain bersama (dipakai server & client).
 * Sengaja tidak mengimpor tipe Prisma agar aman dipakai di komponen client.
 */

export const ROLES = ["admin", "staff", "customer"] as const;
export type Role = (typeof ROLES)[number];

export const PRODUCT_CATEGORIES = [
  "nugget",
  "sosis",
  "dimsum",
  "ikan",
  "daging",
  "kentang",
  "lainnya",
] as const;
export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

export const PRODUCT_UNITS = ["pcs", "pack", "karton", "kg"] as const;
export type ProductUnit = (typeof PRODUCT_UNITS)[number];

export const TRANSACTION_TYPES = ["income", "expense"] as const;
export type TransactionType = (typeof TRANSACTION_TYPES)[number];

export const TRANSACTION_CATEGORIES = [
  "sales",
  "purchase",
  "operational",
  "other",
] as const;
export type TransactionCategory = (typeof TRANSACTION_CATEGORIES)[number];

export const TRANSACTION_SOURCES = [
  "manual",
  "pos",
  "scm",
  "payment",
] as const;
export type TransactionSource = (typeof TRANSACTION_SOURCES)[number];

export const TRANSACTION_STATUSES = ["posted", "void"] as const;
export type TransactionStatus = (typeof TRANSACTION_STATUSES)[number];

export interface UserDTO {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: Role;
  isActive: boolean;
  createdAt: string;
}

export interface ProductDTO {
  id: string;
  sku: string;
  name: string;
  category: ProductCategory;
  description: string | null;
  storageTemperature: number | null;
  shelfLifeDays: number | null;
  costPrice: number;
  sellPrice: number;
  unit: ProductUnit;
  packSize: number | null;
  stockQty: number;
  minStockQty: number;
  isActive: boolean;
  margin: number;
  createdAt: string;
  updatedAt: string;
}

export interface TransactionDTO {
  id: string;
  code: string;
  type: TransactionType;
  category: TransactionCategory;
  amount: number;
  quantity: number | null;
  unitPrice: number | null;
  unitCost: number | null;
  description: string;
  occurredAt: string;
  source: TransactionSource;
  status: TransactionStatus;
  externalRef: string | null;
  productId: string | null;
  product: Pick<ProductDTO, "id" | "sku" | "name" | "unit"> | null;
  createdBy: Pick<UserDTO, "id" | "name" | "role"> | null;
  createdAt: string;
}

export interface DashboardSummary {
  period: {
    label: string;
    start: string;
    end: string;
  };
  metrics: {
    revenue: number;
    cogs: number;
    grossProfit: number;
    expenses: number;
    netProfit: number;
    grossMargin: number;
    totalProducts: number;
    activeProducts: number;
    lowStockProducts: number;
    totalUsers: number;
    transactionCount: number;
  };
  salesTrend: Array<{
    date: string;
    label: string;
    revenue: number;
    transactions: number;
  }>;
  categoryBreakdown: Array<{
    category: ProductCategory;
    products: number;
    stockQty: number;
  }>;
  topProducts: Array<{
    productId: string;
    name: string;
    sku: string;
    quantity: number;
    revenue: number;
  }>;
  recentTransactions: TransactionDTO[];
  lowStockList: Array<{
    id: string;
    sku: string;
    name: string;
    stockQty: number;
    minStockQty: number;
    unit: ProductUnit;
  }>;
}
