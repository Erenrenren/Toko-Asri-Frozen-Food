# Toko Asri Frozen Food — SaaS ERP

Aplikasi web SaaS untuk tugas akhir **Sistem Informasi Manajemen (SIM)** dengan studi kasus **Toko Asri Frozen Food**. Repositori ini berisi **Tahap 1 dari 4**: fondasi proyek, autentikasi berbasis peran (RBAC), dan modul ERP inti.

> Branch pengembangan Tahap 1: `stage-1/foundation-auth-erp` (dibuat dari `main`).

---

## 1. Ringkasan Tahap 1

| Area | Status Tahap 1 |
| --- | --- |
| Fondasi Next.js + TypeScript + Tailwind | ✅ |
| Autentikasi login/logout/registrasi | ✅ |
| RBAC `admin`, `staff`, `customer` | ✅ |
| Manajemen akun dasar (admin) | ✅ |
| Master produk frozen food (SKU, kategori, HPP, harga jual, satuan, suhu, shelf life) | ✅ |
| Jurnal kas pemasukan/pengeluaran | ✅ |
| Rekap omzet, HPP, laba kotor, laba bersih | ✅ |
| Dashboard ERP + navigasi modul | ✅ |
| Placeholder aman SCM, CRM, Pembayaran | ✅ (UI + kontrak, tanpa logika detail) |
| Portal katalog pelanggan | ✅ (read-only) |
| API contract & dokumentasi | ✅ |

**Di luar cakupan Tahap 1 (sengaja belum diimplementasikan):**

- Restock otomatis, supplier, purchase order, cold-chain monitoring (SCM — Tahap 2).
- Loyalty, riwayat pelanggan lanjutan, segmentasi (CRM — Tahap 3).
- Payment gateway, invoice, rekonsiliasi, refund (Pembayaran — Tahap 4).
- Pengurangan stok otomatis saat penjualan. Stok pada Tahap 1 adalah data master; mutasi stok akan ditangani modul SCM.

---

## 2. Teknologi

- **Next.js 15.5** (App Router, Server Components, Route Handlers)
- **React 19** + **TypeScript 5.9** (strict)
- **Tailwind CSS 3.4** untuk design system
- **Prisma 6.19** + **SQLite** (mudah dijalankan lokal; siap dimigrasikan ke PostgreSQL)
- **Zod** untuk validasi input
- **jose** untuk JWT, **bcryptjs** untuk hash password
- **lucide-react** untuk ikon

---

## 3. Menjalankan Proyek Secara Lokal

### Prasyarat

- Node.js **>= 20.9** (disarankan Node 20/22 LTS)
- npm 10+
- Git

### Langkah

```bash
# 1. Clone repository
git clone https://github.com/Erenrenren/Toko-Asri-Frozen-Food.git
cd Toko-Asri-Frozen-Food

# 2. Gunakan branch Tahap 1
git checkout stage-1/foundation-auth-erp

# 3. Install dependency
npm install

# 4. Salin environment
#    macOS/Linux
cp .env.example .env
#    Windows PowerShell
#    Copy-Item .env.example .env

# 5. Isi AUTH_SECRET dengan string acak minimal 32 karakter.
#    Contoh membuat secret:
#    openssl rand -base64 48

# 6. Generate Prisma Client, buat database, dan isi data demo
npm run setup

# 7. Jalankan development server
npm run dev
```

Buka **http://localhost:3000**.

### Akun demo hasil seed

| Peran | Email | Password | Diarahkan ke |
| --- | --- | --- | --- |
| Admin / Pemilik | `admin@tokosasri.id` | `Admin123!` | `/dashboard` |
| Staff Operasional | `staff@tokosasri.id` | `Staff123!` | `/dashboard` |
| Pelanggan | `pelanggan@tokosasri.id` | `Customer123!` | `/portal` |

> Ganti password dan `AUTH_SECRET` sebelum dipakai di lingkungan nyata.

### Script npm

| Script | Fungsi |
| --- | --- |
| `npm run dev` | Menjalankan development server |
| `npm run build` | `prisma generate` + production build |
| `npm start` | Menjalankan hasil build |
| `npm run typecheck` | Pemeriksaan TypeScript tanpa emit |
| `npm run setup` | Generate client, `db push`, dan seed |
| `npm run db:push` | Sinkronisasi schema ke database |
| `npm run db:seed` | Mengisi data demo (idempotent untuk data seed) |
| `npm run db:reset` | Reset database + seed ulang |

---

## 4. Struktur Folder

```text
Toko-Asri-Frozen-Food/
├─ app/
│  ├─ (auth)/                       # Route group autentikasi
│  │  ├─ layout.tsx                 # Split-screen layout login/register
│  │  ├─ login/page.tsx
│  │  └─ register/page.tsx
│  ├─ (dashboard)/                  # Route group ERP (admin & staff)
│  │  ├─ layout.tsx                 # Guard role + shell sidebar
│  │  └─ dashboard/
│  │     ├─ page.tsx                # Dashboard metrik ERP
│  │     ├─ products/               # List, create, edit produk
│  │     ├─ transactions/           # Jurnal kas + form transaksi
│  │     ├─ users/                  # Pengelolaan akun (admin)
│  │     ├─ scm/page.tsx            # Placeholder Tahap 2
│  │     ├─ crm/page.tsx            # Placeholder Tahap 3
│  │     └─ payments/page.tsx       # Placeholder Tahap 4
│  ├─ portal/                       # Portal pelanggan (customer)
│  ├─ api/                          # Route Handlers (kontrak API)
│  │  ├─ auth/{login,logout,register,me}/route.ts
│  │  ├─ products/route.ts
│  │  ├─ products/[id]/route.ts
│  │  ├─ transactions/route.ts
│  │  ├─ transactions/[id]/route.ts
│  │  ├─ dashboard/summary/route.ts
│  │  ├─ users/route.ts
│  │  ├─ users/[id]/route.ts
│  │  └─ health/route.ts
│  ├─ layout.tsx
│  ├─ page.tsx                      # Landing page
│  ├─ globals.css
│  ├─ error.tsx
│  └─ not-found.tsx
├─ components/
│  ├─ auth/                         # Login & register form
│  ├─ brand/                        # Logo
│  ├─ dashboard/                    # Chart & module placeholder
│  ├─ layout/                       # Shell, sidebar, topbar, portal header
│  ├─ products/                     # Filter, form, row actions
│  ├─ transactions/                 # Filter, form, badges, row actions
│  ├─ ui/                           # Button, input, card, badge, dll.
│  └─ users/                        # Pengelolaan akun
├─ lib/
│  ├─ api/                          # Helper response, error, auth API, query
│  ├─ auth/                         # JWT, session, password, RBAC
│  ├─ db/prisma.ts                  # Prisma singleton
│  ├─ services/                     # Business/data layer
│  ├─ validators/                   # Schema Zod
│  ├─ constants.ts                  # Label, navigasi, konfigurasi
│  └─ format.ts                     # Formatter Rupiah/tanggal + cn()
├─ prisma/
│  ├─ schema.prisma                 # Model User, Product, FinancialTransaction
│  ├─ seed.ts                       # Data demo
│  └─ dev.db                        # SQLite lokal (gitignored)
├─ types/
│  ├─ domain.ts                     # Tipe & konstanta domain
│  └─ api.ts                        # Kontrak envelope API
├─ docs/
│  ├─ ARCHITECTURE.md
│  ├─ API_CONTRACT.md
│  ├─ STAGE-1-CHECKLIST.md
│  └─ HANDOFF-STAGE-2.md
├─ middleware.ts                    # Proteksi route berbasis JWT + role
├─ .env.example
├─ tailwind.config.ts
├─ next.config.ts
├─ tsconfig.json
└─ package.json
```

Folder untuk Tahap 2–4 **belum dibuat** agar tidak ada direktori kosong. Rencana penempatannya ada di [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) dan halaman placeholder masing-masing modul.

---

## 5. RBAC (Role-Based Access Control)

| Kapabilitas | `admin` | `staff` | `customer` |
| --- | :---: | :---: | :---: |
| Dashboard ERP & metrik | ✅ | ✅ | ❌ |
| Lihat katalog produk | ✅ | ✅ | ✅ (portal) |
| Tambah/edit/nonaktifkan produk | ✅ | ✅ | ❌ |
| Catat pemasukan/pengeluaran | ✅ | ✅ | ❌ |
| Batalkan (void) transaksi | ✅ | ❌ | ❌ |
| Kelola pengguna & peran | ✅ | ❌ | ❌ |
| Placeholder SCM/CRM/Pembayaran | ✅ | ✅ | ❌ |
| Portal pelanggan | ❌ | ❌ | ✅ |

**Aturan penting:**

- Registrasi publik **selalu** menghasilkan role `customer`.
- Admin tidak dapat menonaktifkan/menurunkan peran akunnya sendiri.
- Sistem selalu menjaga minimal satu admin aktif.
- Middleware memeriksa JWT; server layout/API memeriksa ulang user dari database agar penonaktifan akun langsung berlaku.

---

## 6. Kontrak API Singkat

Semua endpoint mengembalikan envelope yang sama:

```json
// Sukses
{ "success": true, "data": {}, "meta": { "page": 1, "pageSize": 10, "total": 8, "totalPages": 1 } }

// Gagal
{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "Data yang dikirim tidak valid.", "details": {} } }
```

Endpoint utama:

| Method | Endpoint | Akses |
| --- | --- | --- |
| POST | `/api/auth/register` | Publik |
| POST | `/api/auth/login` | Publik |
| POST | `/api/auth/logout` | Terautentikasi |
| GET | `/api/auth/me` | Terautentikasi |
| GET/POST | `/api/products` | admin, staff |
| GET/PATCH/DELETE | `/api/products/:id` | admin, staff |
| GET/POST | `/api/transactions` | admin, staff |
| GET | `/api/transactions/:id` | admin, staff |
| PATCH | `/api/transactions/:id` (void) | admin |
| GET | `/api/dashboard/summary` | admin, staff |
| GET/POST | `/api/users` | admin |
| PATCH | `/api/users/:id` | admin |
| GET | `/api/health` | Publik |

Detail request/response, status HTTP, dan contoh `curl` ada di [docs/API_CONTRACT.md](docs/API_CONTRACT.md).

---

## 7. Model Data Inti

- **User** — `id`, `name`, `email` (unik), `passwordHash`, `phone`, `role`, `isActive`, timestamps.
- **Product** — `sku` (unik), `name`, `category`, `description`, `storageTemperature`, `shelfLifeDays`, `costPrice` (HPP), `sellPrice`, `unit`, `packSize`, `stockQty`, `minStockQty`, `isActive`, timestamps.
- **FinancialTransaction** — `code` (unik), `type`, `category`, `amount`, `quantity`, `unitPrice`, `unitCost` (snapshot HPP), `description`, `occurredAt`, `source`, `status`, `externalRef`, `productId`, `createdById`, timestamps.

Keputusan desain:

- Semua nominal disimpan sebagai **integer Rupiah** (tanpa desimal) untuk menghindari error floating point.
- `unitCost` disimpan sebagai **snapshot** saat transaksi penjualan dibuat, sehingga laba historis tidak berubah ketika HPP produk diperbarui.
- Produk tidak dihapus permanen; aksi hapus = **soft delete** (`isActive = false`).
- `source` (`manual`, `pos`, `scm`, `payment`) dan `externalRef` sudah dicadangkan untuk integrasi tahap berikutnya.
- SQLite tidak mendukung enum native; nilai enum divalidasi oleh Zod dan TypeScript.

---

## 8. Build & Pemeriksaan

```bash
npm run typecheck   # tidak ada type error
npm run build       # production build
npm start           # jalankan hasil build
```

Checklist pengujian manual lengkap: [docs/STAGE-1-CHECKLIST.md](docs/STAGE-1-CHECKLIST.md).

---

## 9. Deployment & Migrasi ke PostgreSQL

Tahap 1 memakai SQLite agar mudah dinilai secara lokal. Untuk deployment nyata:

1. Ubah `provider` di `prisma/schema.prisma` dari `sqlite` ke `postgresql`.
2. Set `DATABASE_URL` ke PostgreSQL (mis. Neon/Supabase).
3. Jalankan `npx prisma migrate deploy` (setelah membuat migration) dan `npm run db:seed` bila perlu data demo.
4. Pastikan `AUTH_SECRET` production diisi dan cookie otomatis `secure` karena `NODE_ENV=production`.
5. Jangan mengandalkan filesystem SQLite pada platform serverless (Vercel) karena penyimpanan bersifat sementara.

---

## 10. Roadmap Tahap 2–4

| Tahap | Modul | Titik sambung utama |
| --- | --- | --- |
| 2 | SCM: supplier, PO, restock, cold-chain | `Product.stockQty/minStockQty`, `FinancialTransaction.source='scm'` |
| 3 | CRM: loyalty, riwayat, segmentasi | `User.role='customer'`, relasi transaksi pelanggan baru |
| 4 | Pembayaran: gateway, invoice, rekonsiliasi | `FinancialTransaction.source='payment'`, `externalRef`, status |

Baca **[docs/HANDOFF-STAGE-2.md](docs/HANDOFF-STAGE-2.md)** sebelum mulai Tahap 2.

---

## 11. Lisensi & Konteks

Proyek ini dibuat untuk keperluan tugas akhir mata kuliah Sistem Informasi Manajemen. Data toko dan akun demo bersifat fiktif.
