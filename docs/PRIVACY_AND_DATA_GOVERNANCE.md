# Privacy and Data Governance

Dokumen ini menjelaskan data yang diproses SIMRP, prinsip perlindungan data, dan batas prototype. Dokumen ini bukan opini legal final, tetapi panduan teknis agar pengembangan tetap sadar privasi.

## Jenis Data Yang Disimpan

SIMRP dapat menyimpan data berikut:

- Identitas akun: nama, email, role, dan nomor HP jika user memakai flow OTP.
- Wilayah: kecamatan, kelurahan, kodepos, mapping kampung.
- Data kegiatan: judul, deskripsi, tanggal, lokasi, pilar, scope wilayah.
- Partisipasi: status daftar, hadir, dan laporan.
- Laporan kegiatan: deskripsi, outcome, peserta, status review, alasan penolakan.
- XP/poin dan badge.
- Sertifikat: ID sertifikat, hash verifikasi, event, penerima.
- Reward: katalog voucher, kode redeem, status redeem.
- Notifikasi in-app.
- Audit log aksi penting.
- Session token aktif.
- OTP challenge: nomor HP, purpose OTP, hash OTP, expiry, status konsumsi, dan jumlah percobaan.

## Prinsip Minimal Data

- Ambil data yang dibutuhkan untuk flow sistem saja.
- Nomor HP hanya dipakai untuk OTP/recovery dan tidak ditampilkan di leaderboard/dashboard publik.
- Jangan menambah NIK, alamat lengkap, atau data sensitif lain tanpa kebutuhan jelas.
- Jika menambah data sensitif, tambahkan alasan, validasi, akses terbatas, dan dokumentasi.
- Jangan tampilkan data ASN/admin di leaderboard relawan.
- Batasi list data memakai RBAC dan pagination.

## Consent dan Transparansi

Untuk pilot terbatas, halaman registrasi atau onboarding sebaiknya menjelaskan:

- data apa yang disimpan;
- data dipakai untuk event, laporan, XP, sertifikat, reward, dan notifikasi;
- data dapat dilihat oleh admin/moderator sesuai kewenangan;
- voucher dan sertifikat masih prototype bila belum terhubung layanan resmi.

## Retensi Data

Rekomendasi awal:

- Session token mengikuti `SIMRP_SESSION_TTL_HOURS`.
- Audit log disimpan selama periode evaluasi pilot.
- Data laporan/event disimpan selama dibutuhkan untuk rekap KP/demo.
- Database demo bisa direset setelah backup.

Untuk produksi publik, retensi perlu kebijakan resmi dari pemilik layanan.

## Koreksi dan Penghapusan Data

Prototype saat ini belum menyediakan self-service delete account. Untuk pilot/demo:

- Koreksi profil dilakukan melalui endpoint update profil atau admin.
- Penghapusan data dilakukan manual oleh operator database setelah backup dan approval.
- Jika ada permintaan penghapusan, catat alasan, waktu, dan operator.

Untuk layanan publik, perlu flow resmi koreksi/penghapusan data dan audit prosedural.

## Gap Legal Final

Dokumen ini hanya panduan teknis. Final compliance UU PDP membutuhkan review pemilik layanan dan pihak legal. Item yang perlu diputuskan di luar kode:

- pengendali data dan pemroses data;
- dasar pemrosesan data;
- privacy notice final;
- mekanisme consent;
- retensi dan penghapusan data;
- prosedur pelaporan insiden;
- kontrak vendor untuk OTP, hosting, email, dan integrasi transportasi.

## Akses Data

- Relawan hanya melihat data miliknya dan event yang visible sesuai scope.
- KSH dibatasi ke wilayahnya.
- Moderator Tier 2 dibatasi sesuai scope wilayah saat verifikasi laporan.
- Admin memiliki akses pengawasan penuh untuk kebutuhan operasional.
- Endpoint admin dan mutasi data wajib memakai bearer token dan RBAC server-side.

## Keamanan Data

Implementasi teknis yang sudah ada:

- Password di-hash memakai PBKDF2-HMAC-SHA256.
- Session token tersimpan di tabel `sessions`.
- SQL memakai parameterized query.
- Security headers dan CORS dikontrol backend.
- Rate limiting untuk auth dan mutasi.
- OTP disimpan sebagai hash HMAC, single-use, expiry pendek, attempt-limited, dan audit log memakai nomor HP yang dimasking.
- Download sertifikat memakai Authorization header, bukan token di URL.
- Credential lokal berada di `database/runtime/dev_credentials.txt` dan tidak boleh masuk Git.

## Batas Prototype

Sebelum dipakai sebagai layanan publik warga Surabaya, perlu review tambahan:

- legal compliance UU PDP;
- perjanjian pengelola data;
- SOP insiden keamanan;
- backup dan restore production;
- monitoring dan log retention;
- proses koreksi/penghapusan data formal;
- integrasi resmi untuk voucher atau transportasi bila reward dibuat nyata.
