# Production Readiness

SIMREKAP saat ini berada pada status **demo-ready prototype & handover-ready**. Sistem sudah cukup untuk demonstrasi, evaluasi teknis, dan handover pengembangan ke Diskominfo Kota Surabaya, tetapi belum boleh diklaim siap produksi publik seluruh warga tanpa menutup gap eksternal dan operasional.

## Ready for Demonstration & Handover

- Frontend build lolos dengan `npm run build`.
- Backend dapat dikompilasi dengan `python -m py_compile server/main.py`.
- Smoke test mencakup auth, event, report, certificate, reward, dan notification (PASS 59/59).
- RBAC diterapkan server-side.
- Scope wilayah moderator diterapkan di backend.
- Portal Akses Petugas `/access` mendukung approval role KSH/moderator.
- Admin dashboard mendukung review data dan kontrol operasional.
- Manual deployment Linux VPS (Systemd + Nginx) tersedia di `docs/DEPLOYMENT_MANUAL_DISKOMINFO.md`.
- Sample SQLite DB tersedia untuk referensi/demo.
- Schema SQL, ERD Mermaid visual, dan data dictionary tersedia.
- Dokumen SPBE lengkap (BAST template, Credential template, User Manuals, Maintenance SOP, ADR, Known Issues).

## Required Before Public Production

- HTTPS reverse proxy dengan domain resmi Diskominfo (`simrekap.surabaya.go.id`).
- Credential admin kuat dan rotasi credential demo.
- `SIMRP_ENABLE_DEMO_SEED=false` untuk data warga nyata.
- CORS allowlist ketat (`SIMRP_ALLOWED_ORIGINS`).
- Backup/restore rutin dan diuji (cron job).
- Monitoring, log rotation, alerting, dan incident procedure (SOP).
- Provider OTP/identity resmi jika verifikasi nomor/akun diwajibkan.
- Review legal/privacy/retention untuk data warga.
- Database managed jika traffic dan data meningkat.
- Integrasi GoBis resmi jika voucher menjadi benefit nyata.
- Tanda tangan digital resmi jika sertifikat harus punya kekuatan legal-formal.

## Final Validation Checklist

```bash
npm install
npm run build
python -m py_compile server/main.py
SIMRP_SMOKE_BASE=http://127.0.0.1:8000/make-server-32aa5c5c python scripts/smoketest.py
git diff --check
```

## Known Prototype Boundaries

- Forgot password self-service belum tersedia; recovery diarahkan ke admin verification via SOP-01.
- OTP masih provider-ready/dev-mode.
- Voucher GoBis masih simulasi.
- Sertifikat belum memakai tanda tangan digital resmi.
- SQLite aktif untuk prototype/KP/demo.
- Sample DB adalah data demo sanitized, bukan database production.

## Handover Status

Untuk serah-terima ke Diskominfo, status yang tepat:

```text
Demo-ready prototype with documented handover package, SPBE compliance docs, and production gap roadmap.
```

Kalimat yang harus dihindari:

```text
Production-ready untuk seluruh warga tanpa gap.
```
