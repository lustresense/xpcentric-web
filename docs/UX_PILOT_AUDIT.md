# UX Pilot Audit

Audit ini menilai flow relawan pada viewport mobile dan kesiapan dasar dashboard ASN/admin untuk pilot terbatas. Fokusnya adalah kejelasan instruksi, state kosong/error/loading, dan copywriting warga umum.

## Scope Audit

- Register relawan.
- Login relawan/moderator.
- Join event.
- Submit laporan kegiatan.
- Lihat dan download sertifikat.
- Reward voucher GoBis.
- Dashboard moderator/ASN.
- Dashboard admin database-style.

## Temuan Utama

### Register

- Form register sudah mobile-friendly karena field turun menjadi satu kolom di layar kecil.
- Kodepos otomatis memuat kecamatan/kelurahan, membantu warga yang tidak familiar dengan struktur data internal.
- Risiko UX: NIK tampil sebagai field opsional, tetapi perlu copy singkat bahwa prototype tidak mewajibkan NIK.
- Rekomendasi: tambahkan kalimat privasi pendek dan gunakan istilah "kata sandi" konsisten.

### Login

- Form login sudah punya loading dan error alert.
- Toggle relawan/moderator jelas secara fungsi.
- Risiko UX: copy relawan masih bernuansa "pengawasan demokrasi", kurang nyambung dengan SIMRP sebagai partisipasi kampung Surabaya.
- Rekomendasi: ubah copy ke konteks "kegiatan kampung, laporan, sertifikat, dan voucher".

### Join Event

- Event list sudah punya filter pilar dan state tombol saat join.
- Empty state masih terlalu singkat.
- Ada label "Full" dan "Gabung Event" yang lebih baik diganti ke bahasa warga: "Kuota penuh" dan "Ikut Kegiatan".
- Risiko: beberapa karakter ikon/emoji terlihat mojibake di source dan bisa muncul rusak di UI.

### Submit Laporan

- Wizard dua langkah sederhana dan cocok untuk mobile.
- Empty state untuk tidak ada event reportable sudah ada.
- Risiko: teks "Step", "GPS Terkunci Otomatis", dan beberapa label dampak masih teknis/bermasalah encoding.
- Rekomendasi: ganti ke teks ASCII/Indonesia biasa dan jelaskan syarat laporan: event selesai, hadir, belum pernah lapor.

### Sertifikat

- Daftar sertifikat punya tombol preview dan download.
- Empty state masih pendek.
- Rekomendasi: empty state menjelaskan bahwa sertifikat muncul setelah laporan disetujui moderator/admin.

### Reward

- Narasi GoBis/Suroboyo Bus sudah jelas.
- XP ditampilkan aman tidak minus.
- Empty state masih terlalu pendek.
- Rekomendasi: jelaskan bahwa katalog voucher akan muncul saat admin mengaktifkan stok voucher.

### Moderator/ASN

- Dashboard moderator sudah modular dan menampilkan queue laporan/event/kolaborasi.
- Empty state ada, tetapi beberapa teks masih campur bahasa Inggris: "Approve", "Reject", "Published", "Unknown".
- Rekomendasi: ubah ke "Setujui", "Tolak", "Terbit", "Pengguna tidak ditemukan".

### Admin

- Dashboard admin sudah paling siap dari sisi database UI: search, filter, grouping, sorting.
- Empty state database sudah baik.
- Rekomendasi: pastikan loading awal memberi konteks bahwa data pengguna/event/laporan sedang dimuat.

## Prioritas Fix Batch 3

1. Perbaiki copy login relawan agar sesuai konteks SIMRP Surabaya.
2. Ganti mojibake/emoji bermasalah pada event list dan reporting wizard.
3. Tambahkan empty state yang lebih instruktif di event, laporan, sertifikat, reward, moderator queue.
4. Ganti label tombol bahasa Inggris di flow warga/ASN.
5. Pastikan `npm run build` lolos setelah perubahan UI.

## Status Pilot Setelah Fix

Jika prioritas di atas selesai, UI layak untuk demo/pilot terbatas dengan catatan: tetap belum boleh diklaim production city-wide karena masih ada gap legal, operasi production, dan integrasi resmi GoBis.
