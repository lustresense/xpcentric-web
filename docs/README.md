# SIMREKAP Documentation

Folder ini berisi dokumentasi publik untuk serah-terima, onboarding teknis, operasi demo, dan pengembangan lanjutan.

## Entry Point

- [Root README](../README.md) - guidebook utama project.
- [Handover Checklist](handover/HANDOVER_CHECKLIST.md) - checklist serah-terima ke tim teknis.

## Analisis dan Rancangan

- [System Analysis](handover/SYSTEM_ANALYSIS.md) - kebutuhan, aktor, boundary, asumsi.
- [Use Cases](handover/USE_CASES.md) - use case per aktor.
- [Architecture](ARCHITECTURE.md) - arsitektur frontend, backend, database, dan deployment.
- [Database Schema](DATABASE_SCHEMA.md) - ERD, data dictionary, lifecycle data.
- [Database Migration Notes](DATABASE_MIGRATION_NOTES.md) - panduan migrasi SQLite ke database server.

## Implementasi dan API

- [API Reference](API_REFERENCE.md) - endpoint aktif.
- [Development Procedure](handover/DEVELOPMENT_PROCEDURE.md) - prosedur pengembangan.
- [Maintainer Guide](MAINTAINER_GUIDE.md) - aturan maintainer.
- [Contributor Setup](SETUP.md) - setup developer.

## Demo dan Operasi

- [Demo Accounts](DEMO_ACCOUNTS.md) - akun demo, password policy, skenario demo.
- [Deployment Guide](DEPLOYMENT.md) - deployment lokal/production-like.
- [Server Docker Runbook](SERVER_DOCKER_RUNBOOK.md) - Docker, GHCR, tunnel.
- [Operations Runbook](OPERATIONS_RUNBOOK.md) - health check, backup, troubleshooting.
- [Account Recovery Runbook](ACCOUNT_RECOVERY_RUNBOOK.md) - prosedur recovery akun.

## Security dan Produksi

- [Security Rationale](handover/SECURITY_RATIONALE.md) - alasan keputusan keamanan.
- [Security Policy](../SECURITY.md) - policy keamanan repository.
- [Privacy and Data Governance](PRIVACY_AND_DATA_GOVERNANCE.md) - data governance.
- [Production Readiness](PRODUCTION_READINESS.md) - kesiapan demo/produksi.
- [Production Gap Roadmap](PRODUCTION_GAP_ROADMAP.md) - gap produksi yang belum ditutup.

## Audit UX

- [UX Pilot Audit](UX_PILOT_AUDIT.md) - catatan pilot UX.

## Aturan Dokumentasi

- Dokumentasi harus sesuai runtime aktual di `server/`, `src/`, dan `database/`.
- Jangan tulis credential lokal, token, session, atau data warga nyata.
- Runtime database tidak masuk Git; gunakan sample DB sanitized di `database/sample/`.
- Jika behavior berubah, update dokumen terkait pada commit yang sama.
