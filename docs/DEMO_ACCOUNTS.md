# Demo Accounts SIMRP

Dokumen ini menjelaskan akun demo yang dibuat oleh seed aktif SIMRP. Password nyata tidak ditulis di repo. Untuk development, password dibuat otomatis atau diambil dari environment variable.

Last updated: 2026-05-30

## Ringkasan Credential

SIMRP punya dua jalur login:

| Jalur | URL | Identifier | Password |
|---|---|---|---|
| Admin portal | `/admin` | `SIMRP_ADMIN_LOGIN_USERNAME` default dev: `admin` | `SIMRP_ADMIN_LOGIN_PASSWORD` atau generated lokal |
| User/moderator | `/login` | email akun demo | `SIMRP_DEMO_PASSWORD` atau generated lokal |

Jika env password tidak diisi pada development, backend membuat password acak dan menulis catatannya ke:

```text
database/runtime/dev_credentials.txt
```

File tersebut adalah file lokal dan tidak boleh di-commit.

## Environment Yang Mengontrol Demo

| Env | Fungsi |
|---|---|
| `SIMRP_ENABLE_DEMO_SEED` | Mengaktifkan seed akun/event/voucher demo. Default runtime: `true` di development, `false` di production. |
| `SIMRP_DEMO_PASSWORD` | Password untuk semua akun demo non-admin. Wajib jika demo seed dinyalakan di production. |
| `SIMRP_ADMIN_LOGIN_USERNAME` | Username untuk halaman `/admin`. Default development: `admin`. |
| `SIMRP_ADMIN_LOGIN_PASSWORD` | Password portal admin. Jika kosong di development, dibuat otomatis. |
| `SIMRP_SEED_ADMIN_PASSWORD` | Password akun admin bootstrap `admin@simrp.local`; jika kosong memakai password admin portal. |

Catatan: jika kamu menyalin `.env.example` apa adanya, `SIMRP_ENABLE_DEMO_SEED=false` sehingga akun demo non-admin tidak dibuat. Untuk demo lokal lengkap, set:

```env
SIMRP_ENABLE_DEMO_SEED=true
```

## Akun Demo Seed Aktif

| Role | Nama | Email/Login | Wilayah | Fungsi Demo |
|---|---|---|---|---|
| Admin | Administrator | Portal: `admin`; akun DB: `admin@simrp.local` | Keputih | Kelola dashboard admin, kontrol role, data pengguna/event/laporan |
| Relawan | Andi Relawan | `relawan.demo@simrp.app` | Bulak | Join event, kirim laporan, lihat sertifikat/reward |
| Relawan | Nia Relawan | `relawan2.demo@simrp.app` | Keputih | Simulasi peserta tambahan |
| Relawan | Budi Relawan | `relawan3.demo@simrp.app` | Wonorejo | Simulasi peserta tambahan |
| KSH | Kak Esa | `ksh.demo@simrp.app` | Keputih | Checklist kehadiran dan complete event |
| ASN Tier 1 | Pak Raka ASN | `moderator1.demo@simrp.app` | Keputih | Membuat draft kegiatan |
| Lurah / Moderator Tier 2 | Bu Sinta Lurah | `moderator2.demo@simrp.app` | Keputih | Approve/publish event skala kelurahan dan verifikasi laporan wilayah |
| Camat / Moderator Tier 2 | Pak Dimas Camat | `moderator2.camat@simrp.app` | Kecamatan Keputih | Approve/publish event skala kecamatan dan verifikasi laporan kecamatan |
| Moderator Tier 3 | Pak Arif | `moderator3.demo@simrp.app` | Keputih | Monitoring agregat/insight prototype |

## Data Demo Tambahan

Saat demo seed aktif, backend juga membuat:

| Data | Isi |
|---|---|
| Event | Aksi Bersih Taman Kampung, Pelatihan UMKM Digital, Forum Guyub Warga, Festival Seni Kampung |
| Kolaborasi mitra | Komunitas Hijau Surabaya, PT Sejahtera Pangan |
| Voucher reward | Voucher GoBis Rp 10.000 dan Voucher GoBis Rp 25.000 |

Voucher GoBis digunakan sebagai prototype reward transportasi yang bisa ditukarkan melalui aplikasi GoBis untuk akses Suroboyo Bus dan layanan angkutan publik terkait.

## Quick Start Demo

1. Install dependency:

```bash
npm install
```

2. Jalankan frontend dan backend:

```bash
npm run dev
```

3. Buka aplikasi:

```text
Frontend: http://localhost:5173
Admin:    http://localhost:5173/admin
API:      http://127.0.0.1:8000/make-server-32aa5c5c
```

4. Ambil password dari `database/runtime/dev_credentials.txt` jika env password belum diset.

## Skenario Demo End-to-End

1. Login sebagai `moderator1.demo@simrp.app`, buat draft event.
2. Login sebagai `moderator2.demo@simrp.app` untuk scope kelurahan atau `moderator2.camat@simrp.app` untuk scope kecamatan, lalu approve dan publish event.
3. Login sebagai relawan, misalnya `relawan.demo@simrp.app`, lalu join event.
4. Login sebagai `ksh.demo@simrp.app`, checklist peserta hadir dan complete event.
5. Login kembali sebagai relawan yang hadir, kirim laporan.
6. Login sebagai moderator tier 2/admin, review dan verify laporan.
7. Cek XP, leaderboard, sertifikat digital, notifikasi, dan reward voucher.

## Production Notes

Sebelum production:

1. Set `SIMRP_ENV=production`.
2. Set `SIMRP_ADMIN_LOGIN_USERNAME`.
3. Set `SIMRP_ADMIN_LOGIN_PASSWORD` dengan password kuat.
4. Biarkan `SIMRP_ENABLE_DEMO_SEED=false` kecuali memang sedang membuat environment demo.
5. Jika demo seed production dinyalakan, set `SIMRP_DEMO_PASSWORD` dan `SIMRP_SEED_ADMIN_PASSWORD`.
6. Jangan commit `.env`, `.env.local`, `database/runtime/`, `database/backups/`, atau `dev_credentials.txt`.
