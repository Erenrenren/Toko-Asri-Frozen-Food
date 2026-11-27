# Kontrak API — Tahap 1

Dokumen ini adalah **kontrak resmi** antara frontend Tahap 1 dan seluruh modul Tahap 2–4. Jangan mengubah envelope, nama field, atau arti nilai tanpa koordinasi lintas tahap.

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
    "stage": 1,
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

## 10. Endpoint yang Dicadangkan untuk Tahap Berikutnya

| Tahap | Rencana endpoint | Status |
| --- | --- | --- |
| 2 | `/api/scm/suppliers`, `/api/scm/purchase-orders`, `/api/scm/stock-movements` | Belum ada |
| 3 | `/api/crm/customers`, `/api/crm/loyalty`, `/api/crm/history` | Belum ada |
| 4 | `/api/payments/checkout`, `/api/payments/webhooks`, `/api/payments/invoices` | Belum ada |

Semua endpoint baru **wajib** memakai envelope, kode error, autentikasi, dan pagination yang sama seperti dokumen ini.
