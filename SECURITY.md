# Security Policy

SIMREKAP adalah prototype Kerja Praktik, tetapi repository harus diperlakukan seperti codebase produksi karena menyentuh auth, role, laporan, sertifikat, reward, dan data pengguna.

## Supported Version

Security fixes ditargetkan ke branch aktif:

```text
lustresense/xpcentric-web:main
```

Branch lama atau mirror lain tidak dianggap sumber deployment utama kecuali disebutkan eksplisit oleh maintainer.

## Reporting Security Issues

Jangan membuka detail kerentanan lewat public issue, screenshot publik, atau commit message. Laporkan langsung ke maintainer proyek dengan informasi berikut:

- endpoint atau screen yang terdampak;
- langkah reproduksi;
- dampak terhadap auth, session, RBAC, database write, sertifikat, reward, atau data pengguna;
- expected behavior dan actual behavior;
- apakah butuh rotasi credential atau reset session.

## Secret Handling

Jangan commit:

- `.env`
- `.env.local`
- `database/runtime/`
- `database/backups/`
- `database/runtime/dev_credentials.txt`
- database SQLite runtime
- API key, token, password, cookie, atau data warga nyata

Gunakan `.env.example` untuk placeholder. Credential demo development boleh dibuat otomatis oleh backend, tetapi file hasilnya tetap lokal dan harus di-ignore.

## Security Baseline

Implementasi saat ini mencakup:

- password hashing PBKDF2-HMAC-SHA256;
- bearer session token yang disimpan server-side;
- server-side RBAC;
- scope wilayah untuk aksi moderator;
- parameterized SQL;
- batas ukuran request body;
- rate limiting untuk auth dan mutation;
- CORS allowlist;
- security headers;
- audit log untuk aksi penting;
- notification untuk perubahan status penting;
- download sertifikat memakai Authorization header, bukan token di URL;
- Portal Akses Petugas dengan approval admin sebelum role KSH/moderator aktif.

## Production-Like Deployment Checklist

Sebelum demo publik atau deployment yang bisa diakses jaringan luar:

```bash
npm run build
python -m py_compile server/main.py
npm run smoke
docker compose build
docker compose up -d
curl http://localhost:7761/make-server-32aa5c5c/health
```

Pastikan:

- `SIMRP_ENV=production` untuk deployment non-lokal.
- Admin password kuat dan tidak memakai credential demo.
- `SIMRP_ALLOWED_ORIGINS` diisi domain yang benar.
- Demo seed hanya aktif jika memang untuk demo.
- Database runtime berada di volume persisten.
- Backup database diuji restore-nya.
- Cloudflare Quick Tunnel hanya dipakai sebagai fallback demo, bukan arsitektur produksi final.

## Known Prototype Boundaries

SIMREKAP belum boleh diklaim siap produksi publik penuh sebelum gap berikut ditutup:

- OTP/SMS atau identity verification resmi.
- Monitoring, log retention, alerting, dan incident response.
- Review legal/privacy untuk data warga.
- Database server managed jika volume pengguna besar.
- Integrasi resmi GoBis jika voucher menjadi transaksi nyata.
- Sertifikat dengan tanda tangan digital/legal formal jika diperlukan.

Detail roadmap ada di `docs/PRODUCTION_GAP_ROADMAP.md`.

## Incident Response

Jika credential bocor:

1. Hapus credential dari repository atau media publik.
2. Rotasi password atau token terkait.
3. Invalidate session jika perlu.
4. Cek audit log untuk aktivitas tidak wajar.
5. Update dokumentasi mitigasi jika penyebabnya berasal dari workflow.

Jika database runtime bocor:

1. Anggap semua data di database tersebut kompromi.
2. Hentikan container terkait.
3. Rotasi credential admin/demo.
4. Restore dari backup bersih jika tersedia.
5. Jangan commit database runtime ke Git.
