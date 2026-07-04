# SIMREKAP Seed Reference

Seed data aktif berada di:

```text
server/db/seed.py
```

## Seed Master

- `roles`
- `kecamatan`
- `kelurahan`
- `postal_codes`
- `kampung_mapping`
- `xp_kelurahan`
- `xp_pillar`

Master wilayah dibaca dari:

```text
src/data/geographicData.ts
```

## Seed Demo

Seed demo aktif jika:

```text
SIMRP_ENABLE_DEMO_SEED=true
```

Demo users:

- `relawan.demo@simrp.app`
- `relawan2.demo@simrp.app`
- `relawan3.demo@simrp.app`
- `ksh.demo@simrp.app`
- `moderator1.demo@simrp.app`
- `moderator2.demo@simrp.app`
- `moderator2.camat@simrp.app`
- `moderator3.demo@simrp.app`
- `admin@simrp.local`

Demo events:

- Aksi Bersih Taman Kampung
- Pelatihan UMKM Digital
- Forum Guyub Warga
- Festival Seni Kampung

Demo collaboration:

- Komunitas Hijau Surabaya
- PT Sejahtera Pangan

Demo voucher:

- Voucher GoBis Rp 10.000
- Voucher GoBis Rp 25.000

## Password

Runtime demo membaca `SIMRP_DEMO_PASSWORD`. Jika env tidak diisi pada development, backend membuat credential lokal di `database/runtime/dev_credentials.txt`.

Sample DB repository memakai password demo yang sengaja non-pribadi:

```text
SIMREKAP-Demo-2026!
```
