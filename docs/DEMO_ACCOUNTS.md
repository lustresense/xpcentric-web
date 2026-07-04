# Demo Accounts SIMREKAP

Dokumen ini menjelaskan akun demo, credential policy, dan skenario demo end-to-end.

## Kenapa Password Tidak Ditulis Sebagai Secret Runtime

Runtime development dapat membuat password acak di:

```text
database/runtime/dev_credentials.txt
```

File tersebut tidak masuk repository karena termasuk credential lokal. Untuk paket serah-terima, repository menyediakan sample DB sanitized dengan password demo non-pribadi agar tim teknis bisa mencoba sistem tanpa memakai credential lokal pengembang.

Sample DB:

```text
database/sample/simrekap_demo.sqlite
```

Credential sample:

```text
User demo password:  SIMREKAP-Demo-2026!
Admin seed password: SIMREKAP-Admin-Demo-2026!
```

Untuk portal admin `/admin`, backend tetap membaca environment:

```text
SIMRP_ADMIN_LOGIN_USERNAME
SIMRP_ADMIN_LOGIN_PASSWORD
```

## Environment Demo

| Env | Fungsi |
|---|---|
| `SIMRP_ENABLE_DEMO_SEED` | Mengaktifkan akun/event/voucher demo |
| `SIMRP_DEMO_PASSWORD` | Password akun demo non-admin |
| `SIMRP_ADMIN_LOGIN_USERNAME` | Username portal admin |
| `SIMRP_ADMIN_LOGIN_PASSWORD` | Password portal admin |
| `SIMRP_SEED_ADMIN_PASSWORD` | Password akun admin bootstrap |

Untuk demo lokal lengkap:

```env
SIMRP_ENABLE_DEMO_SEED=true
SIMRP_DEMO_PASSWORD=SIMREKAP-Demo-2026!
SIMRP_ADMIN_LOGIN_USERNAME=admin
SIMRP_ADMIN_LOGIN_PASSWORD=SIMREKAP-Admin-Demo-2026!
SIMRP_SEED_ADMIN_PASSWORD=SIMREKAP-Admin-Demo-2026!
```

## Akun Demo

| Role | Nama | Email/Login | Wilayah | Fungsi |
|---|---|---|---|---|
| Admin | Administrator | Portal `/admin`: `admin` | Keputih | Kelola dashboard admin |
| Relawan | Andi Relawan | `relawan.demo@simrp.app` | Bulak | Join event, laporan, sertifikat, reward |
| Relawan | Nia Relawan | `relawan2.demo@simrp.app` | Keputih | Peserta tambahan |
| Relawan | Budi Relawan | `relawan3.demo@simrp.app` | Wonorejo | Peserta tambahan |
| KSH | Kak Esa | `ksh.demo@simrp.app` | Keputih | Attendance dan complete event |
| Moderator T1 | Pak Raka ASN | `moderator1.demo@simrp.app` | Keputih | Membuat draft event |
| Moderator T2 Lurah | Bu Sinta Lurah | `moderator2.demo@simrp.app` | Keputih | Approve/publish dan verify wilayah kelurahan |
| Moderator T2 Camat | Pak Dimas Camat | `moderator2.camat@simrp.app` | Sukolilo/Keputih | Approve/publish dan verify wilayah kecamatan |
| Moderator T3 | Pak Arif | `moderator3.demo@simrp.app` | Keputih | Role perluasan prototype |

## Data Demo

- Event: Aksi Bersih Taman Kampung, Pelatihan UMKM Digital, Forum Guyub Warga, Festival Seni Kampung.
- Kolaborasi: Komunitas Hijau Surabaya, PT Sejahtera Pangan.
- Voucher: Voucher GoBis Rp 10.000 dan Rp 25.000.

## Quick Start Demo Lokal

```bash
npm install
npm run dev
```

URL:

```text
Frontend: http://localhost:5173
Admin:    http://localhost:5173/admin
Access:   http://localhost:5173/access
API:      http://127.0.0.1:8000/make-server-32aa5c5c
```

## Skenario Demo End-to-End

1. Login sebagai `moderator1.demo@simrp.app`, buat draft event.
2. Login sebagai `moderator2.demo@simrp.app` atau admin, approve dan publish event.
3. Login sebagai `relawan.demo@simrp.app`, join event.
4. Login sebagai `ksh.demo@simrp.app`, tandai attendance dan complete event.
5. Login kembali sebagai relawan, submit laporan.
6. Login sebagai moderator T2/admin, review dan verify laporan.
7. Cek XP, leaderboard, certificate, notification, dan reward voucher.

## Demo Access Portal Flow

1. Daftar user baru lewat `/register`.
2. Login sebagai user tersebut.
3. Buka `/access`.
4. Ajukan akses KSH, Moderator T1, atau Moderator T2.
5. Admin login lewat `/admin`.
6. Admin membuka queue Pengajuan Akses.
7. Admin approve/reject.
8. User refresh/login ulang.
9. Dashboard berubah sesuai role baru jika request disetujui.

Keputusan produk: `/access` bukan aktivasi moderator langsung. Role aktif hanya berubah setelah admin approval.

## Production Notes

- Jangan memakai credential sample untuk produksi.
- Matikan `SIMRP_ENABLE_DEMO_SEED` untuk data warga nyata.
- Gunakan password admin kuat.
- Rotasi credential setelah demo publik.
- Jangan commit `database/runtime/` atau `dev_credentials.txt`.
