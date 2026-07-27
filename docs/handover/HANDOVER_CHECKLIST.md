# Handover Checklist (SPBE Diskominfo)

Checklist ini digunakan saat repository SIMREKAP diserah-terimakan secara resmi ke tim teknis Diskominfo Kota Surabaya.

## 1. Kode Sumber & Repository

- [ ] Repository aktif adalah `lustresense/xpcentric-web`.
- [ ] Branch aktif adalah `main`.
- [ ] `README.md` utama telah dibaca dan dipahami.
- [ ] `docs/README.md` telah dibaca sebagai indeks dokumentasi lengkap.
- [ ] File `.env.example` tersedia dengan penjelasan konfigurasi lengkap.
- [ ] Kredensial lokal, `.env`, runtime DB (`database/runtime/`), dan file log **TIDAK** ikut ter-commit ke Git.
- [ ] Seluruh sisa file Docker internal telah dibersihkan.

## 2. Dokumentasi SPBE & Diátaxis

- [ ] `docs/DEPLOYMENT_MANUAL_DISKOMINFO.md` (Panduan Deployment VPS Ubuntu + Systemd + Nginx).
- [ ] `docs/USER_MANUAL_RELAWAN.md` (Panduan Pengguna Warga/Relawan).
- [ ] `docs/USER_MANUAL_KSH_LURAH.md` (Panduan Petugas KSH, Lurah, & Camat).
- [ ] `docs/ADMIN_MANUAL.md` (Panduan Administrator System /admin).
- [ ] `docs/MAINTENANCE_SOP.md` (SOP Pemeliharaan & Penanganan Insiden).
- [ ] `docs/CREDENTIAL_HANDOVER_TEMPLATE.md` (Form Penyerahan Kredensial Akses).
- [ ] `docs/handover/BERITA_ACARA_SERAH_TERIMA_TEMPLATE.md` (Template BAST Resmi SPBE).
- [ ] `docs/ADR/001-why-threading-http-server-and-sqlite.md` (Architecture Decision Record).
- [ ] `docs/ERD_Mermaid.md` (Diagram Visual ERD & Data Dictionary).
- [ ] `docs/KNOWN_ISSUES_AND_TECH_DEBT.md` (Known Issues, Tech Debt & Risk Register).
- [ ] `docs/AUDIT_REPORT_OPUS.md` (Laporan Audit 360° 8-Pilar).

## 3. Setup & Pengujian Lokal

- [ ] Node.js (v20 LTS) dan Python (v3.11+) terpasang.
- [ ] `npm install` berjalan tanpa error.
- [ ] `npm run dev` berhasil menjalankan backend Python (`:8000`) dan Vite frontend (`:5173`).
- [ ] `python -m py_compile server/main.py` berhasil tanpa syntax error.
- [ ] `npm run build` berhasil menghasilkan bundle static di `dist/`.
- [ ] Backend smoke test (`python scripts/smoketest.py`) menunjukkan **PASS 59/59**.

## 4. Basis Data & Skema

- [ ] `docs/DATABASE_SCHEMA.md` dan `docs/ERD_Mermaid.md` telah ditinjau.
- [ ] `database/schema/simrekap_schema.sql` tersedia sebagai acuan skema SQL.
- [ ] `database/sample/simrekap_demo.sqlite` dapat dibuka sebagai sampel database bersih.
- [ ] Tim memahami bahwa database runtime asli tidak di-commit dan dibuat baru saat deployment.

## 5. Alur Alih Keterampilan (Demo Flow Validation)

- [ ] Login relawan demo dan registrasi relawan baru.
- [ ] Pengajuan akses petugas KSH/moderator via `/access`.
- [ ] Approval/rejection pengajuan akses di Portal Admin (`/admin`).
- [ ] Pembuatan draft event, persetujuan (approve), dan publikasi (publish).
- [ ] Pendaftaran event (join) dan pencatatan presensi (attendance).
- [ ] Penyelesaian event (complete) dan pengiriman laporan (submit report).
- [ ] Verifikasi laporan oleh Lurah/Camat (XP, sertifikat, dan notifikasi otomatis).
- [ ] Pratinjau dan unduh sertifikat digital apresiasi.
- [ ] Penukaran voucher apresiasi demo.

## 6. Keamanan & Kepatuhan Production

- [ ] `SECURITY.md` dan `docs/handover/SECURITY_RATIONALE.md` telah ditinjau.
- [ ] Password admin default telah diganti dengan password unik & kuat di `.env`.
- [ ] Seed data demo (`SIMRP_ENABLE_DEMO_SEED`) dimatikan untuk penggunaan data warga nyata.
- [ ] Provider OTP `dev` dimatikan (`SIMRP_OTP_PROVIDER=disabled`) sebelum provider resmi terpasang.
- [ ] Script backup otomatis (`scripts/backup_database.py`) atau cron backup telah dikonfigurasi.
- [ ] Review privasi data & UU PDP (`docs/PRIVACY_AND_DATA_GOVERNANCE.md`) telah dibaca.
