# Prosedur Pengembangan

Dokumen ini menjelaskan pola kerja pengembangan SIMREKAP agar perubahan berikutnya tetap terstruktur.

## 1. Analisis Kebutuhan

Setiap perubahan dimulai dari:

- aktor yang terdampak;
- masalah yang ingin diselesaikan;
- flow bisnis yang berubah;
- data yang perlu disimpan;
- endpoint/API yang diperlukan;
- risiko keamanan dan operasional.

Output minimum:

- user story atau use case;
- acceptance criteria;
- catatan role/RBAC;
- catatan data model.

## 2. Desain Teknis

Untuk backend:

- endpoint baru masuk `server/api/*`;
- schema/migration masuk `server/db/*`;
- helper umum masuk `server/services/*` atau `server/core/*`;
- `server/main.py` hanya wiring, dispatch, dan dependency injection.

Untuk frontend:

- page utama berada di `src/app/components/*`;
- flow besar dipisah ke folder domain seperti `user/`, `admin/`, `moderator/`;
- API call menggunakan `src/lib/api.ts`;
- type payload disinkronkan di `src/types/index.ts`.

## 3. Implementasi

Aturan implementasi:

- Jangan ubah API prefix tanpa rencana migrasi.
- Jangan ubah role hierarchy tanpa keputusan produk.
- Jangan mengandalkan frontend-only security.
- Jangan commit runtime database atau credential.
- Perubahan besar harus dipisah per domain.

## 4. Validasi

Frontend:

```bash
npm run build
```

Backend:

```bash
python -m py_compile server/main.py
python -m py_compile server/api/<file>.py
```

Flow besar:

```bash
npm run smoke
```

Git:

```bash
git diff --check
git status --short
```

## 5. Demo dan Feedback

Checklist demo:

- login relawan;
- login admin;
- access request;
- event lifecycle;
- report lifecycle;
- certificate;
- reward;
- admin dashboard;
- Docker/tunnel jika demo lintas perangkat.

Feedback dicatat sebagai:

- bug;
- UX improvement;
- security gap;
- production gap;
- documentation gap.

## 6. Release Internal

Sebelum push:

1. Pull/fetch branch `main` terbaru.
2. Rebase/merge tanpa force-push.
3. Jalankan validasi relevan.
4. Pastikan tidak ada secret.
5. Commit dengan pesan ringkas.
6. Push ke repository aktif.

## 7. Prinsip Pemeliharaan

- Dokumentasi harus mengikuti runtime aktual.
- Sample database harus bisa dibuat ulang dari seed.
- Production gap harus ditulis eksplisit, bukan ditutupi.
- Keputusan keamanan harus terdokumentasi agar tim lanjutan paham konteks.
