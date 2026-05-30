# Contributor Setup Guide - SIMRP

Panduan ini untuk menjalankan SIMRP di laptop lokal. State runtime yang dijelaskan di sini sesuai project per 2026-05-30.

## Quick Start

```bash
npm install
npm run dev
```

Lalu buka:

```text
Frontend: http://localhost:5173
Admin:    http://localhost:5173/admin
API:      http://127.0.0.1:8000/make-server-32aa5c5c
```

`npm run dev` menjalankan dua proses sekaligus:

1. Backend Python dari `server/main.py`.
2. Frontend Vite dari `npm run dev:web`.

Terminal ini harus tetap hidup selama development.

## Prerequisites

Pastikan command berikut tersedia:

```bash
node --version
npm --version
python --version
```

Versi yang disarankan:

- Node.js LTS.
- npm bawaan Node.js.
- Python 3.

Di Windows, jika `python` tidak tersedia, script fallback akan mencoba `py -3`.

## Clone Project

```bash
git clone <LINK_REPO>
cd Figmasimrp
```

Jika project didapat dari ZIP, extract lalu buka terminal di root project.

## Install Dependencies

```bash
npm install
```

Dependency frontend ada di `package.json`. Backend memakai Python stdlib, sehingga tidak membutuhkan Flask/FastAPI/Django.

## Jalankan Development Server

```bash
npm run dev
```

Script ini memakai `scripts/dev-local.mjs`, yang:

- memuat `.env.local` dan `.env` jika ada;
- menjalankan backend `server/main.py`;
- menjalankan Vite melalui `npm run dev:web`;
- menghentikan backend saat proses Vite berhenti.

Command terpisah:

```bash
npm run api       # backend saja
npm run dev:web   # frontend saja
npm run build     # build production frontend
python smoketest.py
```

## Environment Lokal

Environment opsional bisa disimpan di `.env.local`.

```bash
cp .env.example .env.local
```

Catatan penting:

- Jangan commit `.env.local`.
- Jika `.env.example` disalin apa adanya, `SIMRP_ENABLE_DEMO_SEED=false`.
- Jika ingin akun demo lengkap, set `SIMRP_ENABLE_DEMO_SEED=true`.
- Jika password admin/demo tidak diisi pada development, backend akan membuat password acak dan menulisnya ke `database/runtime/dev_credentials.txt`.

Env yang paling sering dipakai:

| Env | Fungsi |
|---|---|
| `SIMRP_DB_PATH` | Path SQLite runtime, default `database/runtime/database.db` |
| `SIMRP_ADMIN_LOGIN_USERNAME` | Username halaman `/admin`, default dev `admin` |
| `SIMRP_ADMIN_LOGIN_PASSWORD` | Password portal admin |
| `SIMRP_ENABLE_DEMO_SEED` | Aktifkan/nonaktifkan seed demo |
| `SIMRP_DEMO_PASSWORD` | Password akun demo non-admin |
| `SIMRP_SEED_ADMIN_PASSWORD` | Password bootstrap akun admin DB |
| `VITE_API_BASE_URL` | Base URL API untuk frontend |

## Demo Accounts

Lihat `DEMO_ACCOUNTS.md` untuk daftar akun lengkap.

Ringkas:

| Role | Login |
|---|---|
| Admin portal | `/admin`, username default `admin` |
| Relawan | `relawan.demo@simrp.app` |
| KSH | `ksh.demo@simrp.app` |
| ASN Tier 1 | `moderator1.demo@simrp.app` |
| Lurah Tier 2 | `moderator2.demo@simrp.app` |
| Camat Tier 2 | `moderator2.camat@simrp.app` |
| Moderator Tier 3 | `moderator3.demo@simrp.app` |

Password:

- Gunakan `SIMRP_DEMO_PASSWORD` jika sudah diset.
- Jika tidak diset, baca `database/runtime/dev_credentials.txt`.

## Database Runtime

Default database:

```text
database/runtime/database.db
```

Database dibuat otomatis saat backend start. Jika ingin reset data lokal:

```powershell
Remove-Item -Recurse -Force database\runtime
npm run dev
```

Di Linux/Mac:

```bash
rm -rf database/runtime
npm run dev
```

Jangan commit file runtime database.

## Helper Script Windows

Cek entrypoint backend:

```bat
start_server.bat --check
```

Jalankan backend saja:

```bat
start_server.bat
```

Cek konfigurasi backup:

```bat
backup_database.bat --check
```

Buat backup database:

```bat
backup_database.bat
```

Backup default disimpan di:

```text
database/backups/
```

Path database dan backup bisa dioverride:

```powershell
$env:SIMRP_DB_PATH="database/runtime/database.db"
$env:SIMRP_BACKUP_DIR="database/backups"
backup_database.bat
```

## Workflow Development

1. Jalankan `npm run dev`.
2. Edit file frontend di `src/`; Vite akan hot reload.
3. Jika mengubah backend Python, hentikan terminal dengan `Ctrl+C`, lalu jalankan `npm run dev` lagi.
4. Jalankan validasi sesuai perubahan.

Validasi frontend:

```bash
npm run build
```

Validasi backend:

```bash
python -m py_compile server/main.py
```

Validasi end-to-end backend:

```bash
python smoketest.py
```

## Troubleshooting

### `npm` tidak ditemukan

Install Node.js LTS, restart terminal, lalu ulangi:

```bash
node --version
npm --version
```

### `python` tidak ditemukan

Install Python 3 dan centang Add Python to PATH. Di Windows, coba:

```bash
py -3 --version
```

### Port 5173 atau 8000 sudah dipakai

Tutup proses lama yang masih berjalan, atau ubah port backend dengan:

```powershell
$env:SIMRP_PORT="8001"
npm run dev
```

Jika backend port diubah, sesuaikan `VITE_API_BASE_URL`.

### Login demo gagal

Periksa:

1. `SIMRP_ENABLE_DEMO_SEED=true` jika ingin akun demo non-admin.
2. Password di `database/runtime/dev_credentials.txt`.
3. Jika `.env.local` baru diubah, restart `npm run dev`.
4. Jika database sudah telanjur dibuat tanpa seed demo, reset `database/runtime`.

### Browser blank

1. Buka DevTools dengan F12.
2. Cek tab Console.
3. Pastikan backend hidup di `http://127.0.0.1:8000/make-server-32aa5c5c/health`.
4. Jalankan `npm run build` untuk cek error bundling.

## File Lokal Yang Tidak Boleh Di-commit

```text
.env
.env.local
database/runtime/
database/backups/
database/runtime/dev_credentials.txt
dist/
```

## Pull Request Checklist

Sebelum push/PR:

1. Pastikan perubahan sesuai scope task.
2. Jalankan `npm run build` jika frontend berubah.
3. Jalankan `python -m py_compile server/main.py` jika backend berubah.
4. Jalankan `python smoketest.py` untuk perubahan flow besar.
5. Jangan commit credential, database runtime, backup, atau build output.
