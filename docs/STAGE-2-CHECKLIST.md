# Checklist Pengujian Tahap 2 — SCM & Inventory

Gunakan checklist ini sebelum menyerahkan Tahap 2 atau memulai Tahap 3. Jalankan dari branch `stage-2/scm-inventory` (atau `main` setelah merge).

Fokus pengujian: **Tahap 1 tidak boleh rusak**, lalu alur SCM supplier → PO → goods receipt → stok/batch → mutasi → jurnal kas.

---

## A. Persiapan & Regresi Tahap 1

- [ ] `npm install` selesai tanpa error.
- [ ] `.env` berisi `AUTH_SECRET` minimal 32 karakter dan `DATABASE_URL="file:./dev.db"`.
- [ ] `npm run setup` selesai: Prisma Client, `db push`, dan seed (termasuk data SCM).
- [ ] `npm run typecheck` lulus tanpa error.
- [ ] `npm run build` lulus tanpa error.
- [ ] `npm start` berjalan dan `/api/health` mengembalikan `stage: 2`.
- [ ] Login admin, staff, dan customer tetap berhasil seperti Tahap 1.
- [ ] Dashboard Tahap 1 tetap menampilkan omzet, HPP, laba, produk, dan transaksi.
- [ ] Master produk, jurnal kas, pengguna, dan portal pelanggan tetap berfungsi.
- [ ] Tidak ada perubahan perilaku pada endpoint Tahap 1 (produk/transaksi/users/auth).

---

## B. Navigasi & Akses SCM

- [ ] Sidebar menampilkan menu **SCM** untuk admin dan staff.
- [ ] `/dashboard/scm` menampilkan ringkasan: supplier aktif, PO berjalan, nilai stok, pembelian bulan ini.
- [ ] Tab SCM (Ringkasan, Supplier, Purchase Order, Stok, Batch, Mutasi) dapat diklik dan aktif sesuai halaman.
- [ ] Customer membuka `/dashboard/scm` → redirect ke `/portal`.
- [ ] Customer `GET /api/scm/overview` → `403 FORBIDDEN`.
- [ ] Staff dapat membuka seluruh halaman SCM.
- [ ] Tampilan responsif: tabel dapat di-scroll horizontal di layar kecil, form tetap terbaca.

---

## C. Supplier

- [ ] `/dashboard/scm/suppliers` menampilkan 3 supplier seed (2 aktif, 1 nonaktif).
- [ ] Pencarian nama/kode/kontak/kota berfungsi.
- [ ] Filter status aktif/nonaktif berfungsi.
- [ ] Tambah supplier baru dengan produk yang disuplai → muncul di daftar.
- [ ] Kode supplier otomatis `SUP-XXXX`.
- [ ] Nama supplier duplikat (beda huruf besar/kecil) ditolak dengan pesan jelas.
- [ ] Pilih beberapa produk + isi harga beli terakhir → tersimpan.
- [ ] Pilih jadwal pengiriman (mis. Senin & Kamis) → badge jadwal tampil.
- [ ] Lead time, termin pembayaran, dan minimum order tersimpan.
- [ ] Edit supplier → perubahan tersimpan.
- [ ] Nonaktifkan supplier lewat ikon power → status `Nonaktif`.
- [ ] Supplier nonaktif **tidak** muncul di pilihan supplier saat membuat PO.

---

## D. Purchase Order

- [ ] `/dashboard/scm/purchase-orders` menampilkan PO seed `SEED-PO-001` (ordered) dan `SEED-PO-002` (draft).
- [ ] Filter status dan pencarian nomor/supplier berfungsi.
- [ ] Buat PO baru: pilih supplier → produk otomatis dibatasi ke produk supplier tersebut.
- [ ] Harga satuan otomatis memakai `lastPrice` supplier atau HPP produk.
- [ ] Estimasi tanggal tiba otomatis mengikuti lead time supplier.
- [ ] Peringatan muncul bila subtotal di bawah minimum order supplier.
- [ ] Produk yang sama tidak bisa dipilih dua kali.
- [ ] Simpan sebagai draft → status `Draft`, belum ada jurnal kas.
- [ ] Buat & kirim PO → status `Dikirim`.
- [ ] Submit PO draft lewat tombol **Kirim ke supplier** berhasil.
- [ ] Staff mencoba membatalkan PO → tombol tidak ada / API `403`.
- [ ] Admin membatalkan PO draft → status `Dibatalkan`.
- [ ] PO yang sudah memiliki penerimaan tidak dapat dibatalkan.
- [ ] Detail PO menampilkan item, sisa pesanan, progres penerimaan, dan riwayat receipt.

---

## E. Goods Receipt (inti integrasi)

Gunakan PO `SEED-PO-001` atau PO baru berstatus `Dikirim`.

- [ ] Klik **Terima barang** → form penerimaan terbuka.
- [ ] Jumlah default = sisa pesanan, bisa diubah untuk penerimaan sebagian.
- [ ] Nomor batch wajib; error muncul bila dikosongkan.
- [ ] Tanggal expiry harus setelah tanggal produksi.
- [ ] Konfirmasi penerimaan → pesan sukses berisi nomor `GR-...` dan kode `TRX-...`.
- [ ] Stok produk bertambah sesuai jumlah diterima (cek menu Stok).
- [ ] Batch baru muncul di menu Batch dengan sisa = jumlah diterima.
- [ ] Mutasi `in` alasan `Penerimaan pembelian` muncul di menu Mutasi.
- [ ] Jurnal kas menampilkan pengeluaran kategori `purchase`, source `scm`, `externalRef` = nomor PO.
- [ ] Nilai pengeluaran = jumlah diterima × harga satuan (bukan total PO bila penerimaan sebagian).
- [ ] Status PO berubah menjadi `Diterima sebagian` atau `Diterima`.
- [ ] Progres penerimaan bertambah sesuai jumlah.
- [ ] Terima sisa PO → status menjadi `Diterima`, `receivedAt` terisi.
- [ ] Mencoba menerima melebihi sisa pesanan → ditolak dengan pesan jelas.
- [ ] Menerima PO draft/batal → ditolak.

---

## F. Stok, Reorder Point, & Batch

- [ ] `/dashboard/scm/stock` menampilkan produk dengan stok, reorder point, status, batch aktif, expiry terdekat, nilai stok.
- [ ] Produk di bawah stok minimum diberi badge **Menipis** (kuning).
- [ ] Produk stok 0 diberi badge **Habis** (merah).
- [ ] Filter status `Menipis`/`Habis`, kategori, dan pencarian berfungsi.
- [ ] Kartu ringkasan (SKU, menipis, habis, nilai persediaan) sesuai data.
- [ ] Klik **Kelola** → detail produk menampilkan stok, nilai, batch, dan 20 mutasi terakhir.
- [ ] `/dashboard/scm/batches` menampilkan batch dengan tanggal produksi, expiry, sisa/masuk, supplier, status.
- [ ] Filter `≤ 30 hari` menampilkan batch mendekati expiry.
- [ ] Filter `Kedaluwarsa` menampilkan batch yang tanggalnya sudah lewat.
- [ ] Batch kedaluwarsa diberi badge merah dan tidak dipakai FIFO.
- [ ] Batch habis (sisa 0) berstatus `Habis`.

---

## G. Mutasi Stok

- [ ] Dari detail stok, catat **barang masuk** dengan batch baru → stok bertambah, batch dibuat, mutasi `in` tercatat.
- [ ] Catat **barang keluar** tanpa memilih batch → sistem memakai FIFO expiry terdekat.
- [ ] Bila jumlah keluar melebihi satu batch, mutasi terpecah dan total stok benar.
- [ ] Pilih batch tertentu saat keluar → batch itu yang berkurang.
- [ ] Catat **stock opname** positif/negatif → stok menyesuaikan, mutasi `adjustment` tercatat.
- [ ] Jumlah 0 ditolak.
- [ ] Mutasi keluar melebihi stok ditolak dengan pesan "stok tidak mencukupi".
- [ ] Alasan `purchase_receipt` tidak tersedia/ditolak di form manual.
- [ ] Setiap mutasi menampilkan stok sebelum → sesudah dan nama pelaku.
- [ ] `/dashboard/scm/stock-movements` menampilkan seluruh mutasi, filter jenis/alasan, dan total masuk/keluar halaman.
- [ ] Filter per produk dari detail stok terbawa ke halaman mutasi.

---

## H. Konsistensi Data & Audit

- [ ] Saldo `Product.stockQty` = total `StockMovement` (masuk − keluar ± adjustment) untuk produk yang diuji.
- [ ] Total sisa `ProductBatch` = `Product.stockQty` untuk produk yang seluruh stoknya berbatch.
- [ ] Tidak ada mutasi dengan stok negatif.
- [ ] Tidak ada penerimaan tanpa jurnal kas, dan tidak ada jurnal pembelian ganda untuk satu receipt.
- [ ] Nomor dokumen unik: `PO-YYYYMMDD-XXXXXX`, `GR-...`, `MOV-...`, `TRX-...`.
- [ ] Menjalankan `npm run db:seed` ulang tidak menggandakan data seed SCM (prefix `SEED-` dibersihkan lebih dulu).

---

## I. Pemeriksaan API (opsional, via curl)

```bash
BASE=http://localhost:3000
curl -c cookies.txt -H 'Content-Type: application/json' \
  -d '{"email":"admin@tokosasri.id","password":"Admin123!"}' \
  "$BASE/api/auth/login"

curl -b cookies.txt "$BASE/api/scm/overview"
curl -b cookies.txt "$BASE/api/scm/suppliers?status=active"
curl -b cookies.txt "$BASE/api/scm/purchase-orders?status=ordered"
curl -b cookies.txt "$BASE/api/scm/stock?status=low"
curl -b cookies.txt "$BASE/api/scm/batches?status=expiring"
curl -b cookies.txt "$BASE/api/scm/stock-movements?type=in"
```

- [ ] Semua response memakai envelope `{ success, data, meta? }`.
- [ ] Filter tidak valid menghasilkan `400`.
- [ ] ID tidak ditemukan menghasilkan `404`.
- [ ] Tanpa cookie menghasilkan `401`.
