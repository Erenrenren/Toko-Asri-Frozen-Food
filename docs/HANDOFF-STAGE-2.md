# HANDOFF NOTE — Orang 2 (SCM)

Dokumen ini merangkum kondisi akhir Tahap 1 agar Orang 2 dapat mulai Tahap 2 (SCM) tanpa mengubah fondasi yang sudah ada.

- **Branch:** `stage-1/foundation-auth-erp`
- **Basis:** `main`
- **Stack:** Next.js 15.5 (App Router), React 19, TypeScript strict, Prisma 6.19 + SQLite, Tailwind 3.4, Zod, jose, bcryptjs.
- **Status:** install, typecheck, build, seed, dan smoke test API lulus.

---

## 1. Daftar File Baru / Diubah

### 1.1 Konfigurasi root

| File | Status | Keterangan |
| --- | --- | --- |
| `package.json` | baru | Dependency, script dev/build/setup/seed/typecheck |
| `package-lock.json` | baru | Lockfile npm |
| `tsconfig.json` | baru | TypeScript strict + path alias `@/*` |
| `next.config.ts` | baru | Konfigurasi Next, external package Prisma/bcrypt |
| `tailwind.config.ts` | baru | Tema warna brand/navy/accent |
| `postcss.config.mjs` | baru | Tailwind + autoprefixer |
| `.env.example` | baru | Template environment |
| `.gitignore` | baru | Ignore `.env`, database, build, dependency |
| `middleware.ts` | baru | Proteksi route `/dashboard` dan `/portal` berbasis JWT + role |
| `README.md` | diubah | Dokumentasi utama proyek |
| `next-env.d.ts` | baru (generated) | Referensi tipe Next.js |

### 1.2 Database & seed

| File | Status | Keterangan |
| --- | --- | --- |
| `prisma/schema.prisma` | baru | Model `User`, `Product`, `FinancialTransaction` |
| `prisma/seed.ts` | baru | 3 akun demo, 8 produk, transaksi contoh |
| `prisma/dev.db` | lokal | SQLite (gitignored) |

### 1.3 Tipe & utilitas

| File | Keterangan |
| --- | --- |
| `types/domain.ts` | Konstanta + DTO domain (`Role`, `ProductDTO`, `TransactionDTO`, `DashboardSummary`) |
| `types/api.ts` | Envelope API, `PaginationMeta`, `ApiErrorCode` |
| `lib/constants.ts` | Label, navigasi, session cookie, page size, re-export konstanta domain |
| `lib/format.ts` | `cn`, format Rupiah/tanggal/nomor, `buildQueryString` |
| `lib/db/prisma.ts` | Prisma singleton |
| `lib/auth/jwt.ts` | Sign/verify JWT HS256 (edge-safe) |
| `lib/auth/password.ts` | Hash/verify bcrypt |
| `lib/auth/rbac.ts` | Helper role & redirect default |
| `lib/auth/session.ts` | Session cookie, `getCurrentUser`, `requireUser`, `requireRole` |
| `lib/api/errors.ts` | `ApiError` + helper 400/401/403/404/409/422 |
| `lib/api/response.ts` | `ok`, `created`, `fail`, `handleApiError`, `readJson` |
| `lib/api/auth.ts` | `requireApiUser([...roles])` |
| `lib/api/query.ts` | Parser pagination, string, tanggal |

### 1.4 Validator (Zod)

| File | Keterangan |
| --- | --- |
| `lib/validators/auth.ts` | Login, registrasi, email/password/phone |
| `lib/validators/product.ts` | Create/update produk |
| `lib/validators/transaction.ts` | Create transaksi + aturan income/expense |
| `lib/validators/user.ts` | Create/update user oleh admin |

### 1.5 Service layer

| File | Keterangan |
| --- | --- |
| `lib/services/user.service.ts` | Auth, registrasi customer, list/create/update user |
| `lib/services/product.service.ts` | CRUD produk (soft delete), opsi produk, katalog pelanggan |
| `lib/services/transaction.service.ts` | List/create/void transaksi, summary, recent |
| `lib/services/dashboard.service.ts` | Agregasi metrik bulan berjalan & tren 7 hari |

### 1.6 API Route Handlers

| File | Method | Akses |
| --- | --- | --- |
| `app/api/auth/register/route.ts` | POST | Publik |
| `app/api/auth/login/route.ts` | POST | Publik |
| `app/api/auth/logout/route.ts` | POST | Terautentikasi |
| `app/api/auth/me/route.ts` | GET | Terautentikasi |
| `app/api/products/route.ts` | GET, POST | admin, staff |
| `app/api/products/[id]/route.ts` | GET, PATCH, DELETE | admin, staff |
| `app/api/transactions/route.ts` | GET, POST | admin, staff |
| `app/api/transactions/[id]/route.ts` | GET, PATCH (void) | GET: admin/staff; PATCH: admin |
| `app/api/dashboard/summary/route.ts` | GET | admin, staff |
| `app/api/users/route.ts` | GET, POST | admin |
| `app/api/users/[id]/route.ts` | PATCH | admin |
| `app/api/health/route.ts` | GET | Publik |

### 1.7 Halaman & layout

| File | Keterangan |
| --- | --- |
| `app/layout.tsx` | Root layout + metadata |
| `app/globals.css` | Tailwind + design token/komponen |
| `app/page.tsx` | Landing page |
| `app/error.tsx` | Error boundary |
| `app/not-found.tsx` | Halaman 404 |
| `app/(auth)/layout.tsx` | Layout split-screen auth |
| `app/(auth)/login/page.tsx` | Halaman login |
| `app/(auth)/register/page.tsx` | Halaman registrasi |
| `app/(dashboard)/layout.tsx` | Guard admin/staff + shell |
| `app/(dashboard)/dashboard/page.tsx` | Dashboard ERP |
| `app/(dashboard)/dashboard/products/page.tsx` | List produk |
| `app/(dashboard)/dashboard/products/new/page.tsx` | Tambah produk |
| `app/(dashboard)/dashboard/products/[id]/page.tsx` | Edit produk |
| `app/(dashboard)/dashboard/transactions/page.tsx` | Jurnal kas |
| `app/(dashboard)/dashboard/transactions/new/page.tsx` | Catat transaksi |
| `app/(dashboard)/dashboard/users/page.tsx` | Pengelolaan akun (admin) |
| `app/(dashboard)/dashboard/scm/page.tsx` | Placeholder Tahap 2 |
| `app/(dashboard)/dashboard/crm/page.tsx` | Placeholder Tahap 3 |
| `app/(dashboard)/dashboard/payments/page.tsx` | Placeholder Tahap 4 |
| `app/portal/layout.tsx` | Guard customer + header |
| `app/portal/page.tsx` | Katalog pelanggan |

### 1.8 Komponen

| File | Keterangan |
| --- | --- |
| `components/brand/logo.tsx` | Logo Toko Asri |
| `components/layout/dashboard-shell.tsx` | Sidebar/topbar responsif + logout |
| `components/layout/portal-header.tsx` | Header portal pelanggan |
| `components/layout/logout-button.tsx` | Tombol logout client |
| `components/auth/login-form.tsx` | Form login + akun demo |
| `components/auth/register-form.tsx` | Form registrasi customer |
| `components/dashboard/sales-chart.tsx` | Bar chart tren penjualan (CSS) |
| `components/dashboard/module-placeholder.tsx` | Template placeholder SCM/CRM/Payment |
| `components/products/product-filters.tsx` | Filter produk (GET form) |
| `components/products/product-form.tsx` | Form create/edit produk |
| `components/products/product-row-actions.tsx` | Edit + toggle aktif |
| `components/transactions/transaction-badge.tsx` | Badge jenis/kategori |
| `components/transactions/transaction-filters.tsx` | Filter jurnal kas |
| `components/transactions/transaction-form.tsx` | Form transaksi + pratinjau margin |
| `components/transactions/transaction-row-actions.tsx` | Void transaksi (admin) |
| `components/users/create-user-panel.tsx` | Form buat akun (admin) |
| `components/users/user-role-editor.tsx` | Ubah role/status akun |
| `components/ui/*` | Button, Input, Select, Textarea, Card, Badge, Alert, EmptyState, StatCard, Pagination, PageHeader |

### 1.9 Dokumentasi

| File | Keterangan |
| --- | --- |
| `README.md` | Setup, akun demo, struktur, RBAC, roadmap |
| `docs/ARCHITECTURE.md` | Arsitektur, konvensi, keamanan, cara menambah modul |
| `docs/API_CONTRACT.md` | Kontrak endpoint, DTO, error, contoh curl |
| `docs/STAGE-1-CHECKLIST.md` | Checklist pengujian lengkap |
| `docs/HANDOFF-STAGE-2.md` | Dokumen ini |

---

## 2. Skema Data Aktual

### 2.1 `User`

```prisma
model User {
  id           String   @id @default(cuid())
  name         String
  email        String   @unique
  passwordHash String
  phone        String?
  role         String   @default("customer") // admin | staff | customer
  isActive     Boolean  @default(true)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  transactions FinancialTransaction[] @relation("CreatedTransactions")

  @@index([role])
  @@index([isActive])
  @@map("users")
}
```

### 2.2 `Product`

```prisma
model Product {
  id                 String   @id @default(cuid())
  sku                String   @unique
  name               String
  category           String   // nugget | sosis | dimsum | ikan | daging | kentang | lainnya
  description        String?
  storageTemperature Float?   // °C
  shelfLifeDays      Int?
  costPrice          Int      // HPP Rupiah
  sellPrice          Int      // harga jual Rupiah
  unit               String   @default("pack") // pcs | pack | karton | kg
  packSize           Int?
  stockQty           Int      @default(0)
  minStockQty        Int      @default(0)
  isActive           Boolean  @default(true)
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt

  transactions FinancialTransaction[]

  @@index([category])
  @@index([isActive])
  @@index([stockQty])
  @@map("products")
}
```

### 2.3 `FinancialTransaction`

```prisma
model FinancialTransaction {
  id          String   @id @default(cuid())
  code        String   @unique
  type        String   // income | expense
  category    String   // sales | purchase | operational | other
  amount      Int      // Rupiah
  quantity    Int?
  unitPrice   Int?
  unitCost    Int?     // snapshot HPP
  description String
  occurredAt  DateTime @default(now())
  source      String   @default("manual") // manual | pos | scm | payment
  status      String   @default("posted") // posted | void
  externalRef String?
  productId   String?
  createdById String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  product   Product? @relation(fields: [productId], references: [id], onDelete: SetNull)
  createdBy User     @relation("CreatedTransactions", fields: [createdById], references: [id], onDelete: Restrict)

  @@index([type, occurredAt])
  @@index([category, occurredAt])
  @@index([status])
  @@index([productId])
  @@index([createdById])
  @@map("financial_transactions")
}
```

### 2.4 Titik sambung untuk SCM

| Kebutuhan SCM | Sudah tersedia | Catatan |
| --- | --- | --- |
| Stok saat ini | `Product.stockQty` | Belum otomatis berkurang saat penjualan |
| Ambang restock | `Product.minStockQty` | Dipakai dashboard untuk low stock |
| Pembelian/restock | `FinancialTransaction` type `expense`, category `purchase` | Bisa dibuat dari service transaksi |
| Sumber integrasi | `source='scm'` | Reserved, divalidasi enum |
| Nomor PO/dokumen | `externalRef` | String maks 120 |
| Supplier / PO / mutasi stok | **Belum ada** | Tambah model baru, jangan hapus field lama |

---

## 3. Endpoint & State Utama

### 3.1 Endpoint

Semua response memakai envelope:

```json
{ "success": true, "data": ..., "meta"?: ..., "message"?: ... }
{ "success": false, "error": { "code": "...", "message": "...", "details"?: ... } }
```

| Endpoint | Status |
| --- | --- |
| `POST /api/auth/register` | ✅ |
| `POST /api/auth/login` | ✅ |
| `POST /api/auth/logout` | ✅ |
| `GET /api/auth/me` | ✅ |
| `GET/POST /api/products` | ✅ |
| `GET/PATCH/DELETE /api/products/:id` | ✅ |
| `GET/POST /api/transactions` | ✅ |
| `GET/PATCH /api/transactions/:id` | ✅ (PATCH void admin) |
| `GET /api/dashboard/summary` | ✅ |
| `GET/POST /api/users` | ✅ admin |
| `PATCH /api/users/:id` | ✅ admin |
| `GET /api/health` | ✅ |
| `/api/scm/**` | ❌ belum ada — milik Orang 2 |
| `/api/crm/**` | ❌ belum ada — milik Orang 3 |
| `/api/payments/**` | ❌ belum ada — milik Orang 4 |

### 3.2 State autentikasi

- Cookie: `tasri_session`
- Isi: JWT HS256 (`sub`, `name`, `email`, `role`, `iat`, `exp`)
- Umur: 7 hari
- Flags: `httpOnly`, `sameSite=lax`, `secure` saat production
- Middleware memverifikasi JWT untuk halaman `/dashboard/**` dan `/portal/**`.
- Layout/API memanggil database untuk memastikan user masih ada dan `isActive=true`.
- Tidak ada state management global (Redux/Zustand). Data server di-refresh dengan `router.refresh()` setelah mutasi.

### 3.3 State UI

- Form client memakai `useState` lokal.
- Tidak ada optimistic update kompleks; setelah sukses → `router.push`/`router.refresh`.
- Error API ditampilkan inline; error aksi tabel memakai `window.alert` (bisa ditingkatkan menjadi toast pada tahap berikutnya).

---

## 4. Variabel Environment

File `.env.example`:

```env
DATABASE_URL="file:./dev.db"
AUTH_SECRET="ganti-dengan-secret-acak-minimal-32-karakter"
NEXT_PUBLIC_APP_NAME="Toko Asri Frozen Food"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

| Variabel | Wajib | Keterangan |
| --- | --- | --- |
| `DATABASE_URL` | ✅ | SQLite lokal; ganti PostgreSQL untuk produksi |
| `AUTH_SECRET` | ✅ | Minimal 32 karakter; dipakai JWT |
| `NEXT_PUBLIC_APP_NAME` | opsional | Nama aplikasi |
| `NEXT_PUBLIC_APP_URL` | opsional | URL publik aplikasi |

> Jangan commit `.env`. File `.env` sudah masuk `.gitignore`.

---

## 5. Aturan Kontrak yang Tidak Boleh Diubah

1. Envelope response `{ success, data, meta?, message? }` dan `{ success, error }`.
2. Nama field DTO di `types/domain.ts`.
3. Arti `amount` = nominal bruto integer Rupiah.
4. Arti `type` = `income`/`expense`; `category` = `sales`/`purchase`/`operational`/`other`.
5. `status` = `posted`/`void`; transaksi `void` tidak dihitung laporan.
6. `source` = `manual`/`pos`/`scm`/`payment`.
7. `unitCost` pada transaksi adalah snapshot HPP, bukan referensi live.
8. Produk dihapus secara soft delete (`isActive=false`).
9. Role: `admin`, `staff`, `customer`; registrasi publik selalu `customer`.
10. Semua route baru wajib memakai `requireApiUser`, Zod, service layer, dan `handleApiError`.

---

## 6. Hal yang Belum Disentuh (Sengaja)

| Area | Status | Pemilik |
| --- | --- | --- |
| Supplier, purchase order, restock otomatis | Belum | Orang 2 |
| Mutasi stok masuk/keluar/opname | Belum | Orang 2 |
| Cold-chain monitoring / log suhu | Belum | Orang 2 |
| Loyalty, poin, tier | Belum | Orang 3 |
| Riwayat pelanggan lanjutan & segmentasi | Belum | Orang 3 |
| Keranjang/checkout pelanggan | Belum | Orang 3/4 |
| Payment gateway, invoice, webhook | Belum | Orang 4 |
| Rekonsiliasi & refund | Belum | Orang 4 |
| Pengurangan stok otomatis saat penjualan | Belum | Orang 2 |
| Rate limiting login, verifikasi email, reset password | Belum | Peningkatan lanjutan |
| Audit log & 2FA | Belum | Peningkatan lanjutan |
| Migrasi PostgreSQL & migration files | Belum | Persiapan deployment |
| Unit/integration test framework | Belum | Peningkatan lanjutan |

**Jangan mengubah** halaman placeholder SCM/CRM/Payment menjadi logika penuh tanpa mengganti judul/status tahap dan memperbarui dokumentasi.

---

## 7. Cara Orang 2 Mulai (SCM)

### Langkah teknis

```bash
git checkout stage-1/foundation-auth-erp
git pull
npm install
# pastikan .env ada
npm run setup
npm run dev
```

### Urutan implementasi yang disarankan

1. **Schema aditif** di `prisma/schema.prisma`:
   - `Supplier`
   - `PurchaseOrder` + `PurchaseOrderItem`
   - `StockMovement` (`in`, `out`, `adjustment`)
   - relasi opsional ke `Product` dan `User`
2. **Tipe** di `types/domain.ts`: `SupplierDTO`, `PurchaseOrderDTO`, `StockMovementDTO`.
3. **Validator** `lib/validators/scm.ts`.
4. **Service** `lib/services/scm/*.service.ts`.
5. **API** `app/api/scm/suppliers/route.ts`, `purchase-orders/route.ts`, `stock-movements/route.ts`.
6. **UI** ganti placeholder `app/(dashboard)/dashboard/scm/page.tsx`; komponen di `components/scm/`.
7. **Integrasi kas**:
   - Saat PO diterima/dibayar, buat `FinancialTransaction` lewat `createTransaction` atau service khusus.
   - Gunakan `source: "scm"` dan `externalRef` = nomor PO.
   - Jangan menulis langsung ke tabel dari komponen.
8. **Stok**:
   - Buat `StockMovement` sebagai sumber audit.
   - Update `Product.stockQty` dalam transaksi database yang sama.
   - Jangan mengubah penjualan Tahap 1 menjadi otomatis mengurangi stok tanpa membahas dampaknya ke laporan.
9. **Dokumentasi**: perbarui `docs/API_CONTRACT.md`, `docs/ARCHITECTURE.md`, dan README.
10. **Uji**: `npm run typecheck`, `npm run build`, smoke test endpoint baru.

### Contoh pemakaian guard API

```ts
import { requireApiUser } from "@/lib/api/auth";
import { handleApiError, ok } from "@/lib/api/response";

export async function GET() {
  try {
    await requireApiUser(["admin", "staff"]);
    // panggil service SCM
    return ok(data);
  } catch (error) {
    return handleApiError(error);
  }
}
```

### Contoh integrasi ke jurnal kas

```ts
await createTransaction(
  {
    type: "expense",
    category: "purchase",
    description: `Pembelian restock PO ${po.number}`,
    amount: po.totalAmount,
    source: "scm",
    externalRef: po.number,
  },
  actor,
);
```

---

## 8. Perintah Verifikasi

```bash
npm run typecheck   # harus bersih
npm run build       # harus sukses
npm run setup       # generate + db push + seed
npm run dev         # jalankan lokal
```

Smoke test yang sudah dijalankan pada Tahap 1:

- health check ✅
- login admin/staff/customer ✅
- RBAC (401/403) ✅
- CRUD produk + duplikat SKU ✅
- transaksi penjualan/pengeluaran + validasi ✅
- snapshot HPP ✅
- void transaksi admin, staff ditolak ✅
- dashboard summary ✅
- registrasi customer + redirect portal ✅
- logout ✅

---

## 9. Catatan Penutup

Fondasi Tahap 1 stabil dan tidak memerlukan perubahan kontrak untuk SCM. Prioritaskan penambahan model dan service baru, bukan mengubah field lama. Jika ada kebutuhan mengubah `Product`/`FinancialTransaction`, koordinasikan terlebih dahulu karena modul CRM dan Pembayaran juga bergantung pada kontrak yang sama.

**Kontak/koordinasi:** tim Tahap 1 (Orang 1) — branch `stage-1/foundation-auth-erp`.
