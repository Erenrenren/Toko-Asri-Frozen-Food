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

// ============================================================
// SCM (Tahap 2)
// ============================================================

export const SUPPLIER_DELIVERY_DAYS = [
  "senin",
  "selasa",
  "rabu",
  "kamis",
  "jumat",
  "sabtu",
  "minggu",
] as const;
export type SupplierDeliveryDay = (typeof SUPPLIER_DELIVERY_DAYS)[number];

export const PURCHASE_ORDER_STATUSES = [
  "draft",
  "ordered",
  "partially_received",
  "received",
  "cancelled",
] as const;
export type PurchaseOrderStatus = (typeof PURCHASE_ORDER_STATUSES)[number];

export const STOCK_MOVEMENT_TYPES = ["in", "out", "adjustment"] as const;
export type StockMovementType = (typeof STOCK_MOVEMENT_TYPES)[number];

export const STOCK_MOVEMENT_REASONS = [
  "purchase_receipt",
  "sale",
  "manual_in",
  "manual_out",
  "damage",
  "expired",
  "return",
  "initial_stock",
  "adjustment",
] as const;
export type StockMovementReason = (typeof STOCK_MOVEMENT_REASONS)[number];

export const BATCH_STATUSES = ["active", "depleted", "expired", "disposed"] as const;
export type BatchStatus = (typeof BATCH_STATUSES)[number];

export type StockLevelStatus = "out" | "low" | "healthy";

export interface SupplierProductDTO {
  productId: string;
  sku: string;
  name: string;
  unit: ProductUnit;
  supplierSku: string | null;
  lastPrice: number | null;
  isPreferred: boolean;
}

export interface SupplierDTO {
  id: string;
  code: string;
  name: string;
  contactName: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  paymentTermDays: number;
  leadTimeDays: number;
  deliveryDays: SupplierDeliveryDay[];
  minimumOrder: number;
  notes: string | null;
  isActive: boolean;
  suppliedProducts: SupplierProductDTO[];
  purchaseOrderCount: number;
  openPurchaseOrderCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseOrderItemDTO {
  id: string;
  productId: string;
  sku: string;
  name: string;
  unit: ProductUnit;
  shelfLifeDays: number | null;
  quantity: number;
  unitCost: number;
  subtotal: number;
  receivedQty: number;
  remainingQty: number;
}

export interface GoodsReceiptItemDTO {
  id: string;
  productId: string;
  sku: string;
  name: string;
  quantity: number;
  unitCost: number;
  subtotal: number;
  batchNumber: string | null;
  productionDate: string | null;
  expiryDate: string | null;
}

export interface GoodsReceiptDTO {
  id: string;
  number: string;
  purchaseOrderId: string;
  receivedAt: string;
  totalValue: number;
  notes: string | null;
  receivedBy: Pick<UserDTO, "id" | "name"> | null;
  items: GoodsReceiptItemDTO[];
}

export interface PurchaseOrderDTO {
  id: string;
  number: string;
  status: PurchaseOrderStatus;
  orderDate: string;
  expectedDate: string | null;
  receivedAt: string | null;
  subtotal: number;
  shippingCost: number;
  totalAmount: number;
  notes: string | null;
  supplier: {
    id: string;
    code: string;
    name: string;
    phone: string | null;
    leadTimeDays: number;
    isActive: boolean;
  };
  items: PurchaseOrderItemDTO[];
  receipts: GoodsReceiptDTO[];
  progress: {
    orderedQty: number;
    receivedQty: number;
    percent: number;
  };
  createdBy: Pick<UserDTO, "id" | "name"> | null;
  createdAt: string;
  updatedAt: string;
}

export interface BatchDTO {
  id: string;
  batchNumber: string;
  productId: string;
  sku: string;
  productName: string;
  unit: ProductUnit;
  supplierId: string | null;
  supplierName: string | null;
  goodsReceiptId: string | null;
  goodsReceiptNumber: string | null;
  productionDate: string | null;
  expiryDate: string | null;
  receivedQty: number;
  remainingQty: number;
  unitCost: number;
  status: BatchStatus;
  daysToExpiry: number | null;
  createdAt: string;
}

export interface StockLevelDTO {
  productId: string;
  sku: string;
  name: string;
  category: ProductCategory;
  unit: ProductUnit;
  costPrice: number;
  stockQty: number;
  minStockQty: number;
  status: StockLevelStatus;
  stockValue: number;
  activeBatches: number;
  nearestExpiry: string | null;
  updatedAt: string;
}

export interface StockMovementDTO {
  id: string;
  reference: string;
  productId: string;
  sku: string;
  productName: string;
  unit: ProductUnit;
  type: StockMovementType;
  reason: StockMovementReason;
  quantity: number;
  stockBefore: number;
  stockAfter: number;
  unitCost: number | null;
  batchId: string | null;
  batchNumber: string | null;
  purchaseOrderId: string | null;
  goodsReceiptId: string | null;
  note: string | null;
  occurredAt: string;
  createdBy: Pick<UserDTO, "id" | "name"> | null;
  createdAt: string;
}

export interface ScmOverview {
  metrics: {
    suppliersTotal: number;
    suppliersActive: number;
    openPurchaseOrders: number;
    purchaseValueThisMonth: number;
    lowStockProducts: number;
    outOfStockProducts: number;
    expiringBatches: number;
    expiredBatches: number;
    totalStockValue: number;
  };
  lowStock: StockLevelDTO[];
  expiring: BatchDTO[];
  recentPurchaseOrders: PurchaseOrderDTO[];
  recentMovements: StockMovementDTO[];
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

// ============================================================
// CRM & Pemesanan (Tahap 3)
// ============================================================

export const CUSTOMER_TYPES = ["rumah_tangga", "reseller", "rutin"] as const;
export type CustomerType = (typeof CUSTOMER_TYPES)[number];

export const ORDER_STATUSES = [
  "pending_payment",
  "paid",
  "processing",
  "completed",
  "cancelled",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const INTERACTION_TYPES = [
  "complaint",
  "follow_up",
  "inquiry",
  "feedback",
  "other",
] as const;
export type InteractionType = (typeof INTERACTION_TYPES)[number];

export const INTERACTION_STATUSES = ["open", "in_progress", "resolved"] as const;
export type InteractionStatus = (typeof INTERACTION_STATUSES)[number];

export interface CustomerAddressDTO {
  id: string;
  label: string;
  recipientName: string;
  phone: string;
  addressLine: string;
  district: string | null;
  city: string;
  postalCode: string | null;
  notes: string | null;
  isPrimary: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerStatsDTO {
  totalOrders: number;
  completedOrders: number;
  totalSpent: number; // Rupiah, dari pesanan paid/processing/completed
  lastOrderAt: string | null;
}

export interface CustomerDTO {
  id: string; // User.id
  profileId: string | null; // null bila profil CRM belum dibuat
  name: string;
  email: string;
  phone: string | null;
  isActive: boolean;
  customerType: CustomerType;
  preferenceNotes: string | null;
  primaryAddress: CustomerAddressDTO | null;
  addresses: CustomerAddressDTO[];
  stats: CustomerStatsDTO;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItemDTO {
  id: string;
  productId: string;
  sku: string;
  name: string;
  quantity: number;
  unitPrice: number;
  unitCost: number;
  subtotal: number;
}

export interface OrderStatusHistoryDTO {
  id: string;
  fromStatus: OrderStatus | null;
  toStatus: OrderStatus;
  note: string | null;
  changedBy: Pick<UserDTO, "id" | "name"> | null;
  createdAt: string;
}

export interface OrderDTO {
  id: string;
  number: string;
  status: OrderStatus;
  subtotal: number;
  shippingCost: number;
  discountAmount: number;
  totalAmount: number;
  shippingName: string | null;
  shippingPhone: string | null;
  shippingAddress: string | null;
  notes: string | null;
  cancelReason: string | null;
  placedAt: string;
  paidAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  customer: Pick<UserDTO, "id" | "name"> & { email: string; phone: string | null };
  items: OrderItemDTO[];
  history: OrderStatusHistoryDTO[];
  createdBy: Pick<UserDTO, "id" | "name"> | null;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerInteractionDTO {
  id: string;
  type: InteractionType;
  status: InteractionStatus;
  subject: string;
  notes: string | null;
  followUpAt: string | null;
  resolvedAt: string | null;
  customer: Pick<UserDTO, "id" | "name">;
  order: { id: string; number: string } | null;
  staff: Pick<UserDTO, "id" | "name">;
  createdAt: string;
  updatedAt: string;
}
