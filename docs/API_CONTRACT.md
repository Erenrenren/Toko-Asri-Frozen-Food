# Kontrak API — Tahap 1 & 2

Dokumen ini adalah **kontrak resmi** antara frontend dan seluruh modul Tahap 1–4. Jangan mengubah envelope, nama field, atau arti nilai tanpa koordinasi lintas tahap. Bagian 10 mendokumentasikan tambahan modul SCM Tahap 2; seluruh kontrak Tahap 1 tetap berlaku.

- Base URL lokal: `http://localhost:3000`
- Content-Type request: `application/json`
- Autentikasi: cookie `tasri_session` (JWT httpOnly, `sameSite=lax`, 7 hari)
- Tanggal: ISO 8601 string
- Nominal: integer Rupiah (tanpa desimal)

---

## 1. Envelope Response

### Sukses

```json
{
  "success": true,
  "data": {},
  "meta": {
    "page": 1,
    "pageSize": 10,
    "total": 8,
    "totalPages": 1
  },
  "message": "Opsional."
}
```

- `meta` hanya ada pada endpoint list.
- `message` opsional dan tidak boleh dipakai untuk logika program.

### Gagal

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Data yang dikirim tidak valid.",
    "details": {
      "formErrors": [],
      "fieldErrors": {
        "sku": ["SKU minimal 3 karakter."]
      }
    }
  }
}
```

- `details` opsional; untuk Zod berisi hasil `flatten()`.

### Kode error

| HTTP | `error.code` | Arti |
| --- | --- | --- |
| 400 | `VALIDATION_ERROR` | Body bukan JSON / parameter tidak valid |
| 401 | `UNAUTHORIZED` | Belum login, sesi berakhir, kredensial salah, akun nonaktif |
| 403 | `FORBIDDEN` | Role tidak memiliki akses |
| 404 | `NOT_FOUND` | Resource tidak ditemukan |
| 409 | `CONFLICT` | Duplikat SKU/email, aturan bisnis bentrok |
| 422 | `VALIDATION_ERROR` | Validasi Zod gagal |
| 500 | `INTERNAL_ERROR` | Kesalahan server |

### Pagination

Query: `?page=1&pageSize=10`

- `page` default `1`, minimum `1`.
- `pageSize` default `10`, maksimum `100`.
- `meta.totalPages` minimal `1`.

---

## 2. Autentikasi & Otorisasi

| Endpoint | Method | Akses |
| --- | --- | --- |
| `/api/auth/register` | POST | Publik |
| `/api/auth/login` | POST | Publik |
| `/api/auth/logout` | POST | Terautentikasi |
| `/api/auth/me` | GET | Terautentikasi |

Cookie yang dipakai:

```http
Set-Cookie: tasri_session=<jwt>; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800
```

JWT payload:

```json
{
  "sub": "user_id",
  "name": "Asri Wijaya",
  "email": "admin@tokosasri.id",
  "role": "admin",
  "iat": 1730000000,
  "exp": 1730604800
}
```

---

### 2.1 POST `/api/auth/register`

Registrasi publik. Role **selalu** `customer`.

**Body**

```json
{
  "name": "Sinta Maharani",
  "email": "sinta@example.com",
  "password": "Rahasia123",
  "phone": "081234567890"
}
```

- `name`: 2–80 karakter.
- `email`: valid, unik, otomatis lowercase.
- `password`: 8–72 karakter, mengandung huruf dan angka.
- `phone`: opsional, 8–20 karakter angka/`+`/`-`/spasi.

**Response 201** — `UserDTO`, cookie sesi langsung dipasang.

```json
{
  "success": true,
  "data": {
    "id": "cm...",
    "name": "Sinta Maharani",
    "email": "sinta@example.com",
    "phone": "081234567890",
    "role": "customer",
    "isActive": true,
    "createdAt": "2026-11-27T03:00:00.000Z"
  },
  "message": "Registrasi berhasil. Selamat datang!"
}
```

**Error:** `409 CONFLICT` bila email sudah terdaftar; `422` bila validasi gagal.

---

### 2.2 POST `/api/auth/login`

**Body**

```json
{ "email": "admin@tokosasri.id", "password": "Admin123!" }
```

**Response 200** — `UserDTO`, cookie sesi dipasang.

**Error:** `401 UNAUTHORIZED` untuk email/password salah atau akun nonaktif.

---

### 2.3 POST `/api/auth/logout`

Tidak perlu body. Menghapus cookie sesi.

**Response 200**

```json
{ "success": true, "data": { "loggedOut": true }, "message": "Logout berhasil." }
```

---

### 2.4 GET `/api/auth/me`

**Response 200** — `UserDTO` user yang sedang login.

**Error:** `401` bila cookie tidak ada/tidak valid.

---

## 3. Produk

Akses baca/tulis: `admin`, `staff`.

### 3.1 GET `/api/products`

**Query**

| Parameter | Nilai | Keterangan |
| --- | --- | --- |
| `search` | string | Cari nama, SKU, atau deskripsi |
| `category` | `nugget` \| `sosis` \| `dimsum` \| `ikan` \| `daging` \| `kentang` \| `lainnya` | Filter kategori |
| `status` | `active` \| `inactive` \| `all` | Default `all` |
| `page` | integer | Default 1 |
| `pageSize` | integer | Default 10, maks 100 |

**Response 200**

```json
{
  "success": true,
  "data": [
    {
      "id": "cm...",
      "sku": "NGT-001",
      "name": "Nugget Ayam Premium 500g",
      "category": "nugget",
      "description": "Nugget ayam berbumbu...",
      "storageTemperature": -18,
      "shelfLifeDays": 180,
      "costPrice": 28000,
      "sellPrice": 38000,
      "unit": "pack",
      "packSize": 1,
      "stockQty": 48,
      "minStockQty": 12,
      "isActive": true,
      "margin": 26.3,
      "createdAt": "2026-11-20T02:00:00.000Z",
      "updatedAt": "2026-11-20T02:00:00.000Z"
    }
  ],
  "meta": { "page": 1, "pageSize": 10, "total": 8, "totalPages": 1 }
}
```

`margin` dihitung server: `(sellPrice - costPrice) / sellPrice * 100`, satu desimal.

---

### 3.2 POST `/api/products`

**Body**

```json
{
  "sku": "NGT-003",
  "name": "Nugget Ayam Crispy 500g",
  "category": "nugget",
  "description": "Opsional.",
  "storageTemperature": -18,
  "shelfLifeDays": 180,
  "costPrice": 28000,
  "sellPrice": 38000,
  "unit": "pack",
  "packSize": 1,
  "stockQty": 20,
  "minStockQty": 5,
  "isActive": true
}
```

Aturan:

- `sku`: 3–32 karakter, huruf/angka/`-`, otomatis uppercase, unik.
- `name`: 2–120 karakter.
- `category`: salah satu nilai enum.
- `storageTemperature`: -60 s/d 20, boleh `null`.
- `shelfLifeDays`: 1–3650, boleh `null`.
- `costPrice`, `sellPrice`: integer >= 0.
- `unit`: `pcs` \| `pack` \| `karton` \| `kg`.
- `packSize`: integer >= 1 atau `null`.
- `stockQty`, `minStockQty`: integer >= 0.
- `isActive`: boolean, default `true`.

**Response 201** — `ProductDTO`.

**Error:** `409` SKU duplikat, `422` validasi.

---

### 3.3 GET `/api/products/:id`

**Response 200** — `ProductDTO`; `404` bila tidak ada.

### 3.4 PATCH `/api/products/:id`

Body parsial (field mana pun dari create). Contoh:

```json
{ "sellPrice": 40000, "isActive": false }
```

**Response 200** — `ProductDTO` terbaru.

**Error:** `404`, `409` bila SKU baru duplikat, `422`.

### 3.5 DELETE `/api/products/:id`

Soft delete: mengubah `isActive=false`. Tidak menghapus baris.

**Response 200** — `ProductDTO` dengan `isActive: false`.

---

## 4. Transaksi Keuangan

Akses list/create: `admin`, `staff`. Void: `admin` saja.

### 4.1 GET `/api/transactions`

**Query**

| Parameter | Nilai | Keterangan |
| --- | --- | --- |
| `search` | string | Cari kode, keterangan, nama produk |
| `type` | `income` \| `expense` | Filter jenis |
| `category` | `sales` \| `purchase` \| `operational` \| `other` | Filter kategori |
| `from` | `YYYY-MM-DD` | Awal rentang (WIB) |
| `to` | `YYYY-MM-DD` | Akhir rentang (WIB) |
| `page`, `pageSize` | integer | Pagination |

**Response 200**

```json
{
  "success": true,
  "data": [
    {
      "id": "cm...",
      "code": "TRX-20261127-A1B2C3",
      "type": "income",
      "category": "sales",
      "amount": 114000,
      "quantity": 3,
      "unitPrice": 38000,
      "unitCost": 28000,
      "description": "Penjualan Nugget Ayam Premium 500g (3 pack)",
      "occurredAt": "2026-11-27T02:00:00.000Z",
      "source": "manual",
      "status": "posted",
      "externalRef": null,
      "productId": "cm...",
      "product": {
        "id": "cm...",
        "sku": "NGT-001",
        "name": "Nugget Ayam Premium 500g",
        "unit": "pack"
      },
      "createdBy": { "id": "cm...", "name": "Budi Santoso", "role": "staff" },
      "createdAt": "2026-11-27T02:00:00.000Z"
    }
  ],
  "meta": { "page": 1, "pageSize": 10, "total": 1, "totalPages": 1 }
}
```

---

### 4.2 POST `/api/transactions`

#### A. Penjualan (pemasukan)

```json
{
  "type": "income",
  "category": "sales",
  "description": "Penjualan nugget 3 pack",
  "occurredAt": "2026-11-27",
  "productId": "cm...",
  "quantity": 3,
  "unitPrice": 38000
}
```

- `productId`, `quantity`, `unitPrice` wajib.
- `amount` dihitung server: `quantity × unitPrice`.
- `unitCost` diisi otomatis dari `Product.costPrice` (snapshot).
- Produk harus aktif.

#### B. Pengeluaran

```json
{
  "type": "expense",
  "category": "operational",
  "description": "Token listrik cold storage",
  "occurredAt": "2026-11-27",
  "amount": 350000
}
```

- `amount` wajib > 0.
- `category` untuk expense: `purchase`, `operational`, `other`.
- `purchase` tidak boleh bertipe `income`; `sales` tidak boleh bertipe `expense`.

#### C. Pemasukan lain

```json
{
  "type": "income",
  "category": "other",
  "description": "Pendapatan lain-lain",
  "amount": 100000
}
```

**Field opsional:** `source` (`manual` default; `pos`, `scm`, `payment` hanya admin), `externalRef` (maks 120 karakter), `occurredAt` (default sekarang).

**Response 201** — `TransactionDTO`.

**Error:** `404` produk tidak ada, `400` produk nonaktif / data tidak lengkap, `422` validasi.

---

### 4.3 GET `/api/transactions/:id`

**Response 200** — `TransactionDTO`.

### 4.4 PATCH `/api/transactions/:id`

Hanya untuk **void** (admin).

```json
{ "status": "void" }
```

**Response 200** — `TransactionDTO` dengan `status: "void"`.

**Error:** `403` staff, `404` tidak ada, `400` sudah void.

> Transaksi void tetap tersimpan untuk audit, tetapi tidak dihitung pada ringkasan dashboard.

---

## 5. Dashboard

### GET `/api/dashboard/summary`

Akses: `admin`, `staff`.

**Response 200**

```json
{
  "success": true,
  "data": {
    "period": {
      "label": "November 2026",
      "start": "2026-10-31T17:00:00.000Z",
      "end": "2026-11-30T17:00:00.000Z"
    },
    "metrics": {
      "revenue": 4860000,
      "cogs": 3118000,
      "grossProfit": 1742000,
      "expenses": 1875000,
      "netProfit": -133000,
      "grossMargin": 35.8,
      "totalProducts": 8,
      "activeProducts": 8,
      "lowStockProducts": 2,
      "totalUsers": 3,
      "transactionCount": 16
    },
    "salesTrend": [
      { "date": "2026-11-21", "label": "Sab", "revenue": 0, "transactions": 0 }
    ],
    "categoryBreakdown": [
      { "category": "nugget", "products": 2, "stockQty": 74 }
    ],
    "topProducts": [
      {
        "productId": "cm...",
        "name": "Nugget Ayam Premium 500g",
        "sku": "NGT-001",
        "quantity": 8,
        "revenue": 304000
      }
    ],
    "recentTransactions": [],
    "lowStockList": [
      {
        "id": "cm...",
        "sku": "IKN-001",
        "name": "Ikan Dori Fillet 500g",
        "stockQty": 7,
        "minStockQty": 10,
        "unit": "pack"
      }
    ]
  }
}
```

**Definisi metrik:**

- `revenue` = total `income` kategori `sales`, status `posted`, bulan berjalan (WIB).
- `cogs` = Σ(`quantity × unitCost`) penjualan bulan berjalan.
- `grossProfit` = `revenue - cogs`.
- `expenses` = total `expense` status `posted`.
- `netProfit` = `grossProfit + otherIncome - expenses`.
- `grossMargin` = `grossProfit / revenue × 100`.
- `salesTrend` = 7 hari terakhir termasuk hari ini.
- `lowStockList` = produk aktif dengan `stockQty <= minStockQty`.

---

## 6. Pengguna

Akses: `admin` saja.

### 6.1 GET `/api/users`

**Query:** `search`, `role` (`admin`/`staff`/`customer`), `status` (`active`/`inactive`/`all`), `page`, `pageSize`.

**Response 200** — array `UserDTO` + `meta`.

### 6.2 POST `/api/users`

**Body**

```json
{
  "name": "Staff Baru",
  "email": "staff2@tokosasri.id",
  "password": "Staff123!",
  "phone": "081200000000",
  "role": "staff"
}
```

**Response 201** — `UserDTO`. `409` bila email duplikat.

### 6.3 PATCH `/api/users/:id`

Body minimal salah satu:

```json
{ "role": "staff", "isActive": true, "name": "Nama Baru", "phone": "0812..." }
```

Aturan:

- Admin tidak dapat menonaktifkan/menurunkan peran dirinya sendiri.
- Tidak dapat menonaktifkan/menurunkan admin aktif terakhir.
- `phone` kosong tidak mengubah nilai lama (kirim nomor valid untuk mengubah).

**Response 200** — `UserDTO`.

---

## 7. Health Check

### GET `/api/health`

```json
{
  "success": true,
  "data": {
    "status": "ok",
    "app": "Toko Asri Frozen Food",
    "stage": 2,
    "timestamp": "2026-11-27T03:00:00.000Z"
  }
}
```

---

## 8. Matriks Akses Ringkas

| Endpoint | admin | staff | customer |
| --- | :---: | :---: | :---: |
| `POST /api/auth/register` | publik | publik | publik |
| `POST /api/auth/login` | publik | publik | publik |
| `GET /api/auth/me` | ✅ | ✅ | ✅ |
| `GET/POST /api/products` | ✅ | ✅ | ❌ |
| `GET/PATCH/DELETE /api/products/:id` | ✅ | ✅ | ❌ |
| `GET/POST /api/transactions` | ✅ | ✅ | ❌ |
| `PATCH /api/transactions/:id` (void) | ✅ | ❌ | ❌ |
| `GET /api/dashboard/summary` | ✅ | ✅ | ❌ |
| `GET/POST /api/users` | ✅ | ❌ | ❌ |
| `PATCH /api/users/:id` | ✅ | ❌ | ❌ |
| `GET /api/scm/overview` | ✅ | ✅ | ❌ |
| `GET/POST /api/scm/suppliers` | ✅ | ✅ | ❌ |
| `GET/PATCH /api/scm/suppliers/:id` | ✅ | ✅ | ❌ |
| `GET/POST /api/scm/purchase-orders` | ✅ | ✅ | ❌ |
| `GET /api/scm/purchase-orders/:id` | ✅ | ✅ | ❌ |
| `PATCH /api/scm/purchase-orders/:id` (submit) | ✅ | ✅ | ❌ |
| `PATCH /api/scm/purchase-orders/:id` (cancel) | ✅ | ❌ | ❌ |
| `POST /api/scm/purchase-orders/:id/receive` | ✅ | ✅ | ❌ |
| `GET /api/scm/stock`, `/api/scm/stock/:productId` | ✅ | ✅ | ❌ |
| `GET /api/scm/batches` | ✅ | ✅ | ❌ |
| `GET/POST /api/scm/stock-movements` | ✅ | ✅ | ❌ |
| `GET /api/health` | publik | publik | publik |

---

## 9. Contoh `curl`

```bash
# Login dan simpan cookie
curl -i -c cookies.txt -H "Content-Type: application/json" \
  -d '{"email":"admin@tokosasri.id","password":"Admin123!"}' \
  http://localhost:3000/api/auth/login

# List produk
curl -b cookies.txt "http://localhost:3000/api/products?page=1&pageSize=5"

# Buat produk
curl -b cookies.txt -H "Content-Type: application/json" \
  -d '{"sku":"NGT-003","name":"Nugget Baru","category":"nugget","costPrice":25000,"sellPrice":35000,"unit":"pack","stockQty":10,"minStockQty":3,"isActive":true}' \
  http://localhost:3000/api/products

# Ringkasan dashboard
curl -b cookies.txt http://localhost:3000/api/dashboard/summary

# Logout
curl -b cookies.txt -X POST http://localhost:3000/api/auth/logout
```

---

## 10. Modul SCM (Tahap 2)

Semua endpoint di bawah memakai cookie sesi yang sama, envelope yang sama, dan akses `admin`/`staff`. Endpoint baca mengembalikan `403` untuk `customer`.

### 10.1 Supplier

| Method | Endpoint | Catatan |
| --- | --- | --- |
| GET | `/api/scm/suppliers` | Query: `search`, `status=active|inactive|all`, `page`, `pageSize` |
| POST | `/api/scm/suppliers` | Buat supplier + tautan produk |
| GET | `/api/scm/suppliers/:id` | Detail supplier |
| PATCH | `/api/scm/suppliers/:id` | Update sebagian; `products` mengganti seluruh tautan |

**Body POST/PATCH**

```json
{
  "name": "PT Frozen Nusantara",
  "contactName": "Hendra",
  "phone": "022-555-0101",
  "email": "sales@frozennusantara.co.id",
  "address": "Jl. Industri Raya No. 18",
  "city": "Bandung",
  "paymentTermDays": 30,
  "leadTimeDays": 2,
  "deliveryDays": ["senin", "kamis"],
  "minimumOrder": 1500000,
  "notes": "Kirim pagi",
  "isActive": true,
  "products": [
    { "productId": "prod_id", "supplierSku": null, "lastPrice": 27500, "isPreferred": true }
  ]
}
```

- `code` dibuat otomatis (`SUP-XXXX`), bukan input.
- Nama supplier duplikat (case-insensitive) ditolak `400`.
- Supplier nonaktif tetap muncul di list, tetapi tidak dapat dipilih saat membuat PO.

**Response 200/201** — `SupplierDTO`.

### 10.2 Purchase Order

| Method | Endpoint | Catatan |
| --- | --- | --- |
| GET | `/api/scm/purchase-orders` | Query: `search`, `status`, `supplierId`, `from`, `to`, `page`, `pageSize` |
| POST | `/api/scm/purchase-orders` | Buat PO (`status: draft|ordered`) |
| GET | `/api/scm/purchase-orders/:id` | Detail + item + riwayat receipt + progress |
| PATCH | `/api/scm/purchase-orders/:id` | `{ "action": "submit" | "cancel" }` |
| POST | `/api/scm/purchase-orders/:id/receive` | Goods receipt |

**Body POST**

```json
{
  "supplierId": "sup_id",
  "status": "ordered",
  "expectedDate": "2026-11-29",
  "shippingCost": 75000,
  "notes": "Kirim pagi",
  "items": [
    { "productId": "prod_id", "quantity": 24, "unitCost": 27500 }
  ]
}
```

Aturan:

- Supplier harus aktif dan produk harus terdaftar pada supplier tersebut.
- Satu produk tidak boleh muncul dua kali dalam satu PO.
- Hanya PO `draft` yang bisa di-`submit`; hanya PO `draft`/`ordered` tanpa receipt yang bisa di-`cancel`.
- `cancel` hanya untuk `admin` (`403` untuk `staff`).
- Total PO = subtotal item + biaya kirim. **Belum** menjadi pengeluaran kas sampai barang diterima.

**Body receive**

```json
{
  "receivedAt": "2026-11-27",
  "notes": "Surat jalan SJ-001",
  "items": [
    {
      "purchaseOrderItemId": "po_item_id",
      "quantity": 24,
      "batchNumber": "NGT-20261127",
      "productionDate": "2026-11-20",
      "expiryDate": "2027-05-20"
    }
  ]
}
```

**Response 201 receive**

```json
{
  "success": true,
  "data": {
    "receipt": { "id": "...", "number": "GR-20261127-6FEB13", "totalValue": 660000, "...": "..." },
    "purchaseOrder": { "id": "...", "status": "partially_received", "...": "..." },
    "financialTransactionCode": "TRX-20261127-D86F9F"
  },
  "message": "Penerimaan GR-20261127-6FEB13 tercatat. Stok dan jurnal pembelian diperbarui."
}
```

Efek satu transaksi database:

1. `Product.stockQty` bertambah.
2. `ProductBatch` dibuat (nomor batch, produksi, expiry, sisa).
3. `StockMovement` tipe `in` alasan `purchase_receipt` dibuat.
4. `GoodsReceipt` + item tersimpan; `receivedQty` item PO bertambah.
5. `FinancialTransaction` `type=expense`, `category=purchase`, `source=scm`, `externalRef=<nomor PO>` dibuat.

Penerimaan boleh sebagian. Status PO menjadi `partially_received` atau `received`.

### 10.3 Stok & Batch

| Method | Endpoint | Catatan |
| --- | --- | --- |
| GET | `/api/scm/stock` | Query: `search`, `category`, `status=all|healthy|low|out`, `page`, `pageSize` |
| GET | `/api/scm/stock/:productId` | `{ stock, batches, movements }` untuk satu produk |
| GET | `/api/scm/batches` | Query: `search`, `productId`, `status=all|active|expiring|expired|depleted` |

Status stok dihitung: `out` bila `stockQty <= 0`, `low` bila `stockQty <= minStockQty`, selain itu `healthy`. Batch `expired` bila `expiryDate < hari ini`, `expiring` bila ≤ 30 hari, `depleted` bila sisa 0.

### 10.4 Mutasi Stok

| Method | Endpoint | Catatan |
| --- | --- | --- |
| GET | `/api/scm/stock-movements` | Query: `search`, `productId`, `type`, `reason`, `from`, `to`, `page`, `pageSize` |
| POST | `/api/scm/stock-movements` | Catat masuk/keluar/adjustment |

**Body POST**

```json
{
  "productId": "prod_id",
  "type": "in",
  "quantity": 10,
  "reason": "manual_in",
  "unitCost": 27500,
  "batchNumber": "BATCH-MANUAL-01",
  "productionDate": "2026-11-20",
  "expiryDate": "2027-05-20",
  "note": "Temuan stok gudang"
}
```

Aturan:

- `in`/`out`: `quantity` harus **positif**; service memberi tanda (out menjadi negatif).
- `adjustment`: `quantity` bertanda `+`/`-`, tidak boleh 0.
- Stok tidak boleh menjadi negatif.
- `reason` tersedia: `manual_in`, `manual_out`, `purchase_receipt`, `sale`, `return`, `damage`, `expired`, `adjustment`, `initial_stock`.
- `reason: "purchase_receipt"` **ditolak** di endpoint manual; penerimaan pembelian wajib lewat PO agar jurnal kas ikut tercatat.
- Untuk `out` tanpa `batchId`, sistem memakai **FIFO expiry terdekat** dan memecah mutasi per batch.
- `quantity` pada response/log bertanda: masuk `+`, keluar `-`.

### 10.5 Ringkasan SCM

`GET /api/scm/overview` → `ScmOverview`:

```json
{
  "metrics": {
    "suppliersTotal": 3,
    "suppliersActive": 2,
    "openPurchaseOrders": 1,
    "purchaseValueThisMonth": 1398000,
    "lowStockProducts": 2,
    "outOfStockProducts": 0,
    "expiringBatches": 2,
    "expiredBatches": 1,
    "totalStockValue": 8450000
  },
  "lowStock": ["StockLevelDTO"],
  "expiring": ["BatchDTO"],
  "recentPurchaseOrders": ["PurchaseOrderDTO"],
  "recentMovements": ["StockMovementDTO"]
}
```

---

## 11. Endpoint yang Dicadangkan untuk Tahap Berikutnya

| Tahap | Rencana endpoint | Status |
| --- | --- | --- |
| 2 | `/api/scm/suppliers`, `/api/scm/purchase-orders`, `/api/scm/stock-movements` | ✅ Tersedia |
| 3 | `/api/crm/customers`, `/api/crm/loyalty`, `/api/crm/history` | Belum ada |
| 4 | `/api/payments/checkout`, `/api/payments/webhooks`, `/api/payments/invoices` | Belum ada |

Semua endpoint baru **wajib** memakai envelope, kode error, autentikasi, dan pagination yang sama seperti dokumen ini.
