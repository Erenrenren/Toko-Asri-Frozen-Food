import type {
  ProductCategory,
  ProductUnit,
  Role,
  TransactionCategory,
  TransactionType,
} from "@/types/domain";

export {
  PRODUCT_CATEGORIES,
  PRODUCT_UNITS,
  ROLES,
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
