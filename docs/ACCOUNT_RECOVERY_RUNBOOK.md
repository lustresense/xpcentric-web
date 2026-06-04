# Account Recovery Runbook

Runbook ini menjelaskan prosedur manual untuk kasus lupa password atau reset akun pada lingkungan demo/pilot SIMRP. Saat ini belum ada endpoint self-service reset password, sehingga semua recovery dilakukan oleh operator/admin yang berwenang.

## Prinsip Keamanan

- Jangan pernah mengirim password lama kepada user.
- Jangan meminta user mengirim password melalui chat publik.
- Jangan menurunkan standar password untuk kebutuhan demo.
- Jangan mengubah role hierarchy saat membantu reset akun.
- Jangan mengubah database produksi/pilot aktif tanpa backup.
- Catat siapa yang meminta reset, siapa yang memproses, kapan, dan alasan reset.

## Kapan Prosedur Ini Dipakai

- Relawan lupa kata sandi.
- Moderator/ASN tidak bisa login ke akun demo/pilot.
- Admin demo perlu mengganti password setelah credential bocor saat presentasi.
- Database demo ingin di-reset ke kondisi seed baru.

## Data Minimum Untuk Verifikasi

Sebelum reset, operator perlu mencocokkan:

- nama lengkap;
- email akun;
- role yang diklaim;
- wilayah kecamatan/kelurahan untuk relawan/KSH/moderator wilayah;
- bukti konteks demo/pilot, misalnya daftar peserta uji coba atau konfirmasi admin wilayah.

Untuk pilot nyata, verifikasi harus mengikuti SOP resmi pemilik layanan.

## Flow Reset Password Manual

1. Terima permintaan reset dari kanal resmi demo/pilot.
2. Verifikasi identitas user dengan data minimum di atas.
3. Backup database runtime bila data masih perlu dipertahankan.
4. Buat password sementara yang kuat.
5. Update password melalui mekanisme admin/operator yang disepakati.
6. Minta user login dan segera mengganti password jika fitur ganti password sudah tersedia.
7. Catat tindakan reset di catatan operasional.

Catatan: Karena prototype saat ini belum punya endpoint ganti password self-service, reset password untuk demo dapat dilakukan dengan reset database demo atau intervensi operator database setelah backup.

## Reset Database Demo Lokal

Jika hanya untuk demo lokal dan data lama tidak perlu dipertahankan:

```powershell
Remove-Item -LiteralPath database\runtime\database.db
```

Lalu jalankan ulang backend dengan seed demo aktif:

```bash
npm run api
```

Credential development akan tersedia di:

```text
database/runtime/dev_credentials.txt
```

File credential tersebut hanya untuk mesin lokal dan tidak boleh di-commit.

## Reset Akun Admin Demo

Untuk demo lokal:

1. Matikan server.
2. Set env berikut di `.env.local`:

```text
SIMRP_ADMIN_LOGIN_USERNAME=admin
SIMRP_ADMIN_LOGIN_PASSWORD=<password-kuat-baru>
SIMRP_SEED_ADMIN_PASSWORD=<password-kuat-baru>
```

3. Jika perlu reset total, backup lalu hapus database runtime lokal.
4. Jalankan server kembali.

## Yang Belum Ada di Prototype

- Link lupa password via email.
- OTP nomor HP.
- Token reset password sekali pakai.
- Halaman ganti password mandiri.
- Audit UI khusus recovery.

Jika fitur ini ditambahkan nanti, wajib ada validasi token, expiry pendek, rate limit, audit log, dan generic error response agar tidak membuka enumerasi akun.
