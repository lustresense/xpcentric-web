# Handover Checklist

Checklist ini dipakai saat repository diserahkan ke tim teknis berikutnya.

## Repository

- [ ] Repository aktif adalah `lustresense/xpcentric-web`.
- [ ] Branch aktif adalah `main`.
- [ ] `README.md` sudah dibaca.
- [ ] `docs/README.md` sudah dibaca sebagai index dokumentasi.
- [ ] `LICENSE.md` sudah dipahami.
- [ ] Tidak ada `.env`, credential lokal, runtime DB, atau backup DB yang ikut commit.

## Setup Lokal

- [ ] Node.js dan Python tersedia.
- [ ] `npm install` berhasil.
- [ ] `npm run dev` berhasil.
- [ ] Frontend terbuka di `http://localhost:5173`.
- [ ] Backend health check berhasil.
- [ ] Credential development diketahui dari env atau `database/runtime/dev_credentials.txt`.

## Database

- [ ] `docs/DATABASE_SCHEMA.md` dibaca.
- [ ] `database/schema/simrekap_schema.sql` tersedia.
- [ ] `database/sample/simrekap_demo.sqlite` bisa dibuka.
- [ ] Tim memahami bahwa runtime DB asli tidak di-commit.
- [ ] Tim mengganti credential sebelum deployment resmi.

## Demo Flow

- [ ] Login relawan demo.
- [ ] Register relawan baru.
- [ ] Ajukan akses KSH/moderator melalui `/access`.
- [ ] Admin approve/reject access request.
- [ ] Buat dan publish event.
- [ ] Join event dan attendance.
- [ ] Submit report dan verify.
- [ ] Preview/download certificate.
- [ ] Redeem voucher demo.

## Deployment

- [ ] Docker Desktop/Engine tersedia.
- [ ] `docker compose pull` berhasil.
- [ ] `docker compose up -d` berhasil.
- [ ] Port `7761` aktif.
- [ ] Cloudflare Quick Tunnel aktif jika perlu akses HP.
- [ ] Volume SQLite dipahami sebagai data persisten.

## Security

- [ ] `SECURITY.md` dibaca.
- [ ] `docs/handover/SECURITY_RATIONALE.md` dibaca.
- [ ] Admin password diganti.
- [ ] Demo seed dimatikan untuk production warga nyata.
- [ ] OTP dev tidak dipakai untuk production.
- [ ] Backup database disiapkan.

## Production Gap

- [ ] `docs/PRODUCTION_GAP_ROADMAP.md` dibaca.
- [ ] Keputusan migrasi database ditentukan.
- [ ] Provider OTP/identity ditentukan.
- [ ] Integrasi GoBis resmi ditentukan jika reward akan nyata.
- [ ] Legal/privacy review dilakukan.
