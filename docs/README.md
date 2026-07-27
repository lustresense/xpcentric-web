# SIMREKAP Documentation

Folder ini berisi dokumentasi publik untuk serah-terima, onboarding teknis, operasi produksi, dan pengembangan lanjutan SIMREKAP ke Diskominfo Kota Surabaya.

## Entry Point

- [Root README](../README.md) — guidebook utama project.
- [Handover Checklist](handover/HANDOVER_CHECKLIST.md) — checklist serah-terima ke tim teknis Diskominfo.
- [Berita Acara Serah Terima Template](handover/BERITA_ACARA_SERAH_TERIMA_TEMPLATE.md) — dokumen legal BAST SPBE.

## Panduan Pengguna (User Manuals)

- [User Manual Relawan](USER_MANUAL_RELAWAN.md) — panduan penggunaan untuk warga/relawan.
- [User Manual KSH & Lurah/Camat](USER_MANUAL_KSH_LURAH.md) — panduan untuk petugas lapangan dan verifikator wilayah.
- [Admin System Manual](ADMIN_MANUAL.md) — panduan operasional portal admin IT.

## Operasional & Deployment Diskominfo

- [Deployment Manual Diskominfo](DEPLOYMENT_MANUAL_DISKOMINFO.md) — panduan deployment VPS Linux (Ubuntu + Systemd + Nginx).
- [Maintenance SOP](MAINTENANCE_SOP.md) — Prosedur Operasional Standar penanganan insiden dan perawatan.
- [Credential Handover Template](CREDENTIAL_HANDOVER_TEMPLATE.md) — template penyerahan kredensial terstruktur.
- [Operations Runbook](OPERATIONS_RUNBOOK.md) — panduan pengoperasian teknis & troubleshooting.
- [Account Recovery Runbook](ACCOUNT_RECOVERY_RUNBOOK.md) — prosedur recovery akun manual.
- [Deployment Guide](DEPLOYMENT.md) — referensi deployment umum.

## Analisis, Arsitektur & Database

- [System Analysis](handover/SYSTEM_ANALYSIS.md) — analisis kebutuhan, aktor, boundary.
- [Use Cases](handover/USE_CASES.md) — 14 use case lengkap per aktor.
- [Architecture](ARCHITECTURE.md) — arsitektur teknis sistem.
- [ADR 001: ThreadingHTTPServer & SQLite](ADR/001-why-threading-http-server-and-sqlite.md) — Architecture Decision Record.
- [Database Schema & Data Dictionary](DATABASE_SCHEMA.md) — deskripsi skema database.
- [ERD Mermaid Diagram](ERD_Mermaid.md) — diagram ERD visual lengkap seluruh kolom & constraint.
- [Database Migration Notes](DATABASE_MIGRATION_NOTES.md) — panduan migrasi ke Postgres/MySQL.

## API & Standar Pengembang

- [API Reference](API_REFERENCE.md) — referensi endpoint aktif (`/make-server-32aa5c5c`).
- [Development Procedure](handover/DEVELOPMENT_PROCEDURE.md) — standar prosedur pengembangan.
- [Maintainer Guide](MAINTAINER_GUIDE.md) — aturan maintainer.
- [Contributor Setup](SETUP.md) — panduan setup environment pengembang.

## Keamanan, Risk & Roadmap

- [Security Rationale](handover/SECURITY_RATIONALE.md) — pertimbangan keputusan keamanan.
- [Security Policy](../SECURITY.md) — kebijakan keamanan repository.
- [Known Issues & Technical Debt](KNOWN_ISSUES_AND_TECH_DEBT.md) — register batasan & tech debt.
- [Privacy and Data Governance](PRIVACY_AND_DATA_GOVERNANCE.md) — tata kelola privasi & UU PDP.
- [Production Readiness](PRODUCTION_READINESS.md) — status kesiapan produksi.
- [Production Gap Roadmap](PRODUCTION_GAP_ROADMAP.md) — peta jalan pemenuhan gap produksi.

## Audit & Laporan

- [Audit Report OPUS](AUDIT_REPORT_OPUS.md) — Laporan Audit 360° 8-Pilar Serah-Terima.
- [UX Pilot Audit](UX_PILOT_AUDIT.md) — catatan audit UX pilot.

## Aturan Dokumentasi

- Dokumentasi wajib mencerminkan runtime aktual di `server/`, `src/`, dan `database/`.
- Jangan commit kredensial asli, token session, atau data pribadi warga.
- Runtime database tidak di-commit ke Git; gunakan sampel sanitized di `database/sample/`.
