# Contributing to SIMREKAP

Panduan ini menjaga repository `lustresense/xpcentric-web` tetap rapi, aman, dan mudah dilanjutkan tim teknis.

## Branch dan Alur Kerja

- Branch aktif adalah `main`.
- Sync dengan remote sebelum mulai kerja:

```bash
git fetch xpcentric main
```

- Jangan force-push ke `main`.
- Untuk perubahan besar, gunakan branch kerja terpisah.
- Dokumentasi publik tidak boleh merujuk branch lama seperti `update`.

## Prinsip Perubahan

- Baca file relevan sebelum edit.
- Jaga perubahan kecil dan bisa divalidasi.
- Jangan ubah API prefix `/make-server-32aa5c5c` tanpa rencana migrasi.
- Jangan ubah role hierarchy tanpa keputusan produk.
- Jangan menaruh business logic baru di `server/main.py`.
- Backend domain baru masuk `server/api/*`.
- Schema/migration masuk `server/db/*`.
- Helper runtime masuk `server/services/*`.
- Frontend flow besar dipisah ke folder domain.

## Commit Message

Format:

```text
type(scope): summary
```

Contoh:

```text
docs(handover): add system analysis and database guide
fix(admin): improve role queue contrast
feat(access): add request review queue
```

## Validasi

Frontend berubah:

```bash
npm run build
```

Backend berubah:

```bash
python -m py_compile server/main.py
python -m py_compile server/api/<file>.py
```

Flow besar:

```bash
npm run smoke
```

Sebelum commit:

```bash
git diff --check
git status --short
```

## Security Guardrails

Jangan commit:

- `.env`
- `.env.local`
- `database/runtime/`
- `database/backups/`
- `database/runtime/dev_credentials.txt`
- runtime DB;
- data warga nyata;
- token/password/API key;
- `dist/`, `node_modules/`, `.venv/`.

Sample DB yang boleh masuk Git hanya yang dibuat dari seed bersih dan tidak berisi session/OTP/token.

## Documentation Rules

Jika behavior berubah, update dokumen terkait:

- `README.md`
- `docs/API_REFERENCE.md`
- `docs/ARCHITECTURE.md`
- `docs/DATABASE_SCHEMA.md`
- `docs/DEMO_ACCOUNTS.md`
- `docs/PRODUCTION_GAP_ROADMAP.md`

Dokumen serah-terima berada di `docs/handover/`.

## Review Checklist

- Auth relawan, moderator, admin masih berjalan.
- Register publik tetap role `user`.
- KSH/moderator aktif hanya setelah approval admin.
- Scope wilayah moderator tetap aman.
- API payload cocok dengan `src/types/index.ts`.
- Tidak ada secret dalam diff.
- Dokumentasi sesuai runtime.
