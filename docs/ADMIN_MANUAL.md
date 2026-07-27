# Panduan Pengguna: Admin Administrator System

**Aplikasi:** SIMREKAP (Sistem Informasi Manajemen Relawan Kampung Pancasila)  
**Target Pengguna:** Tim Administrator IT Diskominfo Kota Surabaya  

---

## 1. Akses Portal Admin (`/admin`)

1. Akses alamat web SIMREKAP di `/admin` (misal: `https://simrekap.surabaya.go.id/admin`).
2. Masukkan **Username Admin** dan **Password Admin** (sesuai konfigurasi `SIMRP_ADMIN_LOGIN_USERNAME` dan `SIMRP_ADMIN_LOGIN_PASSWORD` pada `.env`).
3. Klik **Login Portal Admin**.
4. Setelah berhasil, Anda akan masuk ke **Database-Style Admin Console**.

---

## 2. Mengelola Pengajuan Akses Petugas (Access Requests Queue)

Pengajuan peran dari Warga/Relawan untuk menjadi **KSH**, **Moderator T1**, atau **Moderator T2** tidak aktif otomatis, melainkan harus ditinjau oleh Admin.

1. Di Dashboard Admin, buka tab **Pengajuan Akses (Access Requests)**.
2. Filter antrean berdasarkan status `Pending`.
3. Klik pada baris pengajuan untuk membaca:
   - Nama & Email Pemohon
   - Peran Saat Ini vs Peran yang Diajukan
   - Wilayah Tugas (Kecamatan / Kelurahan)
   - Jabatan & Alasan Pengajuan
4. **Tindakan Admin:**
   - **Approve:** Klik **Setujui Pengajuan**. Sistem secara server-side akan memperbarui `role_code`, `moderator_tier`, `tier2_badge` (lurah/camat), dan pemetaan wilayah user di database. Audit log dan notifikasi dikirim ke pemohon.
   - **Reject:** Klik **Tolak Pengajuan** dan masukkan catatan alasan penolakan.

---

## 3. Manajemen Pengguna (Users Management)

1. Buka tab **Pengguna (Users)**.
2. Fitur pencarian & filter:
   - **Cari (`q`):** Ketik nama atau email pengguna.
   - **Filter Peran:** Filter pengguna berdasarkan `user`, `ksh`, `moderator_t1`, `moderator_t2`, atau `admin`.
   - **Filter Wilayah:** Filter berdasarkan Kecamatan / Kelurahan.
3. Detail Pengguna: Klik ikon mata/detail untuk melihat total XP, daftar badge, status verifikasi email/HP, dan riwayat partisipasi.
4. **Penetapan Peran Langsung (Assign Role):** Admin dapat mengubah peran pengguna secara langsung jika diperlukan melalui form *Role Assignment*.

---

## 4. Pemantauan & Verifikasi Laporan (Reports Audit)

1. Buka tab **Laporan Kegiatan (Reports)**.
2. Admin dapat melihat seluruh laporan kegiatan dari semua kelurahan/kecamatan se-Kota Surabaya.
3. Admin memiliki hak penimpaan (override) untuk memverifikasi atau menolak laporan jika Lurah/Camat berhalangan.

---

## 5. Meninjau Pengajuan Mitra Kolaborasi (Collaboration Requests)

1. Buka tab **Mitra Kolaborasi (Collaboration)**.
2. Daftar pengajuan dukungan dari pihak ketiga/mitra publik (seperti bantuan dana, konsumsi, atau peralatan) akan masuk di menu ini.
3. Admin dapat meninjau profil organisasi, jenis bantuan, dan wilayah kontribusi.
4. Klik **Approve** untuk menyetujui kemitraan atau **Reject** jika pengajuan tidak valid.

---

## 6. Penyesuaian Poin & Badge Sementara (Temporary Adjustments)

Dalam kondisi khusus (misal: pemberian apresiasi khusus acara Balai Kota):

1. Buka tab **Penyesuaian Poin (Temporary Adjustments)**.
2. Pilih pengguna target.
3. Pilih jenis penyesuaian: `points`, `badge`, atau `role`.
4. Isi nilai penyesuaian, alasan formal, dan tanggal kedaluwarsa adjustment.
5. Klik **Terapkan Adjustment**. Seluruh tindakan ini tercatat di **Audit Log**.

---

## 7. Memeriksa Audit Log System (Audit Trail)

1. Buka tab **Audit Log**.
2. Audit log mencatat setiap tindakan penting yang dilakukan oleh Admin dan Moderator (seperti persetujuan akses, penolakan laporan, atau perubahan role).
3. Log mencantumkan ID Aktor, Aksi, Tipe Entitas, Payload JSON, dan Waktu Eksekusi (*timestamp UTC*).

---

## 8. Mengganti Kredensial Admin

Untuk mengganti username atau password admin:
1. Akses server VPS melalui SSH.
2. Edit file `.env`:
   ```bash
   nano /home/simrekap/app/.env
   ```
3. Ubah nilai `SIMRP_ADMIN_LOGIN_USERNAME` dan `SIMRP_ADMIN_LOGIN_PASSWORD`.
4. Restart service backend:
   ```bash
   sudo systemctl restart simrekap-api
   ```
