# ADR 001: Pemilihan Python ThreadingHTTPServer dan SQLite untuk Prototype SIMREKAP

**Status:** Accepted  
**Tanggal:** 2026-07-27  
**Pembuat:** Lead Software Architect & PM  

---

## 1. Konteks dan Masalah

Aplikasi SIMREKAP dibangun sebagai prototype / Proof-of-Concept (PoC) kegiatan relawan Kampung Pancasila untuk kebutuhan Kerja Praktik dan serah-terima teknis ke Diskominfo Kota Surabaya.

Persyaratan awal pengembangan:
1. **Kecepatan Portabilitas & Deployment:** Sistem harus dapat dijalankan di laptop penguji, server sidang, maupun VPS tanpa bergantung pada infrastruktur kompleks seperti Docker Engine, Kubernetes, atau database server (PostgreSQL/MySQL) yang memerlukan instalasi khusus.
2. **Keterbatasan Resource & Maintenance:** Pengembang dan penguji lokal membutuhkan runtime yang *zero-dependency* di luar Python standard library dan Node.js.
3. **Fleksibilitas Schema:** Data perlu terus dieksplorasi selama masa demo tanpa hambatan migrasi database server.

---

## 2. Keputusan Arsitektur (Decision)

Kami memutuskan untuk menggunakan:
1. **Backend Runtime:** Python Standard Library `http.server.ThreadingHTTPServer` tanpa framework eksternal seperti FastAPI, Flask, atau Django.
2. **Database Engine:** SQLite 3 (menggunakan driver standar Python `sqlite3`).

---

## 3. Rationale & Keuntungan

1. **Zero External Python Dependencies:** Backend dapat berjalan di mesin Linux/Windows mana pun yang memiliki Python 3.11+ tanpa perlu melakukan `pip install` library pihak ketiga.
2. **Portabilitas Database Tunggal:** Seluruh database tersimpan dalam satu file tunggal (`database.db`), memudahkan proses backup, reset demo, dan inspeksi.
3. **Performa Sangat Tinggi untuk Skala Prototype:** `ThreadingHTTPServer` mampu menangani ratusan request per detik untuk beban demo/pilot tanpa *overhead* framework heavy.
4. **Isolasi Logika Aplikasi:** Arsitektur modular di `server/api/*` memisahkan routing, otorisasi RBAC, dan layer DB dengan bersih, sehingga mudah dipindahkan ke FastAPI di kemudian hari jika diperlukan.

---

## 4. Consequence & Batasan (Trade-Offs)

| Aspek | Konsekuensi & Limitasi | Mitigation / Solusi Saat Ini |
|---|---|---|
| **Concurrency Write** | SQLite menggunakan file locking saat penulisan (write). Pada beban write tinggi simultan (>100 write/sec), dapat terjadi `database is locked`. | Penggunaan pragmas `journal_mode=WAL` & `synchronous=NORMAL` di production config. |
| **Tidak ada Connection Pool** | Setiap HTTP thread membuka koneksi SQLite sendiri. | Koneksi dibuka dan ditutup dengan cepat pada handler try-finally. |
| **Tidak ada ORM** | Query ditulis dalam bentuk parameterized SQL mentah. | Keuntungannya adalah transparansi query 100% dan zero ORM overhead, tetapi membutuhkan ketelitian SQL syntax. |
| **Routing Manual** | Routing URL diperiksa menggunakan string matching regex. | Diset pada `server/main.py` dan didelegasikan ke fungsi API terisolasi. |

---

## 5. Triggers Migrasi ke Arsitektur Produksi (Post-Handover)

Tim Diskominfo disarankan untuk melakukan refactoring arsitektur ke **FastAPI + PostgreSQL** bilamana kondisi berikut terpenuhi:
1. **Lalu Lintas Pengguna:** Jumlah pengakses simultan publik melebihi 500 pengguna aktif bersamaan.
2. **Kebutuhan High-Availability:** Aplikasi memerlukan *multi-node load balancing* atau database *replication/sharding*.
3. **Integrasi Enterprise:** Diperlukan integrasi OAuth2/SSO Pemkot Surabaya atau ORM SQLAlchemy untuk standar internal Diskominfo.

---

## 6. Kesimpulan

Keputusan menggunakan `ThreadingHTTPServer` dan SQLite adalah keputusan arsitektural yang **disengaja (intentional)** untuk menjamin kesederhanaan, portabilitas, dan reliabilitas selama fase prototype dan serah-terima.
