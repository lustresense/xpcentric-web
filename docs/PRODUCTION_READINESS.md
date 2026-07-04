# Production Readiness

SIMREKAP saat ini berada pada status **demo-ready prototype**. Sistem sudah cukup untuk demonstrasi, evaluasi teknis, dan handover pengembangan, tetapi belum boleh diklaim siap produksi publik seluruh warga tanpa menutup gap eksternal dan operasional.

## Ready for Demonstration

- Frontend build lolos dengan `npm run build`.
- Backend dapat dikompilasi dengan `python -m py_compile server/main.py`.
- Smoke test mencakup auth, event, report, certificate, reward, dan notification.
- RBAC diterapkan server-side.
- Scope wilayah moderator diterapkan di backend.
- Portal Akses Petugas `/access` mendukung approval role KSH/moderator.
- Admin dashboard mendukung review data dan kontrol operasional.
- Docker Compose demo tersedia dengan service `web` dan `api`.
- Sample SQLite DB tersedia untuk referensi/demo.
- Schema SQL dan data dictionary tersedia.
- Production gap terdokumentasi.

## Required Before Public Production

- HTTPS reverse proxy dengan domain resmi.
- Credential admin kuat dan rotasi credential demo.
- `SIMRP_ENABLE_DEMO_SEED=false` untuk data warga nyata.
- CORS allowlist ketat.
- Backup/restore rutin dan diuji.
- Monitoring, log rotation, alerting, dan incident procedure.
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
npm run smoke
docker compose build
docker compose up -d
curl http://localhost:7761/make-server-32aa5c5c/health
git diff --check
```

## Known Prototype Boundaries

- Forgot password self-service belum tersedia; recovery diarahkan ke admin verification.
- OTP masih provider-ready/dev-mode.
- Voucher GoBis masih simulasi.
- Sertifikat belum memakai tanda tangan digital resmi.
- SQLite aktif untuk prototype/KP/demo.
- Docker/GHCR/tunnel adalah paket demo, bukan final hosting publik.
- Sample DB adalah data demo sanitized, bukan database production.

## Handover Status

Untuk serah-terima, status yang tepat:

```text
Demo-ready prototype with documented handover package and production gap roadmap.
```

Kalimat yang harus dihindari:

```text
Production-ready untuk seluruh warga tanpa gap.
```
