# Form Serah-Terima Kredensial Akses System

**Dokumen:** Berita Acara Penyerahan Kredensial Akses SIMREKAP  
**Instansi:** Diskominfo Kota Surabaya  
**Tanggal Penyerahan:** [Tanggal-Bulan-Tahun]  

---

## DOKUMEN RAHASIA — HANYA UNTUK PIHAK BERWENANG

> [!WARNING]
> File ini adalah **TEMPLATE FORM**. Jangan meng-commit nilai password atau secret asli ke dalam repository Git! Isi form ini pada saat prosesi penyerahan resmi secara *hardcopy* atau disimpan pada Password Manager resmi Diskominfo.

---

## 1. Identitas Para Pihak

**Pihak Penyerah (Tim Pengembang):**
- Nama: ___________________________________
- Jabatan: ___________________________________
- Instansi/Unit: ___________________________________

**Pihak Penerima (Diskominfo Kota Surabaya):**
- Nama: ___________________________________
- NIP: ___________________________________
- Jabatan: ___________________________________
- Bidang/Seksi: ___________________________________

---

## 2. Tabel Kredensial Akses Aplikasi

| No | Akses / Layanan | Username / Identifier | Password Default Initial | Variable Environment Terkait | Tanggal Rotasi Wajib |
|---|---|---|---|---|---|
| 1 | Portal Admin Web (`/admin`) | `admin_diskominfo` | `[DIISI_SAAT_HANDOVER]` | `SIMRP_ADMIN_LOGIN_USERNAME`<br>`SIMRP_ADMIN_LOGIN_PASSWORD` | Max 30 hari |
| 2 | Admin Seed Bootstrap | `admin@simrp.local` | `[DIISI_SAAT_HANDOVER]` | `SIMRP_SEED_ADMIN_PASSWORD` | Max 30 hari |
| 3 | OTP Secret Key | `dev-secret` | `[DIISI_SAAT_HANDOVER]` | `SIMRP_OTP_SECRET` | Saat Prod OTP aktif |
| 4 | Linux Server SSH | `simrekap` | `[DIISI_SAAT_HANDOVER]` | N/A (Server OS) | Sesuai SOP Infra |

---

## 3. Pernyataan Penyerahan & Tanggung Jawab

Dengan ditandatanganinya formulir ini:
1. Pihak Penyerah telah menyerahkan seluruh akses kredensial di atas kepada Pihak Penerima dalam keadaan berfungsi baik.
2. Pihak Penerima **wajib segera melakukan rotasi/penggantian password** seluruh akses di atas setelah serah-terima selesai untuk menjaga keamanan sistem.
3. Pihak Penyerah tidak lagi menyimpan atau bertanggung jawab atas penggunaan kredensial di atas setelah prosesi penyerahan ditandatangani.

---

## 4. Tanda Tangan Para Pihak

**Pihak Penyerah,**  
  
  
___________________________________  
Tanggal:  


**Pihak Penerima,**  
  
  
___________________________________  
NIP.  
Tanggal:  
