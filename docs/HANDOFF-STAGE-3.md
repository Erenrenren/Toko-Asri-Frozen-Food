# Handoff Tahap 3 — CRM & Loyalty

Dokumen ini ditujukan untuk **Orang 3** yang mengerjakan modul CRM. Tahap 1 (fondasi + ERP) dan Tahap 2 (SCM) sudah selesai dan menjadi kontrak yang **tidak boleh diubah tanpa koordinasi**.

---

## 1. Status yang diterima

| Modul | Status | Branch |
| --- | --- | --- |
| Fondasi, auth/RBAC, produk, jurnal kas, dashboard, portal | ✅ Selesai | `stage-1/foundation-auth-erp` |
| SCM: supplier, PO, goods receipt, stok, batch cold-chain, mutasi | ✅ Selesai | `stage-2/scm-inventory` |
| CRM: loyalty, riwayat, segmentasi | Placeholder | `stage-3/crm-loyalty` (buat dari `main`) |
| Pembayaran | Placeholder | Tahap 4 |

Titik masuk UI Tahap 3: `app/(dashboard)/dashboard/crm/page.tsx` (masih placeholder) dan `components/dashboard/module-placeholder` bila masih dipakai.

---

## 2. Yang sudah tersedia untuk dipakai CRM

### 2.1 Pengguna & peran

- `User` memiliki `role` (`admin|staff|customer`), `isActive`, `phone`, timestamps.
- Registrasi publik selalu `customer`; jangan ubah aturan ini.
- `lib/auth/session.ts`: `requireUser`, `requireRole`, `requireApiUser`.
- Customer hanya boleh mengakses `/portal` dan endpoint yang memang dibuka untuknya.

### 2.2 Riwayat transaksi

`FinancialTransaction` sudah menyimpan:

- `type` (`income|expense`), `category` (`sale|purchase|...`), `amount`, `quantity`, `unitPrice`, `unitCost`.
- `source` (`manual|pos|scm|payment`), `externalRef`, `status` (`posted|void`), `productId`, `createdById`, `occurredAt`.

Saat ini transaksi penjualan **belum** terhubung ke customer (tidak ada `customerId`). Untuk CRM, tambahkan relasi aditif, misalnya:

```prisma
model FinancialTransaction {
  // ...field lama tetap
  customerId String?
  customer   User?   @relation("CustomerTransactions", fields: [customerId], references: [id])
}

model User {
  // ...field lama tetap
  customerTransactions FinancialTransaction[] @relation("CustomerTransactions")
}
```

Aturan: field baru **opsional** agar transaksi lama tetap valid. Jangan mengganti nama/arti `amount`, `type`, `source`, atau `status`.

### 2.3 Stok & penjualan (penting)

Tahap 1 sengaja **tidak** mengurangi stok saat penjualan. Tahap 2 menyediakan:

- `StockMovement` dengan `type: "out"`, `reason: "sale"` untuk mencatat stok keluar.
- `ProductBatch` + FIFO expiry terdekat.
- `lib/services/scm/stock.service.ts` → `createStockMovement(input, actor)`.

Jika Tahap 3/4 membuat alur penjualan baru (POS/checkout), **panggil service SCM** untuk stok keluar, jangan menulis `Product.stockQty` langsung. Ini menjaga audit dan mencegah stok negatif. Jangan mengubah transaksi penjualan Tahap 1 yang sudah ada agar tidak regresi.

### 2.4 Jurnal kas

- Gunakan pola `createTransaction` yang sudah ada (`lib/services/transaction.service.ts`) atau tambah method baru yang tetap menulis `FinancialTransaction`.
- Pembelian SCM memakai `source: "scm"`, `category: "purchase"`, `externalRef` = nomor PO. Jangan membuat jurnal pembelian kedua dari modul lain.
- CRM **tidak** perlu menulis jurnal kecuali ada transaksi bernilai uang baru (mis. penukaran poin). Bila ada, pakai `source: "crm"` hanya jika disepakati; jika tidak, tetap `manual` dengan `externalRef` yang jelas.

---

## 3. Kontrak yang tidak boleh dilanggar

1. Envelope API: `{ success, data, meta?, message? }` / `{ success: false, error }`.
2. Pagination: `page` (default 1), `pageSize` (default 10, maks 100), `meta.totalPages` minimal 1.
3. Nominal integer Rupiah; tanggal ISO 8601; DTO di `types/domain.ts`.
4. Route API wajib `requireApiUser([...roles])` + `handleApiError`.
5. Service tidak mengembalikan objek Prisma mentah; selalu map ke DTO.
6. Schema hanya aditif; jangan hapus/rename field Tahap 1–2.
7. Soft delete: produk/pengguna dinonaktifkan, bukan dihapus.
8. Validasi enum di Zod + TypeScript (SQLite tidak punya enum native).
9. Jangan menulis query Prisma dari komponen client.

---

## 4. Peta file SCM yang relevan

```text
prisma/schema.prisma                  # Supplier, SupplierProduct, PurchaseOrder,
                                      # PurchaseOrderItem, GoodsReceipt, GoodsReceiptItem,
                                      # ProductBatch, StockMovement
prisma/seed.ts                        # seed SCM prefix SEED-*
types/domain.ts                       # DTO & konstanta SCM
lib/constants.ts                      # label, SCM_NAV_ITEMS
lib/validators/scm.ts                 # Zod SCM
lib/services/scm/scm.utils.ts         # nomor dokumen, FIFO, status batch
lib/services/scm/supplier.service.ts
lib/services/scm/purchase-order.service.ts
lib/services/scm/stock.service.ts
lib/services/scm/overview.service.ts
app/api/scm/**                        # route handler SCM
app/(dashboard)/dashboard/scm/**      # halaman SCM
components/scm/**                     # komponen client SCM
```

Contoh pemakaian stok keluar dari modul lain:

```ts
import { createStockMovement } from "@/lib/services/scm/stock.service";

await createStockMovement(
  {
    productId,
    type: "out",
    quantity,
    reason: "sale",
    note: `Penjualan ${invoiceNumber}`,
  },
  { id: actor.id, role: actor.role },
);
```

Service akan memakai FIFO batch, menolak stok negatif, dan mencatat `StockMovement` bertanda negatif.

---

## 5. Data demo Tahap 2

| Data | Keterangan |
| --- | --- |
| 3 supplier | `PT Frozen Nusantara`, `CV Sumber Beku` (aktif), `PT Arktik Distribution` (nonaktif) |
| 8 produk | masing-masing memiliki batch seed `SEED-BATCH-*` |
| `SEED-PO-001` | status `ordered`, siap diuji penerimaan |
| `SEED-PO-002` | status `draft`, siap diuji submit/batal |
| Mutasi | saldo awal + penjualan/pemusnahan untuk sebagian produk |
| Batch khusus | `DMS-002` punya batch kedaluwarsa & mendekati expiry; `IKN-001` mendekati expiry |

Reset data: `npm run db:reset` (menghapus DB lalu seed ulang).

---

## 6. Tugas yang disarankan untuk Tahap 3

1. **Profil pelanggan** — halaman detail customer (kontak, total belanja, kunjungan terakhir).
2. **Riwayat transaksi per customer** — tambahkan `customerId` opsional pada transaksi, lalu query agregat.
3. **Loyalty poin** — model `LoyaltyAccount`/`LoyaltyLedger` (aditif), aturan earn/redeem, dan riwayat poin.
4. **Segmentasi** — label otomatis (baru, aktif, dormant, VIP) berbasis frekuensi/nilai belanja.
5. **Dashboard CRM** — metrik pelanggan baru, repeat order, top customer, poin beredar.
6. **Sinkronisasi portal** — tampilkan poin/riwayat milik customer yang login (batasi ke `userId` sendiri).
7. **Dokumentasi** — perbarui `docs/API_CONTRACT.md`, `docs/ARCHITECTURE.md`, dan tambahkan `docs/STAGE-3-CHECKLIST.md`.

---

## 7. Verifikasi sebelum push

```bash
npm run typecheck
npm run build
npm run setup      # bila schema berubah
npm start
```

- [ ] Tahap 1 & 2 masih lulus checklist masing-masing.
- [ ] Endpoint baru memakai envelope + RBAC.
- [ ] Customer tidak dapat melihat data customer lain.
- [ ] `FinancialTransaction` lama tidak berubah arti.
- [ ] Stok tidak pernah negatif dan setiap penjualan yang mengurangi stok meninggalkan `StockMovement`.

---

## 8. Catatan koordinasi

- Jangan merge ke `main` sebelum `npm run typecheck` dan `npm run build` lulus.
- Jika perlu menambah field pada model SCM (mis. `customerId` pada transaksi), buat field **nullable** dan jelaskan di PR.
- Jika menemukan bug Tahap 1–2, perbaiki di branch terpisah dan catat di PR; jangan mencampur refactor besar dengan fitur CRM.
- Kontak: pemilik Tahap 2 (SCM) — lihat riwayat commit branch `stage-2/scm-inventory`.
