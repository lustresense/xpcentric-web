# Security Policy

SIMREKAP adalah prototype yang menyentuh auth, role, laporan, sertifikat, reward, dan data pengguna. Repository ini diperlakukan seperti codebase production-like agar aman untuk demo dan mudah dilanjutkan tim teknis.

## Supported Version

Security fixes ditargetkan ke:

```text
Repository: lustresense/xpcentric-web
Branch: main
```

## Reporting Security Issues

Jangan membuka detail security issue di public issue, screenshot publik, atau commit message. Laporkan langsung ke maintainer dengan:

- endpoint/screen terdampak;
- langkah reproduksi;
- dampak terhadap auth, session, RBAC, database write, certificate, reward, atau data pengguna;
- expected vs actual behavior;
- kebutuhan rotasi credential/session jika ada.

## Secret Handling

Jangan commit:

- `.env`
- `.env.local`
- `database/runtime/`
- `database/backups/`
- `database/runtime/dev_credentials.txt`
- runtime SQLite database;
- token, password, API key, cookie, atau data warga nyata.

Yang boleh di-commit:

- `.env.example` berisi placeholder.
- `database/sample/simrekap_demo.sqlite` karena dibuat dari seed bersih dan tidak berisi session/OTP/token.
- `database/schema/simrekap_schema.sql` sebagai referensi schema.

## Security Baseline

Implementasi saat ini mencakup:

- PBKDF2-HMAC-SHA256 password hashing;
- bearer session token server-side;
- server-side RBAC;
- moderator scope checks by wilayah;
- parameterized SQL;
- request body limit;
- auth dan mutation rate limiting;
- CORS allowlist;
- security headers;
- audit log untuk aksi penting;
- notification untuk perubahan status penting;
- certificate download memakai Authorization header;
- Portal Akses Petugas dengan admin approval sebelum role KSH/moderator aktif.

## Keputusan Keamanan Prototype

- Register publik hanya membuat relawan.
- KSH/moderator harus melalui approval admin.
- Forgot password self-service belum dibuat karena belum ada identity provider, SMTP/OTP production, atau helpdesk verification resmi.
- Account recovery diarahkan ke prosedur admin verification.
- OTP mode `dev` hanya untuk demo, bukan production.
- Voucher reward masih simulasi sampai ada integrasi resmi.

Rationale lengkap ada di `docs/handover/SECURITY_RATIONALE.md`.

## Production-Like Deployment Checklist

```bash
npm run build
python -m py_compile server/main.py
npm run smoke
curl http://127.0.0.1:8000/make-server-32aa5c5c/health
```

Pastikan:

- `SIMRP_ENV=production` untuk deployment non-demo.
- Admin password kuat.
- Demo seed dimatikan untuk data warga nyata.
- CORS allowlist diset.
- Runtime database berada di volume persisten.
- Backup/restore diuji.
- Tunnel sementara tidak dianggap hosting produksi.

## Prototype Boundaries

Belum production final sampai:

- OTP/identity provider resmi tersedia;
- monitoring dan incident response tersedia;
- review legal/privacy selesai;
- database strategy untuk skala publik ditetapkan;
- GoBis API resmi tersedia jika reward menjadi nyata;
- tanda tangan digital resmi tersedia jika sertifikat butuh status legal formal.

## Incident Response

Jika credential bocor:

1. Hapus dari media publik.
2. Rotasi credential.
3. Invalidate session jika perlu.
4. Cek audit log.
5. Update SOP agar kejadian tidak terulang.

Jika runtime database bocor:

1. Anggap semua data di database kompromi.
2. Hentikan service terkait.
3. Rotasi credential admin/demo.
4. Restore dari backup bersih bila tersedia.
5. Jangan commit runtime DB ke Git.
