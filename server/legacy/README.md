# DEPRECATED - Server Legacy Code

File-file di dalam folder `server/legacy/` ini adalah modul historis dan pengujian lama:
- `api_xp.py`
- `main_test.py`

## Catatan Penting
- **Status:** DEPRECATED (Tidak digunakan oleh runtime aktif per 2026-07-27).
- **Runtime Utama:** Server aktif menggunakan entry point [`server/main.py`](../main.py) dan modul API di [`server/api/`](../api/).
- **Alasan Dipertahankan:** Disimpan sebagai referensi historis pengembangan awal prototype dan tidak dipanggil dalam skenario produksi maupun *smoke test*.
