# Analisis Sistem SIMREKAP

Dokumen ini menjelaskan kebutuhan, aktor, ruang lingkup, dan batas prototype SIMREKAP sebagai bahan serah-terima teknis.

## Latar Belakang

Pengelolaan kegiatan relawan kampung membutuhkan data yang konsisten: siapa relawannya, kegiatan apa yang tersedia, siapa yang hadir, laporan apa yang masuk, siapa yang memverifikasi, dan bagaimana kontribusi tersebut direkap. SIMREKAP dibuat sebagai prototype untuk menyatukan alur tersebut dalam satu aplikasi web.

## Permasalahan

1. Data kegiatan dan relawan sulit direkap jika tersebar di banyak media.
2. Verifikasi laporan membutuhkan alur role dan wilayah yang jelas.
3. Apresiasi relawan membutuhkan bukti kontribusi seperti XP, sertifikat, dan reward.
4. Admin membutuhkan dashboard yang bisa dipakai untuk pencarian, filtering, dan review data.
5. Tim pengembang lanjutan membutuhkan dokumentasi teknis agar project dapat dikembangkan tanpa membaca seluruh kode dari awal.

## Tujuan Sistem

- Menyediakan platform prototype untuk manajemen relawan Kampung Pancasila.
- Mendukung event lifecycle dari draft sampai completed.
- Mendukung report lifecycle dari pending sampai verified/rejected.
- Menghasilkan XP, leaderboard, sertifikat digital, dan voucher demo.
- Menyediakan approval akses petugas agar role KSH/moderator tidak aktif otomatis.
- Menyediakan referensi teknis untuk tim IT yang akan melanjutkan pengembangan.

## Aktor Sistem

| Aktor | Kebutuhan utama |
|---|---|
| Relawan | Mendaftar, login, join event, submit laporan, melihat XP/sertifikat/reward |
| KSH | Mengelola attendance dan menyelesaikan event |
| Moderator T1 | Membuat draft event sesuai wilayah |
| Moderator T2 | Approve event dan verify laporan sesuai scope wilayah |
| Moderator T3 | Role perluasan untuk kebutuhan lanjutan |
| Admin | Mengelola data, role, request akses, audit, dan temporary adjustment |
| Mitra | Mengajukan dukungan melalui form kolaborasi |
| Tim IT | Menjalankan, memvalidasi, memigrasikan, dan mengembangkan sistem |

## Boundary Sistem

Termasuk dalam prototype:

- Web frontend React.
- Backend Python HTTP server.
- SQLite runtime database.
- Auth email/password.
- OTP mode development/provider-ready.
- Role-based access control server-side.
- Event, report, XP, certificate, reward, notification, audit log.
- Manual deployment Linux VPS (Systemd + Nginx).

Tidak termasuk produksi final:

- Provider OTP/SMS resmi.
- SSO/identity provider pemerintah.
- Integrasi API GoBis resmi.
- Digital signature legal-formal untuk sertifikat.
- Monitoring dan alerting produksi.
- Database managed untuk beban publik besar.

## Asumsi

- Relawan publik selalu masuk sebagai `user`.
- Role KSH/moderator aktif hanya setelah approval admin.
- Scope wilayah menjadi batas utama otorisasi moderator.
- Voucher dan sertifikat pada prototype bersifat simulasi/demonstrasi.
- SQLite dipakai untuk demo dan KP; migrasi database disiapkan sebagai roadmap.

## Indikator Keberhasilan Demo

- User baru bisa register dan login sebagai relawan.
- Relawan bisa mengajukan akses KSH/moderator.
- Admin bisa approve/reject pengajuan akses.
- Event bisa dibuat, di-approve, dipublish, diikuti, dan diselesaikan.
- Laporan bisa diverifikasi dan menghasilkan XP/sertifikat.
- Aplikasi dapat dijalankan secara lokal maupun di server Linux VPS dengan Node.js dan Python.
