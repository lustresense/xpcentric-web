# Maintainer Guide

Dokumen ini menjelaskan cara merawat kode SIMREKAP agar developer berikutnya mudah membaca, mengubah, dan memvalidasi project tanpa merusak alur bisnis utama.

## Prinsip Maintainer

- Baca `AGENTS.md` sebelum mengubah source.
- Jangan ubah role hierarchy, API prefix, atau flow bisnis utama tanpa keputusan eksplisit.
- Jaga perubahan tetap kecil dan bisa divalidasi.
- Untuk backend, baca modul API dan service terkait sebelum edit.
- Untuk frontend, ikuti pola komponen yang sudah ada sebelum membuat pola baru.
- Jangan commit `.env`, database runtime, backup, credential lokal, atau task log lokal.

## Struktur Kode

```text
server/
  main.py              Entry point HTTP server dan request dispatch
  api/                 Handler endpoint per domain
  core/                Helper murni dan konfigurasi
  db/                  Schema, migration, seed
  services/            Runtime services: auth/session/audit/xp/notification/rate limit
  legacy/              Kode lama yang tidak dipakai runtime aktif

src/
  app/App.tsx          Router SPA berbasis state
  app/components/      Halaman, dashboard, dan komponen UI
  app/components/user/ Modul dashboard relawan/KSH
  app/components/moderator/ Modul dashboard moderator
  app/components/admin/ Modul dashboard admin
  lib/api.ts           API client terpusat
  types/index.ts       Type payload frontend
```

## Aturan Backend

- Endpoint aktif berada di `server/api/*` dan dipanggil dari `server/main.py`.
- Tambahkan dependency runtime melalui dependency dict di `server/main.py`, bukan import acak lintas modul.
- Semua SQL harus parameterized.
- Validasi input dengan helper seperti `bounded_text`, `parse_json_body`, dan validator domain yang sudah ada.
- RBAC wajib dicek di server, bukan hanya di frontend.
- Endpoint list besar sebaiknya mendukung `limit`, `offset`, dan metadata `pagination`.
- Search query wajib dibatasi panjang input dan tetap memakai parameterized `LIKE`.
- Jangan menulis secret, token, atau stack trace sensitif ke response.

## Aturan Frontend

- Semua request API lewat `src/lib/api.ts` atau hook/helper dashboard yang memakai fungsi tersebut.
- Dashboard besar dipisahkan berdasarkan domain, bukan ditumpuk di satu file.
- Loading, empty state, dan error state harus ada pada flow utama.
- UI admin memakai pola database-style: searchable, filterable, sortable, dan role-aware.
- Mobile tidak boleh memaksa animasi desktop jika membuat layout sempit atau teks tidak terbaca.

## Validasi Sebelum Commit

Jika backend berubah:

```bash
python -m py_compile server/main.py
python -m py_compile server/api/auth.py server/api/events.py server/api/reports.py
python -m py_compile server/api/users.py server/api/certificates.py server/api/rewards.py
```

Jika frontend berubah:

```bash
npm run build
```

Jika flow besar berubah:

```bash
npm run smoke
```

Sebelum push:

```bash
git diff --check
git status --short
```

## Area Prototype

Area berikut sengaja masih prototype dan perlu keputusan tambahan sebelum layanan publik:

- Voucher GoBis masih simulasi in-app, belum integrasi API resmi.
- Sertifikat adalah HTML siap cetak, belum tanda tangan digital resmi.
- Email mitra masih stub, belum SMTP nyata.
- SQLite cocok untuk demo/pilot terbatas, bukan klaim skala kota tanpa evaluasi operasi.
- Compliance UU PDP perlu review legal terpisah sebelum produksi publik.

## Checklist Saat Menambah Endpoint

1. Tambahkan handler di modul `server/api/*`.
2. Wire ke dispatch `server/main.py` bila domain baru.
3. Validasi auth dan RBAC.
4. Validasi body/query/path param.
5. Pakai SQL parameterized.
6. Tambahkan audit/notification bila aksi penting.
7. Tambahkan dokumentasi di `docs/API_REFERENCE.md`.
8. Jalankan py_compile dan smoke test relevan.
