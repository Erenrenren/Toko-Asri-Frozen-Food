import type {
  BatchStatus,
  CustomerType,
  InteractionStatus,
  InteractionType,
  OrderStatus,
  ProductCategory,
  ProductUnit,
  PurchaseOrderStatus,
  Role,
  StockLevelStatus,
  StockMovementReason,
  StockMovementType,
  SupplierDeliveryDay,
  TransactionCategory,
  TransactionType,
} from "@/types/domain";

export {
  BATCH_STATUSES,
  CUSTOMER_TYPES,
  INTERACTION_STATUSES,
  INTERACTION_TYPES,
  ORDER_STATUSES,
  PRODUCT_CATEGORIES,
  PRODUCT_UNITS,
  PURCHASE_ORDER_STATUSES,
  ROLES,
  STOCK_MOVEMENT_REASONS,
  STOCK_MOVEMENT_TYPES,
  SUPPLIER_DELIVERY_DAYS,
  TRANSACTION_CATEGORIES,
  TRANSACTION_TYPES,
} from "@/types/domain";


export const APP_NAME = "Toko Asri Frozen Food";
export const APP_TAGLINE = "Frozen food segar, usaha beku yang tetap terkendali.";

export const SESSION_COOKIE = "tasri_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 hari

export const DEFAULT_PAGE_SIZE = 10;
export const MAX_PAGE_SIZE = 100;

export const ROLE_LABELS: Record<Role, string> = {
  admin: "Admin / Pemilik",
  staff: "Staff Operasional",
  customer: "Pelanggan",
};

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  admin: "Akses penuh ke seluruh modul dan pengelolaan akun.",
  staff: "Operasional gudang, katalog, dan pencatatan transaksi.",
  customer: "Katalog produk dan riwayat pesanan pelanggan.",
};

export const PRODUCT_CATEGORY_LABELS: Record<ProductCategory, string> = {
  nugget: "Nugget",
  sosis: "Sosis",
  dimsum: "Dimsum",
  ikan: "Ikan",
  daging: "Daging",
  kentang: "Kentang",
  lainnya: "Lainnya",
};

export const PRODUCT_UNIT_LABELS: Record<ProductUnit, string> = {
  pcs: "Pcs",
  pack: "Pack",
  karton: "Karton",
  kg: "Kg",
};

export const TRANSACTION_TYPE_LABELS: Record<TransactionType, string> = {
  income: "Pemasukan",
  expense: "Pengeluaran",
};

export const TRANSACTION_CATEGORY_LABELS: Record<TransactionCategory, string> = {
  sales: "Penjualan",
  purchase: "Pembelian / Restock",
  operational: "Operasional",
  other: "Lainnya",
};

export const STORAGE_TEMPERATURE_PRESETS = [-25, -20, -18, -10, 0, 4] as const;

// --- SCM (Tahap 2) -------------------------------------------------

export const SUPPLIER_DELIVERY_DAY_LABELS: Record<SupplierDeliveryDay, string> = {
  senin: "Senin",
  selasa: "Selasa",
  rabu: "Rabu",
  kamis: "Kamis",
  jumat: "Jumat",
  sabtu: "Sabtu",
  minggu: "Minggu",
};

export const PURCHASE_ORDER_STATUS_LABELS: Record<PurchaseOrderStatus, string> = {
  draft: "Draft",
  ordered: "Dikirim ke supplier",
  partially_received: "Diterima sebagian",
  received: "Diterima lengkap",
  cancelled: "Dibatalkan",
};

export const STOCK_MOVEMENT_TYPE_LABELS: Record<StockMovementType, string> = {
  in: "Barang masuk",
  out: "Barang keluar",
  adjustment: "Penyesuaian",
};

export const STOCK_MOVEMENT_REASON_LABELS: Record<StockMovementReason, string> = {
  purchase_receipt: "Penerimaan PO",
  sale: "Penjualan",
  manual_in: "Stok masuk manual",
  manual_out: "Stok keluar manual",
  damage: "Barang rusak",
  expired: "Kedaluwarsa",
  return: "Retur",
  initial_stock: "Stok awal",
  adjustment: "Stok opname",
};

export const BATCH_STATUS_LABELS: Record<BatchStatus, string> = {
  active: "Aktif",
  depleted: "Habis",
  expired: "Kedaluwarsa",
  disposed: "Dimusnahkan",
};

export const STOCK_LEVEL_STATUS_LABELS: Record<StockLevelStatus, string> = {
  out: "Stok habis",
  low: "Stok menipis",
  healthy: "Aman",
};

export const SCM_NAV_ITEMS = [
  { label: "Ringkasan", href: "/dashboard/scm", exact: true },
  { label: "Supplier", href: "/dashboard/scm/suppliers", exact: false },
  { label: "Purchase Order", href: "/dashboard/scm/purchase-orders", exact: false },
  { label: "Stok", href: "/dashboard/scm/stock", exact: false },
  { label: "Batch & Expiry", href: "/dashboard/scm/batches", exact: false },
  { label: "Mutasi Stok", href: "/dashboard/scm/stock-movements", exact: false },
] as const;

export const CUSTOMER_TYPE_LABELS: Record<CustomerType, string> = {
  rumah_tangga: "Rumah tangga",
  reseller: "Reseller",
  rutin: "Pelanggan rutin",
};

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending_payment: "Menunggu pembayaran",
  paid: "Sudah dibayar",
  processing: "Diproses",
  completed: "Selesai",
  cancelled: "Dibatalkan",
};

/** Transisi status pesanan yang diizinkan. Status akhir tidak punya transisi lanjutan. */
export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  pending_payment: ["paid", "cancelled"],
  paid: ["processing", "cancelled"],
  processing: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};

/** Status yang dihitung sebagai belanja sah (dipakai total belanja & segmentasi). */
export const ORDER_REVENUE_STATUSES: readonly OrderStatus[] = [
  "paid",
  "processing",
  "completed",
];

export const INTERACTION_TYPE_LABELS: Record<InteractionType, string> = {
  complaint: "Keluhan",
  follow_up: "Tindak lanjut",
  inquiry: "Pertanyaan",
  feedback: "Masukan",
  other: "Lainnya",
};

export const INTERACTION_STATUS_LABELS: Record<InteractionStatus, string> = {
  open: "Terbuka",
  in_progress: "Sedang ditangani",
  resolved: "Selesai",
};

export const NAV_ITEMS = [
  {
    label: "Dashboard",
    href: "/dashboard",
    roles: ["admin", "staff"] as Role[],
    icon: "layout-dashboard",
  },
  {
    label: "Produk",
    href: "/dashboard/products",
    roles: ["admin", "staff"] as Role[],
    icon: "package",
  },
  {
    label: "Transaksi",
    href: "/dashboard/transactions",
    roles: ["admin", "staff"] as Role[],
    icon: "receipt",
  },
  {
    label: "SCM",
    href: "/dashboard/scm",
    roles: ["admin", "staff"] as Role[],
    icon: "truck",
  },
  {
    label: "CRM",
    href: "/dashboard/crm",
    roles: ["admin", "staff"] as Role[],
    icon: "users",
  },
  {
    label: "Pembayaran",
    href: "/dashboard/payments",
    roles: ["admin", "staff"] as Role[],
    icon: "credit-card",
  },
  {
    label: "Pengguna",
    href: "/dashboard/users",
    roles: ["admin"] as Role[],
    icon: "shield",
  },
] as const;
