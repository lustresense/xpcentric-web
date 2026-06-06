# Operations Runbook

Runbook ini dipakai untuk menjalankan, memvalidasi, backup, dan troubleshooting SIMREKAP pada lingkungan lokal, demo, atau pilot terbatas.

## Start Lokal

Install dependency:

```bash
npm install
```

Jalankan backend dan frontend sekaligus:

```bash
npm run dev
```

URL default:

```text
Frontend: http://localhost:5173
Admin:    http://localhost:5173/admin
Backend:  http://127.0.0.1:8000/make-server-32aa5c5c
```

Jalankan backend saja:

```bash
npm run api
```

Jalankan frontend saja:

```bash
npm run dev:web
```

## Health Check

```bash
curl http://127.0.0.1:8000/make-server-32aa5c5c/health
```

Response sehat biasanya berisi status JSON dari backend. Jika gagal, cek port, env, dan database runtime.

## Validasi Rutin

Frontend:

```bash
npm run build
```

Backend:

```bash
python -m py_compile server/main.py
```

Smoke test:

```bash
npm run smoke
```

Smoke test memakai server dan database temporer sehingga tidak mengubah database lokal utama.

## Credential Lokal

Jika env credential tidak disediakan dalam mode development, backend membuat credential acak di:

```text
database/runtime/dev_credentials.txt
```

File ini hanya untuk mesin lokal dan tidak boleh di-commit.

## Reset Database Lokal

Untuk reset demo lokal:

1. Matikan server.
2. Backup database bila masih perlu.
3. Hapus database runtime lokal:

```powershell
Remove-Item -LiteralPath database\runtime\database.db
```

4. Jalankan server lagi dengan `SIMRP_ENABLE_DEMO_SEED=true` bila butuh data demo.

Catatan: Jangan lakukan reset terhadap database yang dipakai demo/pilot aktif tanpa backup.

## Backup Database

Cek script backup:

```bash
scripts/backup_database.bat --check
```

Jalankan backup:

```bash
scripts/backup_database.bat
```

Default database:

```text
database/runtime/database.db
```

Default backup:

```text
database/backups/
```

Folder backup di-ignore oleh Git.

## Troubleshooting

### Backend Tidak Start

- Pastikan Python tersedia di PATH.
- Pastikan port `8000` tidak dipakai proses lain.
- Jalankan `python -m py_compile server/main.py`.
- Cek `SIMRP_DB_PATH` jika memakai database custom.
- Cek file `.env.local` bila ada env typo.

### Frontend Tidak Bisa Login

- Pastikan backend hidup.
- Pastikan `VITE_API_BASE_URL` sesuai base URL backend.
- Cek credential di `.env.local` atau `database/runtime/dev_credentials.txt`.
- Cek browser console untuk status `401`, `403`, atau `429`.
- Untuk lupa password/reset akun, ikuti [Account Recovery Runbook](ACCOUNT_RECOVERY_RUNBOOK.md).

### Smoke Test Gagal

- Jalankan ulang sekali untuk memastikan bukan port conflict.
- Jika gagal kedua kali, baca detail PASS/FAIL di output smoke.
- Jangan centang task terkait sebelum root cause jelas.

### Data Demo Tidak Muncul

- Cek `SIMRP_ENABLE_DEMO_SEED`.
- Jika database sudah pernah dibuat, seed baru mungkin tidak menimpa data lama.
- Untuk demo lokal, reset DB setelah backup jika ingin seed fresh.

### Admin Tidak Bisa Login

- Cek `SIMRP_ADMIN_LOGIN_USERNAME`.
- Cek `SIMRP_ADMIN_LOGIN_PASSWORD`.
- Jika demo seed off pada DB baru, backend tetap bootstrap akun admin minimal dari env yang tersedia.

## Production-like Notes

Untuk demo publik atau pilot terbatas:

- Set `SIMRP_ENV=production`.
- Set `SIMRP_ALLOWED_ORIGINS` spesifik ke domain frontend.
- Jalankan backend di balik reverse proxy TLS.
- Matikan demo seed kecuali memang sesi demo.
- Pakai credential kuat.
- Siapkan backup database sebelum demo.
- Simpan log server di lokasi yang tidak ikut Git.
