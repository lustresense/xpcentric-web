# SIMREKAP Sample Database

Folder ini berisi database sample aman untuk serah-terima:

```text
simrekap_demo.sqlite
```

Database ini dibuat ulang dari seed bersih, bukan salinan `database/runtime/database.db`.

## Isi Sample

- 9 akun demo.
- 4 event demo.
- 2 collaboration request demo.
- 2 voucher demo.
- Master kecamatan, kelurahan, kodepos, dan XP awal.

Tabel berikut dikosongkan agar tidak membawa state runtime:

- `sessions`
- `otp_challenges`
- `audit_logs`
- `notifications`

## Credential Demo Sample

Credential ini hanya untuk database sample/demo:

```text
User demo password:  SIMREKAP-Demo-2026!
Admin seed password: SIMREKAP-Admin-Demo-2026!
```

Untuk portal admin `/admin`, runtime backend tetap membaca:

```text
SIMRP_ADMIN_LOGIN_USERNAME
SIMRP_ADMIN_LOGIN_PASSWORD
```

Jangan memakai credential sample untuk production.

## Cara Pakai

Copy sample DB ke path runtime baru:

```bash
mkdir -p database/runtime
cp database/sample/simrekap_demo.sqlite database/runtime/database.db
```

Atau gunakan env:

```bash
SIMRP_DB_PATH=database/sample/simrekap_demo.sqlite npm run api
```
Untuk server Linux VPS Diskominfo, copy file ke direktori runtime atau biarkan aplikasi membuat DB baru dari seed menggunakan variabel environment.
