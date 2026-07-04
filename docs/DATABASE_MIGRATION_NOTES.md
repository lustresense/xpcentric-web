# Database Migration Notes

Dokumen ini membantu tim teknis menyiapkan migrasi dari SQLite prototype ke PostgreSQL/MySQL jika sistem dilanjutkan ke produksi.

## Posisi Saat Ini

- Runtime aktif memakai SQLite.
- Schema dikelola di `server/db/schema.py`.
- Migration incremental berada di `server/db/migrations.py`.
- Seed master/demo berada di `server/db/seed.py`.
- Export schema tersedia di `database/schema/simrekap_schema.sql`.

## Kapan Perlu Migrasi

Migrasi direkomendasikan jika:

- jumlah user dan request meningkat signifikan;
- perlu high availability;
- perlu backup/restore production-grade;
- perlu audit dan reporting skala besar;
- SQLite lock/contention mulai terasa;
- deployment menjadi multi-instance.

## Strategi Bertahap

1. Freeze schema SQLite yang aktif.
2. Mapping tipe data SQLite ke target database.
3. Pisahkan seed master dan seed demo.
4. Buat migration target database.
5. Export data dari SQLite.
6. Transform data dan validasi foreign key.
7. Jalankan shadow test API.
8. Cutover saat data valid.

## Mapping Tipe Data

| SQLite | PostgreSQL/MySQL target |
|---|---|
| `TEXT` id UUID | `uuid` atau `varchar(36)` |
| `INTEGER` boolean | `boolean` |
| `TEXT` timestamp ISO | `timestamptz` / `datetime` |
| `TEXT` JSON | `jsonb` / `json` |
| `INTEGER PRIMARY KEY AUTOINCREMENT` | `serial` / `bigserial` / identity |

## Area Yang Perlu Perhatian

- Public id sekarang sebagian memakai `TEXT`, sebagian master data memakai integer.
- Timestamp masih ISO string.
- `badges_json`, `checklist_json`, `outcome_tags_json`, dan `payload_json` perlu tipe JSON native bila tersedia.
- Foreign key harus tetap aktif.
- Unique index partial `idx_access_requests_pending_role` perlu disesuaikan jika target database berbeda.

## Validasi Migrasi

Minimal cek:

- jumlah row per tabel sama;
- foreign key valid;
- semua akun demo bisa login di environment test;
- event/report/certificate/reward flow berjalan;
- RBAC dan scope wilayah tidak berubah;
- smoke test lolos.

## Batas Roadmap

Migrasi database bukan prasyarat demo KP. Migrasi menjadi prioritas ketika sistem akan dipakai sebagai layanan publik dengan traffic dan data nyata.
