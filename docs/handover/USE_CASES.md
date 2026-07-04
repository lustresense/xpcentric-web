# Use Cases SIMREKAP

Dokumen ini merangkum use case utama per aktor untuk kebutuhan serah-terima dan pengembangan lanjutan.

## UC-01 Register Relawan

| Elemen | Detail |
|---|---|
| Aktor | Warga/relawan |
| Tujuan | Membuat akun relawan awal |
| Prasyarat | Email belum terdaftar |
| Alur utama | Buka register, isi data, pilih wilayah, submit |
| Output | User baru dengan `role_code='user'` |
| Catatan | Register tidak membuat akun moderator/KSH langsung |

## UC-02 Login Relawan/Moderator

| Elemen | Detail |
|---|---|
| Aktor | Relawan, KSH, moderator |
| Tujuan | Masuk dashboard sesuai role aktif |
| Prasyarat | Akun tersedia dan password benar |
| Alur utama | Isi email/password, backend membuat session, frontend membuka dashboard |
| Output | Token session dan payload user |
| Catatan | Role berasal dari server, bukan localStorage |

## UC-03 Pengajuan Akses Petugas

| Elemen | Detail |
|---|---|
| Aktor | Relawan/KSH |
| Tujuan | Mengajukan akses KSH atau moderator |
| Prasyarat | User login sebagai `user` atau `ksh` |
| Alur utama | Buka `/access`, pilih role, pilih scope, isi jabatan/alasan, submit |
| Output | Request status `pending` |
| Alternatif | Duplicate pending request untuk role yang sama ditolak |

## UC-04 Review Pengajuan Akses

| Elemen | Detail |
|---|---|
| Aktor | Admin |
| Tujuan | Approve/reject role petugas |
| Prasyarat | Ada access request `pending` |
| Alur utama | Admin membuka queue, membaca data request, approve/reject |
| Output | Status request berubah; role user berubah bila approved |
| Kontrol | Role/scope final memakai data request yang tersimpan |

## UC-05 Buat Event

| Elemen | Detail |
|---|---|
| Aktor | Moderator T1/Admin |
| Tujuan | Membuat draft kegiatan kampung |
| Prasyarat | Aktor punya kewenangan membuat event |
| Alur utama | Isi judul, pilar, tanggal, lokasi, quota, scope wilayah |
| Output | Event status `draft` |
| Kontrol | Moderator dibatasi scope wilayahnya |

## UC-06 Approve dan Publish Event

| Elemen | Detail |
|---|---|
| Aktor | Moderator T2/Admin |
| Tujuan | Menyetujui dan mempublikasikan event |
| Prasyarat | Event status `draft` atau `approved` |
| Alur utama | Review draft, approve, lalu publish |
| Output | Event status `published` |
| Kontrol | Moderator T2 hanya untuk wilayah sesuai scope |

## UC-07 Join Event

| Elemen | Detail |
|---|---|
| Aktor | Relawan/KSH |
| Tujuan | Mendaftar kegiatan |
| Prasyarat | Event published dan visible untuk wilayah user |
| Alur utama | User klik join |
| Output | Record `event_participation` status `registered` |
| Alternatif | Duplicate join ditolak oleh unique constraint |

## UC-08 Attendance dan Complete Event

| Elemen | Detail |
|---|---|
| Aktor | KSH/Admin |
| Tujuan | Menandai peserta hadir dan menyelesaikan event |
| Prasyarat | Event published dan peserta terdaftar |
| Alur utama | Pilih peserta hadir, simpan attendance, isi output summary, complete event |
| Output | Participation `attended`, event `completed` |

## UC-09 Submit Laporan

| Elemen | Detail |
|---|---|
| Aktor | Relawan/KSH |
| Tujuan | Melaporkan hasil partisipasi |
| Prasyarat | Event completed, user joined dan attended |
| Alur utama | Isi jumlah peserta, checklist, outcome tags, optional photo URL |
| Output | Report status `pending` |
| Alternatif | Laporan ganda untuk event yang sama ditolak |

## UC-10 Review dan Verify Laporan

| Elemen | Detail |
|---|---|
| Aktor | Moderator T2/Admin |
| Tujuan | Memvalidasi laporan kegiatan |
| Prasyarat | Report pending/under_review |
| Alur utama | Mark review, verify atau reject dengan alasan |
| Output | Jika verified: XP, certificate, notification, audit log |
| Kontrol | Moderator T2 dibatasi scope wilayah event |

## UC-11 Download dan Verify Sertifikat

| Elemen | Detail |
|---|---|
| Aktor | Relawan/Admin |
| Tujuan | Melihat bukti partisipasi |
| Prasyarat | Report verified dan certificate dibuat |
| Alur utama | Buka daftar sertifikat, preview, download HTML, verify public URL |
| Output | File sertifikat dan data verifikasi |

## UC-12 Redeem Voucher

| Elemen | Detail |
|---|---|
| Aktor | Relawan/KSH |
| Tujuan | Menukar XP menjadi voucher demo |
| Prasyarat | XP cukup dan stok tersedia |
| Alur utama | Pilih voucher, redeem |
| Output | Voucher code demo, XP berkurang, stok berkurang |
| Catatan | Belum terhubung API GoBis resmi |

## UC-13 Kolaborasi Mitra

| Elemen | Detail |
|---|---|
| Aktor | Mitra publik, moderator/admin |
| Tujuan | Mengajukan dan mereview dukungan mitra |
| Prasyarat | Mitra mengisi form publik |
| Alur utama | Submit dukungan, moderator/admin approve/reject |
| Output | Status request dan audit/notifikasi internal |

## UC-14 Operasi Admin

| Elemen | Detail |
|---|---|
| Aktor | Admin |
| Tujuan | Mengelola data dan operasional prototype |
| Alur utama | Buka dashboard admin, filter/search data, review laporan/request, assign/cabut role, temporary adjustment |
| Output | Data berubah sesuai aksi, audit log tercatat |
| Kontrol | Endpoint admin wajib role `admin` |
