# Contributing Guide

Terima kasih sudah membantu pengembangan SIMRP. Panduan ini menjaga perubahan tetap kecil, aman, dan mudah direview.

## Branch

- Gunakan branch terpisah per pekerjaan, misalnya `feat/report-review`, `fix/rbac-scope`, atau `docs/api-reference`.
- Hindari commit langsung ke branch utama.
- Pisahkan perubahan kode, dokumentasi, dan formatting besar jika memungkinkan.

## Commit

Gunakan pesan commit ringkas dan spesifik.

Format yang disarankan:

```text
type(scope): summary
```

Contoh:

```text
feat(reports): add under-review transition
fix(events): enforce moderator scope on approval
docs(readme): update runtime architecture
```

## Validation

Sebelum membuat PR atau push besar:

```bash
npm run build
python -m py_compile server/main.py
npm run smoke
```

Untuk perubahan kecil, jalankan validasi yang relevan:

- Frontend berubah: `npm run build`.
- Backend berubah: `python -m py_compile server/main.py` dan file Python yang disentuh.
- Flow besar berubah: `npm run smoke`.

## Security Rules

- Jangan commit `.env`, `.env.local`, database runtime, backup database, atau `database/runtime/dev_credentials.txt`.
- Jangan menambahkan token, password, API key, atau data pribadi ke repository.
- RBAC wajib ditegakkan di backend, bukan hanya di frontend.
- SQL wajib memakai parameterized query.
- Jangan mengubah role hierarchy atau API prefix tanpa alasan migrasi yang jelas.

## Review Focus

Reviewer perlu mengecek:

- regresi role relawan, KSH, moderator, dan admin;
- scope wilayah untuk aksi moderator;
- validasi input dan error handling;
- konsistensi API payload dengan `src/types/index.ts`;
- dokumentasi yang terdampak perubahan.
