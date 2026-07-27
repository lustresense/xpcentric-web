# Known Issues, Technical Debt & Risk Register

**Dokumen:** Register Batasan Teknis, Hutang Teknis, dan Manajemen Risiko  
**Project:** SIMREKAP / `xpcentric-web`  
**Target:** Tim IT & Maintainer Diskominfo Kota Surabaya  

---

## 1. Known Issues (Masalah & Limitasi Teridentifikasi)

| ID | Komponen | Deskripsi Issues | Severity | Workaround / Solusi Saat Ini | Rekomendasi Lanjutan |
|---|---|---|---|---|---|
| KI-01 | Auth / Recovery | Belum ada fitur self-service Lupa Password via Email/OTP. | MEDIUM | Pemulihan password dilakukan manual oleh Admin via SOP-01. | Implementasikan SMTP / Email Gateway Diskominfo & token reset password. |
| KI-02 | Collaboration | Approval pengajuan mitra kolaborasi mencetak log SMTP stub di console backend. | LOW | Notifikasi disimpan ke tabel `notifications` dan `audit_logs`. | Sambungkan fungsi SMTP Python ke mail server resmi Pemkot. |
| KI-03 | Reward System | Penukaran voucher GoBis/Suroboyo Bus menghasilkan kode voucher simulasi. | LOW | Menggunakan generator voucher acak server-side. | Integrasikan API voucher GoBis resmi jika transaksi dijadikan nyata. |
| KI-04 | Testing | Belum ada automated Unit Test suite (pytest / jest) dan E2E test (Playwright). | MEDIUM | Verifikasi kualitas menggunakan `scripts/smoketest.py` (59 API test cases). | Buat unit test suite untuk bisnis logika `services/`. |

---

## 2. Technical Debt Register (Hutang Teknis)

| ID | Area | Deskripsi Tech Debt | Dampak | Prioritas Refactoring |
|---|---|---|---|---|
| TD-01 | Routing Backend | Routing `server/main.py` menggunakan pattern matching string manual. | Penambahan endpoint baru memerlukan registrasi manual di `main.py`. | LOW (Bisa dipindahkan ke FastAPI di masa depan) |
| TD-02 | Database ORM | Menggunakan SQL mentah via `sqlite3` tanpa ORM layer. | Memerlukan ketelitian manual saat membuat query SQL baru. | LOW (Query SQL saat ini sudah aman dengan parameterized inputs) |
| TD-03 | Hardcoded Geo Data | Data kelurahan & kecamatan Surabaya tersimpan di file TS `src/data/geographicData.ts`. | Penambahan wilayah baru membutuhkan re-build frontend. | MEDIUM (Pindahkan ke endpoint API `/geo/options` penuh) |
| TD-04 | Session Storage | Session disimpan di database SQLite (tabel `sessions`). | Mengubah session membutuhkan query DB alih-alih in-memory lookup. | LOW (Cukup untuk beban demo/pilot) |

---

## 3. Risk Register (Top 5 Risk Analysis)

### RISK-01: SQLite File Locking pada Penulisan Paralel Tinggi
- **Likelihood:** Medium | **Impact:** High
- **Deskripsi:** Jika puluhan ribu relawan melakukan submit laporan secara serentak pada menit yang sama, SQLite dapat mengalami error `database is locked`.
- **Mitigasi Saat Ini:** Konfigurasi WAL mode (`journal_mode=WAL`) dan pragma `busy_timeout` 30 detik pada `server/core/config.py`.
- **Rencana Tindak Lanjut:** Migrasi ke PostgreSQL jika pengguna harian melebihi 5.000 user aktif.

### RISK-02: Penyalahgunaan Provider OTP Mode `dev`
- **Likelihood:** Low | **Impact:** High
- **Deskripsi:** Jika `SIMRP_OTP_PROVIDER=dev` tidak sengaja diaktifkan di lingkungan produksi publik, kode OTP akan dikembalikan dalam response JSON.
- **Mitigasi Saat Ini:** Validasi `validate_production_config()` di `server/main.py` akan **refuse to start** jika `SIMRP_ENV=production` dan OTP provider diset ke `dev`.
- **Rencana Tindak Lanjut:** Gunakan `SIMRP_OTP_PROVIDER=disabled` sampai provider SMS/WhatsApp resmi terpasang.

### RISK-03: Ketiadaan Reverse Proxy Rate Limiting di Level IP Publik
- **Likelihood:** Medium | **Impact:** Medium
- **Deskripsi:** Backend memiliki in-memory rate limiter per IP, namun restart backend akan me-reset counter rate limit.
- **Mitigasi Saat Ini:** In-memory sliding window rate limiter di `server/services/rate_limiter.py`.
- **Rencana Tindak Lanjut:** Aktifkan module `limit_req` pada Nginx reverse proxy.

### RISK-04: Kehilangan Data Akibat Disk Failure Tanpa Offsite Backup
- **Likelihood:** Low | **Impact:** Critical
- **Deskripsi:** File `database.db` disimpan di disk lokal VPS. Jika disk VPS mengalami kegagalan hardware, data dapat hilang.
- **Mitigasi Saat Ini:** Script backup harian lokal di `/home/simrekap/backups`.
- **Rencana Tindak Lanjut:** Konfigurasi rsync / cron untuk mengunggah file backup harian ke Object Storage / Backup Server Diskominfo.

### RISK-05: Peniruan Identitas Relawan Tanpa Verifikasi NIK / KTP
- **Likelihood:** Medium | **Impact:** Medium
- **Deskripsi:** Registrasi relawan terbuka publik tanpa validasi NIK otomatis ke Dukcapil.
- **Mitigasi Saat Ini:** Registrasi publik hanya mendapatkan peran `user` (relawan). Peran KSH/Moderator wajib melalui persetujuan manual Admin.
- **Rencana Tindak Lanjut:** Integrasikan SSO / Identitas Kependudukan Digital (IKD) Pemkot Surabaya.
