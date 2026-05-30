# SIMRP - Sistem Informasi Manajemen Rekap Partisipatif

SIMRP adalah prototype aplikasi web untuk mengelola partisipasi warga Surabaya dalam program kampung berbasis kegiatan, laporan, XP, sertifikat, voucher transportasi, notifikasi, dan kolaborasi mitra. Proyek ini dikembangkan oleh Farchan sebagai bahan kerja praktik / KP dan dapat digunakan sebagai konteks teknis untuk penyusunan laporan atau buku KP.

README ini sengaja dibuat lengkap agar bisa langsung dipakai sebagai bahan konteks untuk AI chat/web saat menyusun laporan akademik. Isi dokumen mencakup tujuan sistem, arsitektur aktual, fitur, alur bisnis, endpoint, database, keamanan, cara menjalankan, validasi, serta ringkasan kontribusi pengembangan.

## Ringkasan Singkat

SIMRP menyimulasikan sistem partisipasi warga untuk program kampung di Surabaya. Relawan dapat mendaftar kegiatan, hadir, mengirim laporan, memperoleh XP, melihat leaderboard, mendapat sertifikat digital, dan menukar XP menjadi voucher transportasi GoBis/Suroboyo Bus. KSH dan ASN/moderator mengelola kegiatan serta memverifikasi laporan sesuai kewenangan wilayah. Admin mengawasi database pengguna, event, laporan, role, dan penyesuaian sementara.

Status teknis per 2026-05-30:

- Frontend: React 18 + Vite 6, UI berbasis TSX components.
- Backend: Python stdlib `ThreadingHTTPServer`, tanpa Flask/FastAPI/Django.
- Database: SQLite runtime di `database/runtime/database.db`.
- API prefix: `/make-server-32aa5c5c`.
- Runtime utama backend: `server/main.py`.
- `server/main.py` saat ini sekitar 585 baris setelah modularisasi besar dari versi lama sekitar 1570 baris.
- `UserDashboard.tsx` sudah dipisah ke modul domain kecil.
- Dashboard moderator sudah dipisah ke modul kecil.
- Dashboard admin sudah dibuat ulang menjadi database-style interface mirip Notion.
- Navbar desktop/mobile sudah memakai hook notifikasi bersama.

## Tujuan Sistem

SIMRP dibuat untuk menjawab kebutuhan prototype sistem administrasi partisipasi warga:

1. Mengelola data relawan, KSH, ASN/moderator, dan admin.
2. Mengelola kegiatan kampung berdasarkan wilayah kelurahan/kecamatan.
3. Mencatat partisipasi relawan pada event.
4. Memverifikasi laporan kegiatan secara berjenjang.
5. Menghitung kontribusi dalam bentuk XP/poin.
6. Menampilkan leaderboard kampung/relawan.
7. Menerbitkan sertifikat digital untuk laporan yang disetujui.
8. Menyediakan katalog reward/voucher transportasi.
9. Mencatat notifikasi dan audit trail.
10. Menyediakan dashboard sesuai role pengguna.

Dalam konteks laporan KP, proyek ini dapat dijelaskan sebagai prototype sistem informasi partisipatif untuk mendukung digitalisasi proses pencatatan, validasi, dan apresiasi kegiatan warga.

## Peran Pengguna

Sistem menggunakan role berbasis `role_code` di backend.

| Role | Kode backend | Fungsi utama |
|---|---|---|
| Relawan | `user` | Mendaftar kegiatan, mengirim laporan, mendapat XP, sertifikat, reward |
| KSH | `ksh` | Relawan terverifikasi yang dapat mengelola kehadiran dan menandai event selesai |
| ASN Tier 1 | `moderator_t1` | Membuat draft kegiatan |
| Lurah/Camat | `moderator_t2` | Menyetujui event dan memverifikasi laporan sesuai wilayah |
| Moderator Tier 3 | `moderator_t3` | Role moderator tingkat lanjut untuk perluasan prototype |
| Admin | `admin` | Mengelola data, role, temporary adjustment, dan seluruh dashboard admin |

Catatan: Role hierarchy tidak boleh diubah sembarangan karena dipakai untuk RBAC server-side.

## Tech Stack

### Frontend

- React 18
- Vite 6
- TypeScript-style TSX
- Tailwind CSS utility classes
- Radix UI primitives
- Lucide React icons
- Recharts untuk visualisasi chart/radar
- Sonner untuk toast notification
- Motion untuk animasi landing page

### Backend

- Python 3
- `http.server.ThreadingHTTPServer`
- `sqlite3`
- PBKDF2-HMAC-SHA256 untuk password hashing
- Token session di tabel `sessions`
- Modular API handler di `server/api/*`
- Service helper di `server/services/*`

### Database

- SQLite
- Default path: `database/runtime/database.db`
- Bisa dioverride via `SIMRP_DB_PATH`

## Cara Menjalankan Lokal

Install dependency:

```bash
npm install
```

Jalankan frontend dan backend sekaligus:

```bash
npm run dev
```

Perintah `npm run dev` menjalankan:

- backend Python: `server/main.py`
- frontend Vite: `npm run dev:web`

URL lokal:

```text
Frontend: http://localhost:5173
Admin:    http://localhost:5173/admin
Backend:  http://127.0.0.1:8000/make-server-32aa5c5c
```

Perintah lain:

```bash
npm run api       # backend saja
npm run dev:web   # frontend saja
npm run build     # production build frontend
python smoketest.py
```

Windows helper:

```bat
start_server.bat --check
backup_database.bat --check
```

## Environment Variable Penting

Contoh konfigurasi ada di `.env.example`. Untuk lokal bisa dibuat `.env.local`.

| Env | Fungsi |
|---|---|
| `SIMRP_ENV` | Mode `development` atau `production` |
| `SIMRP_DB_PATH` | Path file SQLite |
| `SIMRP_HOST` | Host backend |
| `SIMRP_PORT` | Port backend |
| `SIMRP_ADMIN_LOGIN_USERNAME` | Username portal admin |
| `SIMRP_ADMIN_LOGIN_PASSWORD` | Password portal admin |
| `SIMRP_ENABLE_DEMO_SEED` | Mengaktifkan seed data demo |
| `SIMRP_DEMO_PASSWORD` | Password akun demo |
| `SIMRP_SEED_ADMIN_PASSWORD` | Password akun admin bootstrap |
| `SIMRP_ALLOWED_ORIGINS` | Allowlist CORS production |
| `SIMRP_PBKDF2_ITERATIONS` | Jumlah iterasi PBKDF2 |
| `SIMRP_SESSION_TTL_HOURS` | Masa aktif session |
| `SIMRP_RATE_LIMIT_WINDOW_SECONDS` | Window rate limit |
| `SIMRP_RATE_LIMIT_AUTH_MAX` | Batas request auth per window |
| `SIMRP_RATE_LIMIT_MUTATION_MAX` | Batas request mutasi per window |
| `SIMRP_MAX_BODY_BYTES` | Batas ukuran body request |
| `VITE_API_BASE_URL` | Base URL API untuk frontend |

Jika credential penting tidak diisi saat development, backend akan membuat credential acak dan menulisnya ke:

```text
database/runtime/dev_credentials.txt
```

File tersebut tidak boleh di-commit.

## Demo Accounts

Jika `SIMRP_ENABLE_DEMO_SEED=true`, sistem membuat akun demo berikut:

| Nama | Email | Role |
|---|---|---|
| Andi Relawan | `relawan.demo@simrp.app` | Relawan |
| Nia Relawan | `relawan2.demo@simrp.app` | Relawan |
| Budi Relawan | `relawan3.demo@simrp.app` | Relawan |
| Kak Esa | `ksh.demo@simrp.app` | KSH |
| Pak Raka ASN | `moderator1.demo@simrp.app` | ASN Tier 1 |
| Bu Sinta Lurah | `moderator2.demo@simrp.app` | Lurah / Moderator Tier 2 |
| Pak Dimas Camat | `moderator2.camat@simrp.app` | Camat / Moderator Tier 2 |
| Pak Arif | `moderator3.demo@simrp.app` | Moderator Tier 3 |
| Administrator | `admin@simrp.local` | Admin |

Password demo diambil dari `SIMRP_DEMO_PASSWORD` atau dibuat otomatis di `database/runtime/dev_credentials.txt` untuk development.

Portal admin memakai:

```text
URL: /admin
Username: SIMRP_ADMIN_LOGIN_USERNAME
Password: SIMRP_ADMIN_LOGIN_PASSWORD
```

## Arsitektur Folder Aktual

```text
server/
  main.py                  Entry point HTTP server, dispatch API, CORS, session, dependency wiring
  api/
    __init__.py
    auth.py                Signup, login, admin login, logout, auth/me
    events.py              Event list/create/update/approval/publish/join/attendance/complete
    reports.py             Report list/create/review/verify/reject, XP, certificate trigger
    collaboration.py       Public mitra request dan approval
    geographic.py          Geo options, kodepos, kampung, pillar XP
    admin.py               Admin role dan temporary adjustments
    notifications.py       Notification list/count/read
    certificates.py        Certificate list/verify/download HTML
    rewards.py             Reward catalog dan voucher GoBis redeem
    users.py               Users, health, participations, landing leaderboard, recommendations stub
  core/
    config.py              Konfigurasi, env, constants, valid values
    database.py            Core database helper compatibility
    security.py            Security helper compatibility
    utils.py               Helper murni: env flag, waktu, validasi email/password, bounded text
  db/
    schema.py              Base schema SQLite
    migrations.py          Migration incremental
    seed.py                Seed role, geography, admin, demo user/event/voucher
  services/
    runtime.py             Session, password hash, audit, notification, geo parser, XP, cleanup adjustment
    rate_limiter.py        Rate limiter thread-safe
  legacy/
    api_xp.py              Legacy XP API yang tidak dipakai runtime aktif
    main_test.py           Legacy backend lama

src/
  app/
    App.tsx                SPA router berbasis state, session bootstrap, POV dashboard switch
    components/
      LandingPage.tsx
      LoginPage.tsx
      RegisterPage.tsx
      UserDashboard.tsx
      ModeratorDashboard.tsx
      AdminDashboard.tsx
      AdminGodMode.tsx
      ReportingWizard.tsx
      UserProfile.tsx
      RankCard.tsx
      PillarRadarChart.tsx
      admin/               Modul dashboard admin database-style
      moderator/           Modul dashboard moderator
      user/                Modul dashboard user: event, report, sertifikat, reward, attendance, leaderboard
      landing/             Section landing page
      ui/                  Shared UI primitives dan navbar
  data/
    geographicData.ts      Data kecamatan, kelurahan, kodepos Surabaya
    levelingSystem.ts      Level, rank, multiplier
    validatedBadges.ts     Badge statis terverifikasi
  lib/
    api.ts                 Centralized API client
  types/
    index.ts               Type definitions sinkron dengan payload backend aktif
```

## Arsitektur Backend

Backend berjalan dari `server/main.py`. File ini:

- memuat `.env.local` dan `.env`;
- membaca konfigurasi runtime;
- membuka koneksi SQLite;
- membuat schema, migration, dan seed awal;
- menambahkan security headers dan CORS;
- melakukan rate limiting;
- membaca session bearer token;
- membuat dependency dictionary untuk modul API;
- mendispatch request ke `server/api/*`;
- menutup koneksi DB setelah request selesai.

Modularisasi backend sudah memindahkan sebagian besar logic:

- schema ke `server/db/schema.py`;
- migration ke `server/db/migrations.py`;
- seed ke `server/db/seed.py`;
- helper runtime ke `server/services/runtime.py`;
- rate limiter ke `server/services/rate_limiter.py`;
- endpoint aktif ke `server/api/*`.

Hasilnya, `server/main.py` tidak lagi menjadi file raksasa 1500+ baris. Saat README ini dibuat, ukurannya sekitar 688 baris.

## Arsitektur Frontend

Frontend memakai routing berbasis state di `src/app/App.tsx`, bukan React Router. App membaca session token dari `localStorage`, memvalidasi ke `/auth/me`, lalu memilih dashboard berdasarkan role dan current view.

Halaman utama:

- Landing page publik.
- Login relawan/moderator.
- Admin login.
- Register.
- Collaboration page.
- About dan FAQ.
- User dashboard.
- Moderator dashboard.
- Admin dashboard.
- Not found page.

Dashboard:

- `UserDashboard.tsx`: shell dashboard user yang merangkai modul `src/app/components/user/*`.
- `ModeratorDashboard.tsx`: sudah dipisah ke modul `src/app/components/moderator/*`.
- `AdminDashboard.tsx`: sudah dipisah dan dibuat database-style di `src/app/components/admin/*`.

Centralized API client ada di `src/lib/api.ts`. Fungsi utama:

- `apiGet`
- `apiPost`
- `apiPut`
- `apiDownload`
- `apiPublicGet`
- `apiPublicPost`
- `setOnUnauthorized`

## Alur Bisnis Utama

### 1. Auth dan Session

Alur:

1. User register atau login via email/password.
2. Backend memvalidasi email/password.
3. Password dicocokkan dengan PBKDF2 hash.
4. Backend membuat token session.
5. Frontend menyimpan token di localStorage.
6. Request berikutnya memakai header `Authorization: Bearer <token>`.
7. `/auth/me` dipakai untuk bootstrap session.

Admin login terpisah:

- endpoint: `POST /auth/admin-login`
- credential berasal dari env `SIMRP_ADMIN_LOGIN_USERNAME` dan `SIMRP_ADMIN_LOGIN_PASSWORD`
- setelah valid, backend membuat session untuk akun admin di tabel users

### 2. Event

Alur event:

```text
draft -> approved -> published -> completed
```

Penjelasan:

- ASN Tier 1/Admin membuat event draft.
- Lurah/Camat/Admin melakukan approval.
- Event approved harus dipublish eksplisit melalui endpoint publish.
- Relawan/KSH hanya bisa melihat dan join event yang published/completed sesuai scope wilayah.
- KSH dapat menandai attendance dan complete event.

Scope event:

- `kelurahan`
- `kecamatan`

Pilar event:

1. Lingkungan
2. Gotong Royong
3. Ekonomi Kreatif
4. Keamanan

### 3. Partisipasi

Relawan/KSH dapat join event. Data masuk ke tabel `event_participation`.

Status partisipasi:

- `registered`
- `attended`
- `reported`

KSH dapat menandai peserta hadir melalui endpoint attendance, lalu menandai event selesai dengan output summary.

### 4. Laporan

Alur laporan:

```text
pending -> under_review -> verified/rejected
```

Syarat submit laporan:

- user harus role `user` atau `ksh`;
- event harus sudah `completed`;
- user harus terdaftar di event;
- user harus sudah ditandai hadir;
- user hanya bisa submit satu laporan per event.

Verifikasi laporan:

- Admin dapat memverifikasi semua laporan.
- Moderator Tier 2 hanya dapat memverifikasi sesuai scope:
  - Lurah: event scope kelurahan sesuai kelurahan moderator.
  - Camat: event scope kecamatan sesuai kecamatan moderator.

Jika laporan disetujui:

- status menjadi `verified`;
- XP kampung/pilar dihitung;
- poin user bertambah;
- certificate dibuat;
- notifikasi dibuat;
- audit log dicatat.

Jika ditolak:

- status menjadi `rejected`;
- alasan penolakan disimpan;
- notifikasi dibuat;
- audit log dicatat.

### 5. XP dan Leaderboard

XP dihitung berdasarkan:

- event pillar;
- jumlah peserta;
- distribusi XP antar pilar.

Tabel terkait:

- `xp_kelurahan`
- `xp_pillar`

Frontend menampilkan:

- leaderboard kampung;
- radar chart empat pilar;
- rank card user;
- top relawan di admin dashboard.

### 6. Sertifikat Digital

Sertifikat dibuat setelah laporan diverifikasi. Data disimpan di tabel `certificates`.

Fitur:

- daftar sertifikat user;
- modal preview sertifikat di dashboard user;
- download sertifikat sebagai HTML siap print/PDF;
- public verify endpoint berdasarkan ID sertifikat;
- certificate hash sebagai bukti verifikasi.

Endpoint:

- `GET /certificates`
- `GET /certificates/{id}/verify`
- `GET /certificates/{id}/download`

Keamanan:

- download butuh auth;
- hanya pemilik sertifikat atau admin yang boleh download;
- output HTML di-escape untuk mencegah XSS;
- filename disanitasi.

### 7. Reward Voucher

Reward menggunakan XP user untuk menukar voucher.

Saat ini seed voucher diarahkan ke konteks transportasi:

- Voucher GoBis Rp 10.000
- Voucher GoBis Rp 25.000

Narasi produk:

Voucher dapat ditukarkan di aplikasi GoBis sebagai akses tiket Suroboyo Bus dan layanan angkutan publik terkait.

Endpoint:

- `GET /rewards/catalog`
- `POST /rewards/redeem`

Proteksi:

- user harus login;
- stok harus tersedia;
- XP harus cukup;
- update stok dan poin dilakukan server-side;
- kode voucher dibuat acak dengan prefix `GOBIS-SIMRP-`;
- remaining points di-clamp agar tidak minus.

### 8. Kolaborasi Mitra

Public form kolaborasi memungkinkan organisasi/mitra menawarkan dukungan.

Data yang dicatat:

- nama organisasi;
- PIC;
- email;
- jenis dukungan;
- scope kontribusi;
- deskripsi dukungan;
- status review.

Support type:

- `dana`
- `konsumsi`
- `peralatan`
- `media_partner`
- `lainnya`

Approval dilakukan oleh moderator/admin. Saat approve/reject, backend memiliki stub email agar flow siap dikembangkan ke SMTP nyata.

### 9. Notifikasi

Notifikasi disimpan di tabel `notifications`.

Dipakai untuk:

- event approval/publish;
- report review/verify/reject;
- certificate;
- reward redeem;
- collaboration review.

Frontend navbar desktop dan mobile memakai hook bersama `useNotifications()` agar polling, unread count, dan mark-read konsisten.

### 10. Admin Dashboard

Admin dashboard terbaru sudah diubah menjadi database-style interface.

Fitur admin:

- overview metrik;
- database pengguna dengan view Relawan, ASN/Moderator, Admin, Semua;
- search, filter, grouping, sorting;
- database event;
- database laporan;
- verifikasi laporan;
- Kontrol Admin untuk role assignment dan temporary adjustment berbasis audit.

Perbaikan penting:

- Top 10 Relawan hanya menghitung user relawan/KSH, bukan ASN/admin.
- Poin yang tampil di-clamp agar tidak minus.
- UI menggunakan dark theme dengan kontras tinggi.
- Data relawan dipisahkan dari data ASN/moderator/admin.

## API Runtime Aktual

Base URL default:

```text
http://127.0.0.1:8000/make-server-32aa5c5c
```

| Area | Method | Endpoint | Keterangan |
|---|---:|---|---|
| Health | GET | `/health` | Cek server |
| Auth | GET | `/auth/me` | Session bootstrap |
| Auth | POST | `/auth/signup` | Registrasi user |
| Auth | POST | `/auth/login` | Login user/moderator |
| Auth | POST | `/auth/admin-login` | Login admin portal |
| Auth | POST/DELETE | `/auth/logout` | Logout |
| Users | GET | `/users` | List user, difilter RBAC |
| Users | PUT | `/users/{id}` | Update profil user |
| Users | GET | `/users/me/participations` | Riwayat event user |
| Events | GET | `/events` | List event, difilter RBAC |
| Events | POST | `/events` | Buat draft event |
| Events | PUT | `/events/{id}` | Edit event |
| Events | POST | `/events/{id}/approval` | Approve/reject event |
| Events | POST | `/events/{id}/publish` | Publish event approved |
| Events | POST | `/events/{id}/join` | Join event |
| Events | POST | `/events/{id}/attendance` | Tandai kehadiran |
| Events | POST | `/events/{id}/complete` | Complete event |
| Reports | GET | `/reports` | List laporan, difilter RBAC |
| Reports | POST | `/reports` | Submit laporan |
| Reports | POST | `/reports/{id}/review` | Set under_review |
| Reports | POST | `/reports/{id}/verify` | Approve/reject laporan |
| Collaboration | GET | `/collaboration-requests` | List request mitra |
| Collaboration | POST | `/collaboration-requests` | Public submit mitra |
| Collaboration | POST | `/collaboration-requests/{id}/approval` | Review mitra |
| Notifications | GET | `/notifications/count` | Count unread |
| Notifications | GET | `/notifications` | List notifikasi |
| Notifications | POST | `/notifications/{id}/read` | Mark read |
| Certificates | GET | `/certificates` | List sertifikat user |
| Certificates | GET | `/certificates/{id}/verify` | Public verify sertifikat |
| Certificates | GET | `/certificates/{id}/download` | Download HTML sertifikat |
| Rewards | GET | `/rewards/catalog` | Katalog voucher |
| Rewards | POST | `/rewards/redeem` | Redeem voucher |
| Geographic | GET | `/geo/options` | Kecamatan/kelurahan/kodepos |
| Geographic | GET | `/geo/stats` | Statistik geo |
| Geographic | GET | `/kodepos/{code}` | Lookup kodepos |
| Kampung | GET | `/kampung` | List kampung dan XP |
| Kampung | GET | `/kampung/{id}/pillars` | XP empat pilar |
| Landing | GET | `/landing/leaderboard` | Public leaderboard |
| Recommendations | GET/POST | `/recommendations` | Stub 410/off-system |

## Database Schema

Tabel utama:

| Tabel | Fungsi |
|---|---|
| `roles` | Daftar role |
| `role_attributes` | Atribut role tambahan |
| `kecamatan` | Master kecamatan |
| `kelurahan` | Master kelurahan |
| `postal_codes` | Master kodepos |
| `kampung_mapping` | Mapping kelurahan-kodepos |
| `users` | Data akun, role, wilayah, poin, badge |
| `events` | Data kegiatan |
| `event_participation` | Pendaftaran/hadir/lapor event |
| `event_reports` | Laporan kegiatan |
| `xp_kelurahan` | Total XP kelurahan |
| `xp_pillar` | XP per pilar per kelurahan |
| `audit_logs` | Audit trail admin/moderasi |
| `collaboration_requests` | Pengajuan mitra |
| `notifications` | Notifikasi in-app |
| `certificates` | Sertifikat digital |
| `voucher_catalog` | Katalog voucher |
| `voucher_redemptions` | Riwayat redeem voucher |
| `sessions` | Token session |
| `temporary_adjustments` | Adjustment poin/badge sementara |

Default DB:

```text
database/runtime/database.db
```

Runtime DB, backup DB, env lokal, dan credential lokal tidak boleh masuk Git.

## Keamanan dan Validasi

Keamanan yang sudah diterapkan:

- Password hashing memakai PBKDF2-HMAC-SHA256.
- Session token disimpan di tabel `sessions`.
- Auth memakai bearer token.
- RBAC dicek server-side.
- User biasa hanya bisa melihat data sesuai haknya.
- KSH dibatasi ke wilayahnya.
- Moderator Tier 2 dibatasi scope wilayah saat verifikasi laporan.
- Admin-only endpoint dicek role admin.
- SQL memakai parameterized query.
- Input text dibatasi dengan helper `bounded_text`.
- Email/password divalidasi.
- Request body dibatasi dengan `SIMRP_MAX_BODY_BYTES`.
- Rate limiting untuk auth dan mutation.
- Security headers:
  - `X-Content-Type-Options`
  - `X-Frame-Options`
  - `Referrer-Policy`
  - `Permissions-Policy`
  - `Cache-Control`
  - HSTS dan CSP saat production
- CORS berbasis allowlist.
- Error production dibuat generik agar tidak bocor detail internal.
- Audit log untuk aksi penting.
- Download sertifikat tidak memakai token di URL, tetapi header Authorization.
- Poin user di UI dan beberapa jalur backend di-clamp agar tidak minus.

## Validasi dan Smoke Test

Validasi frontend:

```bash
npm run build
```

Validasi backend dasar:

```bash
python -m py_compile server/main.py
python -m py_compile server/api/auth.py server/api/events.py server/api/reports.py
python -m py_compile server/api/users.py server/api/certificates.py server/api/rewards.py
```

Full smoke test:

```bash
python smoketest.py
```

Smoke test mencakup:

- health;
- auth;
- event approve/publish;
- join;
- RBAC boundary;
- report;
- certificate;
- reward;
- notifications.

Pada validasi backend sebelumnya, smoke test utama pernah berjalan dengan `59 PASS / 0 FAIL`, ditambah supplemental flow `24 PASS / 0 FAIL`.

## Perkembangan Refactor

Ringkasan pekerjaan yang sudah dilakukan:

1. Memindahkan endpoint utama dari `server/main.py` ke `server/api/*`.
2. Menambahkan fitur publish gate event.
3. Menambahkan status `under_review` untuk laporan.
4. Menambahkan endpoint download sertifikat.
5. Menambahkan stub email untuk approval mitra.
6. Memperbaiki env admin password.
7. Memperketat RBAC users/reports/events.
8. Memperbaiki migration `event_reports_legacy`.
9. Memperbaiki scope verifier laporan.
10. Menambahkan tombol publish di moderator dashboard.
11. Membersihkan backup database dari repo.
12. Memperbaiki start/backup script.
13. Memperbaiki smoketest.
14. Memindahkan schema/migration/seed ke `server/db/*`.
15. Memindahkan service logic ke `server/services/*`.
16. Mengurangi dependency dictionary di `server/main.py`.
17. Memindahkan legacy backend ke `server/legacy/*`.
18. Menambahkan halaman Event Saya.
19. Menambahkan timeline status laporan.
20. Menambahkan rank card.
21. Menambahkan UI sertifikat dan download flow.
22. Memecah moderator dashboard menjadi modul kecil.
23. Merapikan admin dashboard menjadi database-style UI.
24. Menyesuaikan reward voucher menjadi konteks GoBis/Suroboyo Bus.
25. Memperbaiki preview sertifikat agar bukan hanya credential/hash.
26. Memperbaiki hero mobile agar animasi desktop tidak dipaksakan ke mobile.
27. Memecah user dashboard menjadi modul events, reports, certificates, rewards, attendance, leaderboard, dan data hook.
28. Mengekstrak shared notification hook untuk desktop/mobile navbar.
29. Menyinkronkan `src/types/index.ts` dengan payload backend aktif.
30. Membersihkan repository dari dokumen lama, agent artifacts, dan komponen contoh yang tidak dipakai.

## Catatan Kode Saat Ini

Kondisi penting yang perlu diketahui:

- `UserDashboard.tsx` sekarang menjadi shell sekitar 198 baris; logic domain berada di `src/app/components/user/*`.
- Notification logic desktop/mobile sudah disatukan di `src/app/components/ui/useNotifications.ts`.
- `src/types/index.ts` sudah disinkronkan dengan payload backend aktif.
- Beberapa modul API masih menyimpan sisa route dictionary/handler lama sebagai compatibility/legacy, tetapi runtime aktif menggunakan `handle_get`, `handle_post`, `handle_put`, dan `handle_delete` yang dipanggil dari `server/main.py`.
- Dokumen publik aktif berada di README root, `docs/`, `DEMO_ACCOUNTS.md`, `CONTRIBUTOR_SETUP_GUIDE.md`, `SECURITY.md`, `CHANGELOG.md`, dan `CONTRIBUTING.md`.

## Roadmap Lanjutan

Task lanjutan yang masih relevan:

1. Tambahkan automated frontend component/e2e tests untuk dashboard utama.
2. Tambahkan monitoring/log rotation untuk deployment sungguhan.
3. Evaluasi migrasi database dari SQLite ke database terkelola jika volume warga besar.
4. Integrasikan SMTP/email nyata jika approval mitra perlu notifikasi eksternal.
5. Integrasikan API resmi GoBis bila reward voucher ingin menjadi transaksi nyata.

## Production Checklist

Sebelum dipakai di luar lokal:

1. Set `SIMRP_ENV=production`.
2. Set `SIMRP_ADMIN_LOGIN_USERNAME`.
3. Set `SIMRP_ADMIN_LOGIN_PASSWORD` dengan password kuat.
4. Set `SIMRP_ENABLE_DEMO_SEED=false` kecuali memang untuk demo.
5. Jika demo seed production aktif, set `SIMRP_DEMO_PASSWORD`.
6. Set `SIMRP_SEED_ADMIN_PASSWORD` bila ingin password admin bootstrap terpisah.
7. Naikkan `SIMRP_PBKDF2_ITERATIONS` ke 600000 atau lebih sesuai kemampuan server.
8. Set `SIMRP_ALLOWED_ORIGINS` ke domain frontend resmi.
9. Jalankan backend di balik reverse proxy TLS.
10. Jangan expose `.env`, database runtime, backup, atau `dev_credentials.txt`.
11. Siapkan backup database rutin.
12. Jalankan `npm run build` dan `python smoketest.py`.

## Konteks untuk Laporan KP

Bagian ini dapat dipakai sebagai bahan awal penulisan laporan KP.

### Judul yang Cocok

Pengembangan Prototype Sistem Informasi Manajemen Rekap Partisipatif Berbasis Web untuk Pendataan Kegiatan Warga dan Apresiasi Relawan.

### Latar Belakang

Kegiatan warga di tingkat kampung sering membutuhkan pencatatan peserta, verifikasi laporan, rekap kontribusi, dan apresiasi kepada relawan. Jika proses masih dilakukan manual, data mudah tercecer, sulit diverifikasi, dan lambat direkap. SIMRP dikembangkan sebagai prototype aplikasi web untuk mendigitalisasi alur partisipasi tersebut, mulai dari pembuatan kegiatan, pendaftaran relawan, pencatatan kehadiran, pelaporan hasil kegiatan, validasi oleh aparatur wilayah, sampai pemberian sertifikat dan reward.

### Rumusan Masalah

1. Bagaimana merancang sistem yang dapat mengelola kegiatan partisipatif warga?
2. Bagaimana membangun alur verifikasi laporan berbasis role dan wilayah?
3. Bagaimana menerapkan sistem poin/XP sebagai bentuk apresiasi kontribusi?
4. Bagaimana menyediakan sertifikat digital dan reward voucher sebagai output partisipasi?
5. Bagaimana membuat dashboard yang memudahkan relawan, moderator, dan admin?

### Tujuan Pengembangan

1. Membuat prototype sistem informasi partisipasi warga berbasis web.
2. Mengimplementasikan autentikasi dan role-based access control.
3. Mengelola event, partisipasi, attendance, laporan, dan verifikasi.
4. Menghasilkan XP, leaderboard, sertifikat, notifikasi, dan reward voucher.
5. Meningkatkan struktur kode melalui modularisasi backend dan frontend.

### Ruang Lingkup

Ruang lingkup meliputi frontend React, backend Python native HTTP server, database SQLite, dashboard user/moderator/admin, endpoint API, sistem role, event workflow, report workflow, certificate, reward, notification, audit log, dan script validasi.

Di luar ruang lingkup prototype:

- integrasi SMTP email nyata;
- deployment production penuh;
- payment gateway;
- integrasi resmi API GoBis;
- digital signature sertifikat tingkat legal formal;
- multi-tenant production architecture.

### Metode Pengembangan

Pengembangan dilakukan secara iteratif:

1. Audit struktur project.
2. Refactor backend dari monolit ke modul API.
3. Penambahan fitur backend prioritas.
4. Perbaikan RBAC dan migration.
5. Modularisasi schema, migration, seed, dan service.
6. Pengembangan fitur frontend.
7. Refactor dashboard.
8. Validasi build dan smoke test.
9. Penyusunan dokumentasi release-readiness.

### Hasil Implementasi

Hasil implementasi berupa aplikasi web prototype SIMRP dengan:

- landing page publik;
- auth user dan admin;
- dashboard relawan/KSH;
- dashboard moderator;
- dashboard admin database-style;
- event lifecycle;
- attendance;
- report lifecycle;
- XP dan leaderboard;
- sertifikat digital;
- voucher GoBis;
- notifikasi;
- audit log;
- database SQLite;
- script dev lokal;
- smoke test.

### Kontribusi Teknis Pengembang

Kontribusi pengembangan yang dapat dicatat:

- merancang alur role relawan, KSH, moderator, admin;
- membangun backend API berbasis Python stdlib;
- membuat schema SQLite untuk user, event, report, XP, certificate, reward, notification, audit;
- memodularisasi endpoint ke `server/api/*`;
- memodularisasi schema/migration/seed ke `server/db/*`;
- memodularisasi service helper ke `server/services/*`;
- memperbaiki RBAC dan scope wilayah;
- membuat frontend dashboard sesuai role;
- menambahkan sertifikat digital dan voucher reward;
- membuat admin dashboard bergaya database untuk pengelolaan data;
- menambahkan validasi build dan smoke test.

## Catatan Git Ignore dan File Lokal

File yang tidak boleh ikut commit:

- `.env`
- `.env.local`
- database runtime
- backup database
- credential lokal
- log runtime

Contoh path:

```text
database/runtime/
database/backups/
database/runtime/dev_credentials.txt
```

## Status Akhir Dokumen

README ini diperbarui berdasarkan analisis kode aktual di folder `src/` dan `server/` pada 2026-05-30. Dokumen ini dapat digunakan sebagai sumber konteks teknis untuk diskusi, demo prototype, atau penyusunan laporan KP.
