# Checklist Pengujian Tahap 1

Gunakan checklist ini sebelum menyerahkan Tahap 1 atau memulai Tahap 2. Jalankan dari branch `stage-1/foundation-auth-erp`.

---

## A. Persiapan Lingkungan

- [ ] `node -v` menunjukkan versi >= 20.9.
- [ ] `npm install` selesai tanpa error.
- [ ] `.env` ada (hasil salin `.env.example`) dan `AUTH_SECRET` minimal 32 karakter.
- [ ] `DATABASE_URL="file:./dev.db"` untuk lokal.
- [ ] `npm run setup` selesai: Prisma Client, database, dan seed.
- [ ] `npm run typecheck` lulus tanpa error.
- [ ] `npm run build` lulus tanpa error.
- [ ] `npm start` (setelah build) atau `npm run dev` berjalan.

---

## B. Autentikasi

- [ ] Buka `/` — landing page tampil, tombol masuk/daftar berfungsi.
- [ ] Buka `/login` — form tampil, tombol akun demo mengisi kredensial.
- [ ] Login admin (`admin@tokosasri.id` / `Admin123!`) berhasil dan diarahkan ke `/dashboard`.
- [ ] Login staff (`staff@tokosasri.id` / `Staff123!`) berhasil dan diarahkan ke `/dashboard`.
- [ ] Login customer (`pelanggan@tokosasri.id` / `Customer123!`) berhasil dan diarahkan ke `/portal`.
- [ ] Password salah menampilkan pesan error, bukan stack trace.
- [ ] Email tidak terdaftar menampilkan pesan yang sama dengan password salah (tidak membocorkan akun).
- [ ] Logout menghapus sesi; membuka `/dashboard` kembali ke `/login`.
- [ ] Registrasi customer baru berhasil, role otomatis `customer`, diarahkan ke `/portal`.
- [ ] Registrasi dengan email yang sama menghasilkan error `409`.
- [ ] Registrasi dengan password < 8 karakter / tanpa angka ditolak.
- [ ] Akses `/dashboard` tanpa login → redirect `/login?next=/dashboard`.
- [ ] Customer membuka `/dashboard` → redirect `/portal`.
- [ ] Admin/staff membuka `/portal` → redirect `/dashboard`.
- [ ] Cookie `tasri_session` memiliki `HttpOnly` dan `SameSite=Lax`.
- [ ] Refresh halaman tetap login (sesi 7 hari).
- [ ] Akun yang dinonaktifkan admin tidak bisa login dan sesi lamanya tidak bisa mengakses API.

---

## C. RBAC & Pengguna

- [ ] Admin melihat menu **Pengguna**; staff tidak.
- [ ] Admin membuka `/dashboard/users` — daftar pengguna tampil.
- [ ] Admin membuat akun staff baru — akun muncul di daftar.
- [ ] Admin mengubah role staff → customer — berhasil.
- [ ] Admin menonaktifkan akun staff — status berubah, staff tidak bisa login.
- [ ] Admin mengaktifkan kembali akun — staff bisa login.
- [ ] Admin tidak bisa menonaktifkan akun sendiri (tombol disabled / error).
- [ ] Admin tidak bisa menurunkan peran akun sendiri.
- [ ] Sistem menolak menonaktifkan/menurunkan admin aktif terakhir.
- [ ] Staff membuka `/dashboard/users` → dialihkan ke `/dashboard`.
- [ ] Staff `GET /api/users` → `403 FORBIDDEN`.
- [ ] Customer `GET /api/products` → `403 FORBIDDEN`.

---

## D. Master Produk

- [ ] `/dashboard/products` menampilkan 8 produk seed.
- [ ] Pencarian nama/SKU berfungsi.
- [ ] Filter kategori dan status berfungsi.
- [ ] Pagination tampil dan navigasi halaman benar.
- [ ] Tambah produk baru dengan data valid → muncul di daftar.
- [ ] SKU duplikat → error `409` dengan pesan jelas.
- [ ] SKU otomatis uppercase.
- [ ] Kategori, satuan, suhu, shelf life, HPP, harga jual, stok, stok minimum tersimpan.
- [ ] Pratinjau margin berubah saat HPP/harga jual diubah.
- [ ] Edit produk → perubahan tersimpan dan langsung terlihat.
- [ ] Nonaktifkan produk → status `Nonaktif`, tidak muncul di pilihan transaksi baru dan portal.
- [ ] Aktifkan kembali produk → muncul lagi.
- [ ] Produk nonaktif tidak bisa dipilih untuk penjualan (API menolak).
- [ ] Harga jual di bawah HPP diizinkan tetapi margin negatif.
- [ ] Form menampilkan error validasi untuk field kosong/tidak valid.

---

## E. Transaksi & Jurnal Kas

- [ ] `/dashboard/transactions` menampilkan transaksi seed.
- [ ] Filter jenis, kategori, tanggal, dan pencarian berfungsi.
- [ ] Catat penjualan: pilih produk, qty, harga satuan → nominal dihitung otomatis.
- [ ] Penjualan tersimpan dengan `unitCost` snapshot dari HPP.
- [ ] Catat pengeluaran operasional → nominal tersimpan.
- [ ] Catat pengeluaran restock (kategori purchase) → tersimpan.
- [ ] Penjualan tanpa produk / qty 0 / harga 0 ditolak `422`.
- [ ] Pengeluaran tanpa nominal ditolak `422`.
- [ ] Kombinasi tidak valid (income+purchase, expense+sales) ditolak.
- [ ] Tanggal masa depan ekstrem ditolak.
- [ ] Staff dapat mencatat transaksi.
- [ ] Staff tidak melihat tombol void; `PATCH` void oleh staff → `403`.
- [ ] Admin dapat void transaksi; status berubah `Dibatalkan` dan nominal dicoret.
- [ ] Transaksi void tidak dihitung di dashboard.
- [ ] Kode transaksi unik berformat `TRX-YYYYMMDD-XXXXXX`.
- [ ] Daftar transaksi menampilkan produk, pembuat, status, dan nominal.

---

## F. Dashboard ERP

- [ ] `/dashboard` menampilkan sapaan user dan periode bulan berjalan.
- [ ] Kartu omzet, laba kotor, pengeluaran, dan produk aktif tampil.
- [ ] Margin dan HPP tampil konsisten.
- [ ] Grafik tren 7 hari tampil (bar).
- [ ] Daftar produk stok menipis tampil dan link ke edit produk.
- [ ] Produk terlaris dan komposisi kategori tampil.
- [ ] Transaksi terbaru tampil (maks. 6).
- [ ] Rekap jurnal kas: pemasukan, HPP, laba kotor, laba bersih.
- [ ] Angka dashboard berubah setelah menambah transaksi baru (refresh).
- [ ] Navigasi sidebar menuju Produk, Transaksi, SCM, CRM, Pembayaran, Pengguna (admin).
- [ ] Sidebar mobile dapat dibuka/ditutup; overlay berfungsi.

---

## G. Placeholder SCM / CRM / Pembayaran

- [ ] `/dashboard/scm` tampil tanpa error, berlabel Tahap 2.
- [ ] `/dashboard/crm` tampil tanpa error, berlabel Tahap 3.
- [ ] `/dashboard/payments` tampil tanpa error, berlabel Tahap 4.
- [ ] Tidak ada tombol/aksi tulis pada placeholder.
- [ ] Kontrak data dan rencana folder ditampilkan.
- [ ] Staff dan admin dapat membuka placeholder; customer tidak.

---

## H. Portal Pelanggan

- [ ] `/portal` menampilkan katalog produk aktif.
- [ ] Filter kategori berfungsi.
- [ ] Harga, satuan, stok, suhu, dan shelf life tampil.
- [ ] Produk nonaktif tidak tampil.
- [ ] Tombol "Pesan" disabled dengan keterangan Tahap 4.
- [ ] Logout dari portal kembali ke `/login`.

---

## I. Kontrak API

- [ ] Semua response sukses memiliki `success: true`.
- [ ] Semua response gagal memiliki `success: false` dan `error.code`.
- [ ] List endpoint mengembalikan `meta` pagination.
- [ ] `GET /api/health` → 200.
- [ ] Tanpa cookie: `GET /api/products` → 401.
- [ ] Role salah: `GET /api/users` oleh staff → 403.
- [ ] Body JSON rusak → 400 dengan pesan valid.
- [ ] Zod error → 422 dengan `details.fieldErrors`.
- [ ] SKU/email duplikat → 409.
- [ ] Resource tidak ada → 404.
- [ ] Tidak ada response yang membocorkan `passwordHash`.

---

## J. UI / UX / Responsif

- [ ] Landing page rapi di desktop dan mobile.
- [ ] Login/register rapi di desktop dan mobile.
- [ ] Tabel dapat di-scroll horizontal pada layar kecil.
- [ ] Form dapat digunakan pada layar 375px.
- [ ] Warna kontras cukup; tombol memiliki focus state.
- [ ] Tidak ada error/warning di console browser saat navigasi utama.
- [ ] Loading state tombol tampil saat submit.
- [ ] Pesan error/sukses jelas dan berbahasa Indonesia.
- [ ] Format Rupiah memakai `Rp` dan pemisah ribuan Indonesia.
- [ ] Tanggal tampil dalam zona WIB.

---

## K. Build & Repositori

- [ ] `npm run typecheck` bersih.
- [ ] `npm run build` sukses.
- [ ] `npm start` menyajikan aplikasi.
- [ ] `.env` tidak ter-commit.
- [ ] `prisma/dev.db` tidak ter-commit.
- [ ] `node_modules`, `.next`, `*.tsbuildinfo` tidak ter-commit.
- [ ] `package-lock.json` ter-commit.
- [ ] README dan docs lengkap.
- [ ] Branch `stage-1/foundation-auth-erp` berisi seluruh perubahan.
- [ ] Push ke GitHub berhasil.

---

## L. Bukti Pengujian Otomatis (opsional)

Jalankan server, lalu uji endpoint dengan `curl`/Postman:

```bash
# 1. Health
curl -i http://localhost:3000/api/health

# 2. Login admin (simpan cookie)
curl -i -c cookies.txt -H "Content-Type: application/json" \
  -d '{"email":"admin@tokosasri.id","password":"Admin123!"}' \
  http://localhost:3000/api/auth/login

# 3. Me
curl -b cookies.txt http://localhost:3000/api/auth/me

# 4. Produk
curl -b cookies.txt "http://localhost:3000/api/products?page=1&pageSize=5"

# 5. Dashboard
curl -b cookies.txt http://localhost:3000/api/dashboard/summary

# 6. Users (admin)
curl -b cookies.txt http://localhost:3000/api/users

# 7. Logout
curl -b cookies.txt -X POST http://localhost:3000/api/auth/logout
```

**Target:** seluruh endpoint mengembalikan status dan envelope sesuai [API_CONTRACT.md](API_CONTRACT.md).

---

## Status Sign-off Tahap 1

| Pemeriksaan | Status |
| --- | --- |
| Typecheck | ✅ |
| Production build | ✅ |
| API smoke test (auth, RBAC, produk, transaksi, dashboard) | ✅ |
| Seed database | ✅ |
| Dokumentasi | ✅ |

Diisi oleh: ____________________  
Tanggal: ____________________  
Catatan: ____________________
