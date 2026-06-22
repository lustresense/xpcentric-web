# Contributing to SIMREKAP

Panduan ini menjaga repository `lustresense/xpcentric-web` tetap rapi, mudah direview, dan aman untuk demo.

## Branch dan Alur Kerja

- Branch aktif repository adalah `main`.
- Untuk pekerjaan kecil yang sudah divalidasi, commit bisa langsung diarahkan ke `main` sesuai kebutuhan demo.
- Untuk pekerjaan besar, gunakan branch pendek dan jelas, misalnya `feat/access-queue`, `fix/admin-contrast`, atau `docs/docker-runbook`.
- Jangan membuat branch lama seperti `update` sebagai rujukan dokumentasi publik. Semua instruksi repo harus mengarah ke `main`.

## Prinsip Perubahan

- Baca file relevan sebelum mengedit.
- Jaga perubahan tetap kecil dan terukur.
- Jangan mengubah API prefix `/make-server-32aa5c5c` tanpa rencana migrasi.
- Jangan mengubah role hierarchy tanpa keputusan produk eksplisit.
- Jangan menumpuk business logic baru di `server/main.py`.
- Backend domain baru masuk ke `server/api/*`, schema/migration ke `server/db/*`, helper runtime ke `server/services/*`.
- Frontend domain besar dipisah ke folder komponen domain, bukan ditumpuk ke `App.tsx`.

## Commit Message

Gunakan format singkat:

```text
type(scope): summary
```

Contoh:

```text
feat(access): add admin request queue
fix(admin): improve dark mode contrast
docs(readme): document docker demo flow
chore(docker): publish simrekap ghcr images
```

## Validasi Wajib

Jika frontend berubah:

```bash
npm run build
```

Jika backend Python berubah:

```bash
python -m py_compile server/main.py
python -m py_compile server/api/<file-yang-diubah>.py
```

Jika flow besar berubah:

```bash
npm run smoke
```

Sebelum commit besar:

```bash
git diff --check
git status --short
```

Untuk Docker demo:

```bash
docker compose build
docker compose up -d
curl http://localhost:7761/make-server-32aa5c5c/health
```

## Security Guardrails

Jangan commit:

- `.env`
- `.env.local`
- `database/runtime/`
- `database/backups/`
- `database/runtime/dev_credentials.txt`
- token, password, API key, atau data warga nyata
- hasil build lokal seperti `dist/`
- dependency lokal seperti `node_modules/` dan `.venv/`

Wajib:

- RBAC ditegakkan di backend.
- Query SQL memakai parameterized query.
- Admin action mencatat audit log jika helper tersedia.
- Aksi penting membuat notification jika helper tersedia.
- Error production tidak membocorkan stack trace atau secret.

## Review Checklist

Sebelum merge/push, cek:

- Auth relawan, moderator, dan admin masih bisa berjalan.
- Register publik tetap membuat role `user`.
- KSH/moderator hanya aktif setelah approval admin melalui flow yang benar.
- Scope wilayah moderator tidak bocor lintas kelurahan/kecamatan.
- API payload masih cocok dengan `src/types/index.ts`.
- Docker image tidak membawa `.env`, database runtime, credential lokal, `.git`, `node_modules`, atau `.venv`.
- Dokumentasi yang terkait perubahan ikut diperbarui.

## Dokumentasi

Dokumen utama:

- `README.md` untuk gambaran project.
- `docs/API_REFERENCE.md` untuk endpoint.
- `docs/SERVER_DOCKER_RUNBOOK.md` untuk server Docker dan tunnel.
- `docs/PRODUCTION_GAP_ROADMAP.md` untuk gap menuju produksi publik.
- `SECURITY.md` untuk kebijakan keamanan.

Jika behavior berubah, update dokumentasi pada commit yang sama.
