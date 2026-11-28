# Arsitektur & Konvensi Pengembangan

Dokumen ini menjelaskan arsitektur Tahap 1–2 dan aturan perluasan untuk Tahap 3–4. Tujuannya agar empat orang dapat bekerja paralel tanpa mengubah kontrak dasar.

---

## 1. Prinsip Arsitektur

1. **Modular per domain** — UI, validasi, service, dan route API dipisah berdasarkan domain (`products`, `transactions`, `users`, `auth`).
2. **Kontrak stabil** — envelope response, tipe domain, dan nama field tidak berubah tanpa koordinasi.
3. **Server-first** — data dibaca langsung melalui service di Server Component; mutasi melalui Route Handler agar kontrak API tetap jelas.
4. **Validasi berlapis** — validasi di form (UX), Zod (API), dan database (unique constraint).
5. **Least privilege** — middleware + pengecekan role di layout/API + pengecekan ulang user aktif di database.
6. **Snapshot untuk angka historis** — HPP disalin ke transaksi saat penjualan terjadi.
7. **Placeholder aman** — modul tahap berikutnya memiliki halaman read-only yang tidak menulis data.

---

## 2. Lapisan Aplikasi

```text
Browser
  │
  ├─ Server Component (app/**/page.tsx)
  │     └─ lib/services/*.service.ts ──► Prisma ──► SQLite
  │
  └─ Client Component (components/**)
        └─ fetch('/api/...')
              └─ Route Handler (app/api/**/route.ts)
                    ├─ requireApiUser([...roles])   (lib/api/auth.ts)
                    ├─ Zod validator                 (lib/validators/*)
                    └─ lib/services/*.service.ts ──► Prisma
```

**Aturan:**

- Komponen client **tidak** mengimpor Prisma atau service server.
- Service **tidak** mengembalikan objek Prisma mentah; selalu dipetakan ke DTO (`types/domain.ts`) dengan tanggal ISO.
- Route Handler **tidak** berisi query database langsung; panggil service.
- Semua error API melewati `handleApiError` agar format konsisten.
- Halaman dashboard memakai `requireUser`/`requireRole`; API memakai `requireApiUser`.

---

## 3. Struktur & Kepemilikan Modul

| Folder | Tahap 1 | Pemilik Tahap 2–4 |
| --- | --- | --- |
| `app/(dashboard)/dashboard/products` | ✅ | — |
| `app/(dashboard)/dashboard/transactions` | ✅ | — |
| `app/(dashboard)/dashboard/users` | ✅ | — |
| `app/(dashboard)/dashboard/scm` | ✅ Tahap 2 | — |
| `app/(dashboard)/dashboard/crm` | Placeholder | Orang 3 |
| `app/(dashboard)/dashboard/payments` | Placeholder | Orang 4 |
| `app/api/products`, `transactions`, `users`, `auth` | ✅ | Jangan ubah kontrak |
| `app/api/scm/**` | ✅ Tahap 2 | Jangan ubah kontrak |
| `app/api/crm/**` | Belum ada | Orang 3 |
| `app/api/payments/**` | Belum ada | Orang 4 |
| `lib/services/product|transaction|user.service.ts` | ✅ | Boleh ditambah method, jangan ubah signature lama |
| `lib/services/scm/**` | ✅ Tahap 2 | — |
| `lib/services/crm|payment/**` | Belum ada | Masing-masing |
| `components/scm/**` | ✅ Tahap 2 | — |
| `components/crm|payments/**` | Belum ada | Masing-masing |
| `prisma/schema.prisma` | Model inti + SCM | Tambah model/relasi baru; jangan hapus field inti |

**Aturan anti-konflik:**

- Jangan mengubah nama field pada `User`, `Product`, `FinancialTransaction` yang sudah dipakai kontrak.
- Jangan mengubah arti `amount`, `type`, `category`, `status`, atau `source`.
- Perubahan schema harus aditif (field opsional/model baru) dan dikoordinasikan.
- Satu domain = satu service + satu validator + satu folder route/komponen.

---

## 4. Alur Request

### 4.1 Halaman (Server Component)

1. Middleware memeriksa cookie JWT untuk `/dashboard/**` dan `/portal/**`.
2. Layout memanggil `requireUser()` / `requireRole()` yang membaca user terbaru dari database.
3. Halaman memanggil service (mis. `listProducts`).
4. Service memetakan hasil Prisma menjadi DTO.
5. Komponen server merender HTML; komponen client hanya untuk interaksi.

### 4.2 Mutasi (Client → API)

1. Form client memvalidasi input dasar.
2. `fetch` mengirim JSON ke route API.
3. Route memanggil `requireApiUser([...])`.
4. Zod mem-parse body; error → HTTP 422.
5. Service menjalankan aturan bisnis dan Prisma.
6. Response sukses `201/200` dengan envelope `{ success: true, data }`.
7. Client `router.push`/`router.refresh` untuk memperbarui data server.

### 4.3 Autentikasi

- Login/register membuat JWT HS256 berisi `sub`, `name`, `email`, `role`, masa berlaku 7 hari.
- JWT disimpan pada cookie `tasri_session` (`httpOnly`, `sameSite=lax`, `secure` di production).
- Middleware hanya memverifikasi JWT (edge-safe). Layout/API memverifikasi ulang user aktif di database.
- Logout menghapus cookie (`maxAge=0`).

---

## 5. Konvensi Penamaan

| Objek | Konvensi | Contoh |
| --- | --- | --- |
| File komponen | kebab-case | `product-form.tsx` |
| Komponen React | PascalCase | `ProductForm` |
| Service | `<domain>.service.ts` | `product.service.ts` |
| Validator | `<domain>.ts` di `lib/validators` | `lib/validators/product.ts` |
| Route API | plural, REST-ish | `/api/products`, `/api/products/[id]` |
| Tipe DTO | `XxxDTO` | `ProductDTO`, `TransactionDTO` |
| Tabel Prisma | PascalCase model, snake_case `@@map` | `FinancialTransaction` → `financial_transactions` |
| Nominal | integer Rupiah | `38000` |
| Tanggal API | ISO 8601 string | `2026-11-27T03:00:00.000Z` |

---

## 6. Keamanan

- Password di-hash bcrypt (10 rounds), tidak pernah dikembalikan API.
- Cookie httpOnly mengurangi risiko pencurian token via XSS.
- `sameSite=lax` mengurangi CSRF pada navigasi lintas situs.
- Role diperiksa di tiga lapis: middleware, layout/halaman, dan API.
- Registrasi publik tidak dapat menentukan role; role selalu `customer`.
- Admin tidak bisa menonaktifkan dirinya sendiri atau menghapus admin aktif terakhir.
- Pesan login gagal disamakan untuk email tidak ditemukan vs password salah.
- `AUTH_SECRET` wajib >= 32 karakter di production.

**Belum diimplementasikan (rekomendasi tahap lanjut):** rate limiting login, verifikasi email, reset password via email, audit log, CSRF token eksplisit untuk form non-JSON, 2FA.

---

## 7. Keputusan Data

### 7.1 Rupiah integer

Semua harga dan nominal memakai `Int`. Ini menghindari pembulatan floating point dan cocok dengan praktik toko ritel.

### 7.2 Snapshot HPP

`FinancialTransaction.unitCost` diisi dari `Product.costPrice` saat transaksi penjualan dibuat. Jika HPP berubah besok, laba kotor transaksi lama tetap akurat.

### 7.3 Soft delete produk

`DELETE /api/products/:id` menonaktifkan produk (`isActive=false`), bukan menghapus baris. Tujuannya menjaga integritas transaksi historis.

### 7.4 Stok dan mutasi

`Product.stockQty` tetap menjadi saldo stok yang dibaca katalog dan dashboard. Perubahan stok **hanya** terjadi melalui service SCM:

- Goods receipt PO (menambah stok + batch + mutasi `in` + jurnal pembelian).
- Mutasi manual (`in`, `out`, `adjustment`) dari halaman stok.

Penjualan Tahap 1 **tidak** mengurangi stok agar perilaku lama tidak berubah. Stok keluar penjualan dapat dicatat sebagai mutasi `out` dengan alasan `sale`; integrasi otomatis diserahkan ke Tahap 3 (lihat `docs/HANDOFF-STAGE-3.md`).

### 7.5 Atomisitas penerimaan barang

`receivePurchaseOrder` membungkus seluruh proses dalam `prisma.$transaction`. Ini mencegah kondisi stok bertambah tetapi jurnal kas gagal dibuat (atau sebaliknya). Nomor dokumen (`PO-`, `GR-`, `MOV-`, `TRX-`) memakai tanggal + suffix acak untuk menghindari tabrakan.

### 7.6 Batch & FIFO

Batch menyimpan `receivedQty`, `remainingQty`, dan `expiryDate`. Mutasi keluar tanpa batch eksplisit memakai **FIFO expiry terdekat**: batch dengan expiry paling awal dikonsumsi lebih dulu, dan bila perlu mutasi dipecah menjadi beberapa baris per batch. Status `expired` dihitung saat dibaca dari tanggal, sehingga tidak butuh cron job.

### 7.7 SQLite → PostgreSQL

SQLite dipilih untuk kemudahan demo lokal. Schema tidak memakai enum native agar kompatibel. Saat pindah PostgreSQL, enum dapat ditambahkan atau tetap memakai String + Zod.

---

## 8. Cara Menambah Modul Baru (Tahap 2–4)

Contoh alur untuk SCM:

1. **Schema** — tambah model `Supplier`, `PurchaseOrder`, `StockMovement` di `prisma/schema.prisma` (aditif).
2. **Types** — tambah DTO dan konstanta di `types/domain.ts`.
3. **Validator** — `lib/validators/scm.ts` dengan Zod.
4. **Service** — `lib/services/scm/supplier.service.ts`, `stock.service.ts`, dst.
5. **API** — `app/api/scm/suppliers/route.ts`, `app/api/scm/purchase-orders/route.ts`; gunakan `requireApiUser` dan `handleApiError`.
6. **UI** — ganti isi placeholder `app/(dashboard)/dashboard/scm/page.tsx`; tambah komponen di `components/scm/`.
7. **Integrasi kas** — catat pembelian melalui `createTransaction` dengan `source: 'scm'` dan `externalRef` nomor PO, atau tambah method khusus yang tetap menulis `FinancialTransaction`.
8. **Dokumentasi** — perbarui `docs/API_CONTRACT.md` dan handoff.

**Jangan:**

- Menulis query Prisma langsung di komponen client.
- Mengembalikan response tanpa envelope.
- Mengubah field/endpoint Tahap 1 tanpa diskusi.
- Menghapus produk/transaksi historis secara hard delete.

---

## 9. Struktur Folder SCM (sudah tersedia)

```text
app/api/scm/
├─ overview/route.ts
├─ suppliers/route.ts
├─ suppliers/[id]/route.ts
├─ purchase-orders/route.ts
├─ purchase-orders/[id]/route.ts
├─ purchase-orders/[id]/receive/route.ts
├─ stock/route.ts
├─ stock/[productId]/route.ts
├─ batches/route.ts
└─ stock-movements/route.ts

lib/services/scm/
├─ scm.utils.ts
├─ supplier.service.ts
├─ purchase-order.service.ts
├─ stock.service.ts
└─ overview.service.ts

components/scm/
├─ scm-nav.tsx
├─ scm-badges.tsx
├─ supplier-form.tsx
├─ supplier-row-actions.tsx
├─ purchase-order-form.tsx
├─ purchase-order-actions.tsx
├─ receive-form.tsx
└─ stock-adjustment-form.tsx
```

Rencana Tahap 3–4:

```text
app/api/crm/            lib/services/crm/            components/crm/
app/api/payments/       lib/services/payment/        components/payments/
```

---

## 10. Referensi

- Kontrak API: [API_CONTRACT.md](API_CONTRACT.md)
- Checklist Tahap 1: [STAGE-1-CHECKLIST.md](STAGE-1-CHECKLIST.md)
- Checklist Tahap 2: [STAGE-2-CHECKLIST.md](STAGE-2-CHECKLIST.md)
- Handoff Orang 2: [HANDOFF-STAGE-2.md](HANDOFF-STAGE-2.md)
- Handoff Orang 3 (CRM): [HANDOFF-STAGE-3.md](HANDOFF-STAGE-3.md)
