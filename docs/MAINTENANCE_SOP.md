# Standard Operating Procedure (SOP) Pemeliharaan & Penanganan Insiden

**Dokumen:** SOP Pemeliharaan Operasional SIMREKAP  
**Target:** Tim Pemeliharaan IT & Operations Diskominfo Kota Surabaya  
**Versi:** 1.0 (2026-07-27)  

---

## SOP-01: Penanganan Lupa Password / Reset Akses Admin

### 1. Trigger / Indikator
- Administrator IT tidak dapat login ke Portal Admin (`/admin`).
- Kredensial Admin terindikasi bocor atau perlu dirotasi secara berkala.

### 2. Prosedur Operasional
1. Akses server Linux VPS via SSH dengan akun yang memiliki akses `sudo`.
2. Buka file konfigurasi environment:
   ```bash
   sudo nano /home/simrekap/app/.env
   ```
3. Perbarui variabel password admin dengan password baru yang kuat (minimal 16 karakter, kombinasi huruf besar, kecil, angka, dan simbol):
   ```env
   SIMRP_ADMIN_LOGIN_PASSWORD=PasswordBaruSuperAman2026!
   ```
4. Simpan file (`Ctrl+O`, `Enter`, `Ctrl+X`).
5. Restart service backend Python:
   ```bash
   sudo systemctl restart simrekap-api
   ```
6. Uji coba login di `https://simrekap.surabaya.go.id/admin` dengan password baru.

### 3. Eskalasi
Jika masih tidak bisa login, periksa apakah file `.env.local` ada di folder root aplikasi (karena `.env.local` memiliki prioritas lebih tinggi dibanding `.env`). Hapus atau sesuaikan `.env.local` jika ada.

---

## SOP-02: Pemulihan Basis Data (Database Corruption / Data Loss)

### 1. Trigger / Indikator
- Backend mengembalikan error `sqlite3.DatabaseError: database disk image is malformed`.
- Data transaksi terhapus secara tidak sengaja.

### 2. Prosedur Operasional
1. Hentikan service backend segera untuk mencegah kerusakan data lebih lanjut:
   ```bash
   sudo systemctl stop simrekap-api
   ```
2. Pindah ke direktori runtime database:
   ```bash
   cd /home/simrekap/app/database/runtime
   ```
3. Amankan file database yang rusak untuk analisis teknis:
   ```bash
   mv database.db database_corrupt_$(date +%Y%m%d_%H%M%S).db
   ```
4. Cari file backup terbaru dari folder backup:
   ```bash
   ls -lt /home/simrekap/backups/
   ```
5. Salin file backup terbaru menjadi `database.db`:
   ```bash
   cp /home/simrekap/backups/simrekap_backup_YYYYMMDD_HHMMSS.db /home/simrekap/app/database/runtime/database.db
   ```
6. Pastikan ownership file diset kembali ke user `simrekap`:
   ```bash
   sudo chown simrekap:simrekap /home/simrekap/app/database/runtime/database.db
   ```
7. Jalankan kembali service backend:
   ```bash
   sudo systemctl start simrekap-api
   ```
8. Jalankan smoke test untuk memverifikasi integritas DB:
   ```bash
   python3 /home/simrekap/app/scripts/smoketest.py
   ```

---

## SOP-03: Penambahan Data Kelurahan / Kecamatan Baru

### 1. Trigger / Indikator
- Adanya pemekaran wilayah atau penambahan Kelurahan/Kecamatan baru di Kota Surabaya.

### 2. Prosedur Operasional
1. Buka file pemetaan geografis frontend:
   ```bash
   nano /home/simrekap/app/src/data/geographicData.ts
   ```
2. Tambahkan data Kecamatan atau Kelurahan baru pada konstanta `SURABAYA_KECAMATAN` sesuai struktur ID dan Nama resmi Diskominfo.
3. Re-build frontend React static assets:
   ```bash
   cd /home/simrekap/app
   npm run build
   ```
4. Nginx akan otomatis melayani file `dist/` hasil build baru tanpa perlu me-restart Nginx.
5. (Opsional) Jika perlu menambahkan data wilayah ke database runtime yang sudah berjalan, lakukan INSERT SQL manual ke tabel `kecamatan` dan `kelurahan` menggunakan SQLite CLI:
   ```bash
   sqlite3 /home/simrekap/app/database/runtime/database.db
   ```
   ```sql
   INSERT INTO kelurahan (code, kecamatan_id, name) VALUES ('3578xxx', 10, 'Kelurahan Baru');
   .exit
   ```

---

## SOP-04: Troubleshooting Layanan Tidak Dapat Diakses (Down/Downtime)

### 1. Trigger / Indikator
- Browser menampilkan `502 Bad Gateway`, `504 Gateway Timeout`, atau `Connection Refused`.

### 2. Prosedur Diagnostik
1. Cek status Nginx:
   ```bash
   sudo systemctl status nginx
   ```
   Jika mati, jalankan `sudo systemctl restart nginx`.
2. Cek status Backend Python API:
   ```bash
   sudo systemctl status simrekap-api
   ```
3. Cek log error backend:
   ```bash
   sudo journalctl -u simrekap-api -n 50 --no-pager
   ```
4. Cek port `8000`:
   ```bash
   sudo netstat -tulpn | grep 8000
   ```
5. Jika service backend *failed* akibat port terpakai, kill proses lama lalu restart service:
   ```bash
   sudo systemctl restart simrekap-api
   ```

---

## SOP-05: Penanganan Kebocoran Kredensial (Security Incident Response)

### 1. Trigger / Indikator
- Kredensial admin, token session, atau secret key terindikasi terekspos ke media publik.

### 2. Prosedur Penanganan Darurat
1. Hentikan sementara akses publik atau rotasi secret segera.
2. Edit file `.env` untuk mengganti seluruh secret:
   - Ubah `SIMRP_ADMIN_LOGIN_PASSWORD`
   - Ubah `SIMRP_OTP_SECRET`
3. Hapus seluruh session aktif di database untuk memaksa logout seluruh pengguna (termasuk penyerang):
   ```bash
   sqlite3 /home/simrekap/app/database/runtime/database.db "DELETE FROM sessions;"
   ```
4. Restart service backend:
   ```bash
   sudo systemctl restart simrekap-api
   ```
5. Periksa **Audit Log** di database untuk mengidentifikasi aktivitas mencurigakan selama periode kebocoran:
   ```bash
   sqlite3 /home/simrekap/app/database/runtime/database.db "SELECT * FROM audit_logs ORDER BY id DESC LIMIT 50;"
   ```
6. Buat Laporan Kejadian Insiden Keamanan (Incident Report) untuk dokumentasi internal Diskominfo.
