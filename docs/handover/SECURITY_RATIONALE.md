# Security Rationale

Dokumen ini menjelaskan alasan keputusan keamanan pada prototype SIMREKAP.

## Prinsip

- Backend adalah sumber kebenaran untuk auth, role, scope wilayah, dan mutasi data.
- Frontend hanya menampilkan UI dan mengirim request.
- Credential dan runtime database tidak boleh masuk repository.
- Prototype tidak boleh memberi kesan sudah setara production identity system.

## Register Publik Tetap Relawan

Publik hanya bisa register sebagai `user`/relawan. KSH dan moderator memerlukan approval admin karena role tersebut memiliki akses lebih tinggi terhadap data kegiatan dan laporan.

Alasan:

- mencegah user publik langsung mendapat akses petugas;
- menjaga scope wilayah tetap terkendali;
- mendukung audit keputusan admin;
- memudahkan demonstrasi alur administrasi.

## Tidak Ada Forgot Password Self-Service

Prototype belum menyediakan forgot password self-service karena belum terhubung dengan:

- email resmi SMTP production;
- SMS/OTP provider production;
- identity provider resmi;
- helpdesk identity verification.

Untuk menghindari reset password yang rawan disalahgunakan, account recovery diarahkan ke prosedur admin verification. Detail operasional ada di `docs/ACCOUNT_RECOVERY_RUNBOOK.md`.

## OTP Provider-Ready

OTP sudah memiliki fondasi endpoint dan tabel `otp_challenges`, tetapi mode development masih memakai provider `dev`. Mode ini berguna untuk demo, bukan bukti produksi.

Syarat produksi:

- provider SMS/WhatsApp/email resmi;
- rate limit yang disesuaikan;
- audit pengiriman OTP;
- masking nomor;
- kebijakan retry dan expiration;
- monitoring abuse.

## Admin Approval untuk Role Petugas

Portal Akses Petugas menyimpan request dalam tabel `access_requests`. Saat admin approve, backend memakai data request yang tersimpan, bukan role/scope baru dari body admin.

Alasan:

- mencegah mass assignment;
- menjaga konsistensi audit;
- menghindari perubahan scope diam-diam saat review;
- membuat proses bisa diperiksa ulang.

## Voucher Masih Preview

Voucher GoBis/Suroboyo Bus pada prototype belum terhubung API resmi. Kode voucher adalah simulasi.

Syarat produksi:

- kerja sama dan API resmi;
- validasi stok/transaksi;
- reconciliation;
- expiry policy;
- audit transaksi.

## Sertifikat Digital

Sertifikat dibuat setelah laporan verified dan dapat di-download sebagai HTML siap print/PDF. Verifikasi memakai certificate id/hash.

Batas prototype:

- belum memakai tanda tangan digital legal-formal;
- belum memakai QR signature resmi;
- belum ada certificate authority.

## Logging dan Audit

Audit log dipakai untuk aksi penting seperti approval, verification, role change, dan reward redeem. Log tidak boleh dipakai untuk menyimpan password, token, atau credential.

## Production Guardrails

Untuk produksi publik:

- matikan demo seed;
- set password admin kuat;
- set CORS allowlist;
- aktifkan TLS/reverse proxy;
- gunakan provider OTP resmi;
- siapkan backup/restore;
- review legal dan privacy.
