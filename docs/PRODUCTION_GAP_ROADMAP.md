# Production Gap Roadmap

Dokumen ini merinci Batch 5: gap yang belum boleh diklaim selesai untuk produksi publik. Tujuannya agar maintainer, reviewer kampus, atau pihak teknis Diskominfo bisa melihat batas prototype secara jujur dan tahu langkah berikutnya.

## Status Singkat

SIMRP saat ini layak sebagai prototype demo dan pilot terbatas. Untuk pemakaian publik warga Surabaya skala kota, item di bawah membutuhkan keputusan vendor, legal, infrastruktur, atau migrasi teknis besar.

| Gap | Status Saat Ini | Agar Bisa Dicentang |
|---|---|---|
| OTP/nomor HP resmi | Foundation backend selesai; provider resmi belum tersambung | Pilih provider resmi, kontrak layanan, adapter pengiriman OTP, dan fallback recovery |
| Migrasi SQLite ke PostgreSQL/MySQL | FUTURE/BLOCKED; tidak dikerjakan untuk demo/KP | Adapter DB baru, migration scripts, test data, backup/restore, load test |
| Monitoring, log rotation, reverse proxy HTTPS | Baru contoh konfigurasi | Server target, TLS domain, service manager, central logging, alerting |
| API GoBis resmi | Belum ada integrasi resmi | Dokumentasi/API credential resmi, sandbox, kontrak redeem, reconciliation |
| Sertifikat tanda tangan digital resmi | Belum ada legal signing | Provider tanda tangan digital/CA, policy legal, signing flow, verification |
| Compliance legal final UU PDP | Belum final legal | DPO/pemilik data, DPIA, consent final, retensi, breach response, dokumen hukum |

## 1. OTP dan Nomor HP Resmi

### Batas Prototype

Auth utama tetap memakai email dan password. OTP tetap optional/dev-mode untuk demo dan tidak boleh memblokir register/login demo kecuali maintainer sengaja mengaktifkan `SIMRP_OTP_REQUIRE_VERIFICATION=true`. Backend sudah memiliki fondasi OTP nomor HP:

- field `phone_number` dan `phone_verified` di tabel `users`;
- tabel `otp_challenges` untuk OTP one-time-use;
- endpoint `POST /auth/otp/request`;
- endpoint `POST /auth/otp/verify`;
- optional OTP saat signup melalui `otpChallengeId` dan `otpCode`;
- penyimpanan OTP dalam bentuk hash HMAC;
- expiry pendek dan batas percobaan;
- rate limit endpoint auth;
- audit log dengan nomor HP dimasking.

Provider yang tersedia saat ini adalah `dev` untuk pengujian lokal/pilot. Provider ini mengembalikan `devOtpCode` di response non-production dan ditolak oleh validasi production.

### Requirement Produksi

- Provider OTP resmi atau gateway SMS/WhatsApp yang disetujui pemilik layanan.
- Verifikasi nomor HP saat registrasi dan saat reset akun.
- Rate limit per nomor, IP, dan akun.
- Token OTP one-time-use, expiry pendek, dan hashed storage.
- Generic error agar tidak membuka enumerasi akun.
- Audit log untuk request OTP, verify success, verify failed, dan rate-limit hit.
- Adapter pengiriman OTP resmi, misalnya SMS gateway/WhatsApp gateway yang punya kontrak dan SLA.

### Risiko Jika Dipaksa Tanpa Provider

- Nomor HP palsu tidak terverifikasi.
- Biaya OTP tidak terkendali.
- Serangan spam OTP.
- Recovery akun rentan social engineering.

### Status 2026-06-03

Yang selesai di kode adalah fondasi backend dan dev provider. Yang belum boleh diklaim sebagai produksi publik adalah pengiriman OTP lewat vendor resmi, karena butuh credential, kontrak, SLA, biaya, dan persetujuan pemilik layanan.

## 2. Migrasi SQLite ke PostgreSQL/MySQL

### Batas Prototype

SQLite tetap menjadi active database untuk prototype lokal, buku KP, sidang KP, demo Diskominfo/kampus, dan demo server prodi. Migrasi SQLite ke PostgreSQL/MySQL bukan scope sekarang.

Untuk skala kota atau pilot luas, perlu evaluasi database server/managed database. Jangan mengubah DB adapter, query layer, runtime DB path, atau schema runtime hanya untuk mengejar klaim production sebelum ada kebutuhan pilot luas yang jelas.

### Requirement Produksi

- Pilih target DB: PostgreSQL direkomendasikan untuk relasi dan audit.
- Buat adapter koneksi agar SQL tidak tersebar liar.
- Ubah migration dari SQLite-specific ke target DB.
- Migrasi schema dan data demo ke migration versioned.
- Backup dan restore teruji.
- Index untuk endpoint list besar, terutama users/events/reports/notifications.
- Load test untuk traffic list, login, join event, submit laporan.

### Strategi Migrasi Bertahap

1. Tambah abstraksi repository kecil untuk query paling sering.
2. Buat migration SQL target DB.
3. Jalankan dual test dengan DB temporer.
4. Port smoke test agar bisa memilih SQLite atau PostgreSQL.
5. Freeze data, backup, migrate, verify checksum, lalu cutover.

## 3. Monitoring, Log Rotation, Reverse Proxy HTTPS

### Batas Prototype

Backend masih dijalankan langsung oleh Python stdlib server. Dokumentasi contoh reverse proxy dan service tersedia, tetapi belum dipasang di server nyata.

### Requirement Produksi

- Reverse proxy HTTPS dengan TLS valid.
- Backend listen hanya di localhost/private network.
- Structured logs dan log rotation.
- Health check aktif.
- Alert untuk downtime, error rate, disk usage, dan backup failure.
- Secret scanning dan backup monitoring.

### Referensi

- `deploy/nginx/simrp-api.conf.example`
- `deploy/systemd/simrp-api.service.example`
- `docs/DEPLOYMENT.md`

## 4. Integrasi API GoBis Resmi

### Batas Prototype

Voucher GoBis saat ini simulasi in-app. Kode voucher dibuat untuk demo dan belum merepresentasikan tiket nyata.

### Requirement Produksi

- Dokumen API resmi atau MoU integrasi.
- Sandbox dan production credentials.
- Kontrak request/response untuk issue voucher, redeem, cancel, dan status check.
- Reconciliation harian antara SIMRP dan sistem GoBis.
- Audit log setiap transaksi.
- Idempotency key untuk mencegah redeem ganda.
- Error handling aman jika provider down.

### Risiko Jika Dipaksa Tanpa Integrasi Resmi

- Voucher tidak bisa dipakai warga.
- Potensi klaim palsu soal tiket transportasi.
- Sulit audit biaya dan stok.

## 5. Sertifikat Dengan Tanda Tangan Digital Resmi

### Batas Prototype

Sertifikat saat ini berupa HTML siap cetak dengan hash verifikasi. Ini cukup untuk demo/KP, tetapi bukan tanda tangan digital legal formal.

### Requirement Produksi

- Pilih penyedia tanda tangan digital/CA yang diakui.
- Tentukan siapa penandatangan dan otoritas penerbit.
- Buat signing workflow setelah laporan diverifikasi.
- Simpan signature metadata dan timestamp.
- Endpoint verify harus memvalidasi signature, bukan hanya hash.
- Policy revoke/void sertifikat jika laporan dibatalkan.

## 6. Compliance Legal Final UU PDP

### Batas Prototype

Dokumen privacy/data governance sudah ada sebagai panduan teknis, tetapi belum menggantikan review hukum.

### Requirement Produksi

- Tetapkan pengendali dan pemroses data.
- Buat privacy notice final.
- Definisikan consent dan dasar pemrosesan data.
- Definisikan retensi, koreksi, penghapusan, dan export data.
- Buat SOP insiden dan breach notification.
- Lakukan DPIA untuk data warga.
- Review kontrak vendor OTP, hosting, email, dan integrasi transportasi.

## Keputusan Maintainer

Batch 5 tidak dicentang sampai item benar-benar diimplementasi dan divalidasi dengan pihak eksternal yang relevan. Untuk laporan KP, status yang akurat adalah:

```text
Pilot-ready prototype with documented production gaps.
```

Kalimat yang harus dihindari:

```text
Production-ready untuk seluruh warga Surabaya.
```
