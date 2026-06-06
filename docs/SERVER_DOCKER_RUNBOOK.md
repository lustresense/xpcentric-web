# Server Docker Runbook

Panduan ini menjelaskan cara menjalankan SIMREKAP di server demo menggunakan Docker image, termasuk cara update jika ada perubahan dari laptop, cara pull di server, menjalankan aplikasi, membaca credential demo, dan membuka akses HP melalui Cloudflare Quick Tunnel.

Status target panduan ini: demo/KP/pilot internal, bukan production publik warga Surabaya.

## 0. Arsitektur Demo

Runtime Docker memakai dua service:

| Service | Fungsi | Port |
|---|---|---|
| `web` | Nginx serve frontend `dist/` dan proxy API | host `7761` -> container `80` |
| `api` | Python backend `server/main.py` | internal `8000` |

Flow request:

```text
Browser/HP -> http://server:7761 -> web
Browser/HP -> /make-server-32aa5c5c -> web proxy -> api:8000
```

SQLite dan credential demo disimpan di Docker volume:

```text
/data/simrekap/database.db
/data/simrekap/dev_credentials.txt
```

## 1. Prasyarat Server

Di server Linux/VM:

```bash
docker --version
docker compose version
```

Kalau belum ada Docker, install Docker Engine dan plugin Compose terlebih dulu.

Pastikan port demo terbuka:

```text
7761/tcp
```

Untuk tunnel, server juga perlu akses keluar ke internet.

## 2. Alur Saat Ada Perubahan dari Laptop

Setiap kali kode di laptop berubah dan ingin dikirim ke server:

1. Validasi lokal.
2. Build Docker image baru.
3. Tag image ke GHCR.
4. Push image ke GHCR.
5. SSH ke server.
6. Pull image terbaru.
7. Restart compose.
8. Cek health/frontend/login.
9. Jalankan tunnel jika perlu akses HP.

## 3. Di Laptop: Validasi Lokal

Dari root repo:

```bash
npm install
npm run build
python -m py_compile server/main.py server/services/runtime.py
docker compose build
docker compose up -d
```

Cek aplikasi lokal:

```bash
curl http://localhost:7761/make-server-32aa5c5c/health
curl http://localhost:7761/make-server-32aa5c5c/geo/stats
```

Ambil credential demo lokal:

```bash
docker compose exec -T api sh -c "cat /data/simrekap/dev_credentials.txt"
```

Smoke test lewat Docker proxy:

```bash
SIMRP_SMOKE_BASE=http://localhost:7761/make-server-32aa5c5c \
SIMRP_SMOKE_DEMO_PASSWORD=<password-demo-dari-dev_credentials> \
npm run smoke
```

Di PowerShell:

```powershell
$env:SIMRP_SMOKE_BASE="http://localhost:7761/make-server-32aa5c5c"
$env:SIMRP_SMOKE_DEMO_PASSWORD="<password-demo-dari-dev_credentials>"
npm run smoke
Remove-Item Env:\SIMRP_SMOKE_BASE
Remove-Item Env:\SIMRP_SMOKE_DEMO_PASSWORD
```

## 4. Di Laptop: Login GHCR

Buat GitHub token dengan permission package yang sesuai:

```text
write:packages
read:packages
```

Login:

```bash
docker login ghcr.io -u lustresense
```

Masukkan GitHub token sebagai password.

Setelah push pertama, buka GitHub Packages dan ubah package `simrekap` menjadi public jika VM/server harus bisa `docker pull` tanpa login:

```text
GitHub profile -> Packages -> simrekap -> Package settings -> Change visibility -> Public
```

Package lama seperti `simrekap-api` dan `simrekap-web` tidak dipakai lagi. Package final untuk demo adalah satu package `simrekap` dengan tag `api-demo` dan `web-demo`.

## 5. Di Laptop: Build, Tag, dan Push Image

Gunakan satu GHCR package `simrekap` dengan tag terpisah untuk API dan web. Ini membuat GitHub Packages lebih rapi daripada dua package terpisah:

```bash
docker build -f Dockerfile.api -t ghcr.io/lustresense/simrekap:api-demo .
docker build -f Dockerfile.web -t ghcr.io/lustresense/simrekap:web-demo .

docker push ghcr.io/lustresense/simrekap:api-demo
docker push ghcr.io/lustresense/simrekap:web-demo
```

Opsional, tambahkan tag versi berbasis tanggal agar bisa rollback:

```bash
TAG=2026-06-06-7761-demo

docker tag ghcr.io/lustresense/simrekap:api-demo ghcr.io/lustresense/simrekap:api-$TAG
docker tag ghcr.io/lustresense/simrekap:web-demo ghcr.io/lustresense/simrekap:web-$TAG

docker push ghcr.io/lustresense/simrekap:api-$TAG
docker push ghcr.io/lustresense/simrekap:web-$TAG
```

## 6. Di Server: Buat Folder Runtime

SSH ke server:

```bash
ssh user@SERVER_IP
```

Buat folder:

```bash
mkdir -p ~/simrekap-demo
cd ~/simrekap-demo
```

## 7. Di Server: Buat Compose File

Buat file `docker-compose.yml`:

```bash
cat > docker-compose.yml <<'EOF'
services:
  api:
    image: ghcr.io/lustresense/simrekap:api-demo
    environment:
      SIMRP_HOST: 0.0.0.0
      SIMRP_PORT: 8000
      SIMRP_DB_PATH: /data/simrekap/database.db
      SIMRP_ENABLE_DEMO_SEED: "true"
    volumes:
      - simrekap-data:/data/simrekap
    expose:
      - "8000"
    restart: unless-stopped

  web:
    image: ghcr.io/lustresense/simrekap:web-demo
    ports:
      - "7761:80"
    depends_on:
      - api
    restart: unless-stopped

volumes:
  simrekap-data:
EOF
```

Catatan:

- Untuk demo, `SIMRP_ENABLE_DEMO_SEED=true` membuat akun demo tersedia.
- Untuk demo tertutup, credential boleh generated otomatis dan dibaca dari volume.
- Jangan menaruh secret production di file ini kalau repo/folder dibagikan.

## 8. Di Server: Pull dan Jalankan

Kalau package `ghcr.io/lustresense/simrekap` sudah public, lewati login dan langsung `docker compose pull`. Kalau masih private, login dulu:

```bash
docker login ghcr.io -u lustresense
```

Pull dan start:

```bash
docker compose pull
docker compose up -d
```

Cek container:

```bash
docker compose ps
```

Cek health:

```bash
curl http://localhost:7761/make-server-32aa5c5c/health
curl http://localhost:7761/make-server-32aa5c5c/geo/stats
```

Buka dari browser:

```text
http://SERVER_IP:7761
```

## 8A. Di Server: Update dari Deploy Lama ke Naming SIMREKAP

Gunakan bagian ini kalau server sebelumnya sudah pernah menjalankan image/package lama atau compose lama.

Masuk ke folder runtime server:

```bash
cd ~/codes/simrekap 2>/dev/null || cd ~/simrekap-demo
```

Backup database lama dulu kalau ada volume lama yang masih ingin disimpan:

```bash
mkdir -p backups
docker compose exec -T api sh -c "cat /data/simrp/database.db" > backups/database-simrp-before-simrekap-$(date +%Y%m%d-%H%M%S).db 2>/dev/null || true
docker compose exec -T api sh -c "cat /data/simrekap/database.db" > backups/database-simrekap-before-update-$(date +%Y%m%d-%H%M%S).db 2>/dev/null || true
```

Matikan compose lama dari folder yang sedang aktif:

```bash
docker compose down
```

Hapus container lama yang namanya masih `figmasimrp` atau tunnel lama. Ini tidak menghapus image non-SIMREKAP:

```bash
docker rm -f figmasimrp-web-1 figmasimrp-api-1 2>/dev/null || true
docker rm -f simrp-cloudflared simrp-tunnel 2>/dev/null || true
```

Tulis ulang `docker-compose.yml` yang konsisten SIMREKAP:

```bash
cat > docker-compose.yml <<'EOF'
name: simrekap

services:
  api:
    image: ghcr.io/lustresense/simrekap:api-demo
    environment:
      SIMRP_HOST: 0.0.0.0
      SIMRP_PORT: 8000
      SIMRP_DB_PATH: /data/simrekap/database.db
      SIMRP_ENABLE_DEMO_SEED: "true"
    volumes:
      - simrekap-data:/data/simrekap
    expose:
      - "8000"
    restart: unless-stopped

  web:
    image: ghcr.io/lustresense/simrekap:web-demo
    ports:
      - "7761:80"
    depends_on:
      - api
    restart: unless-stopped

volumes:
  simrekap-data:
EOF
```

Pull dan nyalakan ulang:

```bash
docker compose pull
docker compose up -d
docker compose ps
curl http://localhost:7761/make-server-32aa5c5c/health
```

Bersihkan image lama SIMREKAP/SIMRP yang sudah tidak dipakai:

```bash
docker image rm \
  ghcr.io/lustresense/simrekap-api:demo \
  ghcr.io/lustresense/simrekap-web:demo \
  ghcr.io/lustresense/simrekap:api-2026-06-05-7761-demo \
  ghcr.io/lustresense/simrekap:web-2026-06-05-7761-demo \
  figmasimrp-api:latest \
  figmasimrp-web:latest 2>/dev/null || true

docker image prune -f
```

Kalau package GHCR masih private, `docker compose pull` akan gagal. Solusinya pilih salah satu:

- ubah GitHub Packages `simrekap` menjadi public; atau
- login dulu di server dengan `docker login ghcr.io -u lustresense`.

## 9. Di Server: Ambil Credential Demo

```bash
docker compose exec -T api sh -c "cat /data/simrekap/dev_credentials.txt"
```

Yang penting:

```text
SIMRP_ADMIN_LOGIN_PASSWORD=...
SIMRP_DEMO_PASSWORD=...
```

Admin portal:

```text
URL: http://SERVER_IP:7761/admin
Username: admin
Password: SIMRP_ADMIN_LOGIN_PASSWORD
```

Akun demo memakai password `SIMRP_DEMO_PASSWORD`.

## 10. Di Server: Update Setelah Laptop Push Image Baru

Setelah image baru sudah dipush dari laptop:

```bash
cd ~/simrekap-demo
docker compose pull
docker compose up -d
```

Cek:

```bash
docker compose ps
curl http://localhost:7761/make-server-32aa5c5c/health
```

Volume `simrekap-data` tetap dipakai, jadi database dan `dev_credentials.txt` tidak hilang.

## 11. Di Server: Rollback Image

Kalau sebelumnya kamu push tag versi, edit `docker-compose.yml`:

```yaml
image: ghcr.io/lustresense/simrekap:api-2026-06-06-7761-demo
image: ghcr.io/lustresense/simrekap:web-2026-06-06-7761-demo
```

Lalu:

```bash
docker compose pull
docker compose up -d
```

## 12. Di Server: Cloudflare Quick Tunnel untuk Akses HP

Jika server belum punya domain dan perlu dibuka dari HP, jalankan tunnel dari server:

```bash
docker rm -f simrekap-tunnel 2>/dev/null || true

docker run -d \
  --name simrekap-tunnel \
  --network host \
  --restart unless-stopped \
  cloudflare/cloudflared:latest \
  tunnel --no-autoupdate --url http://127.0.0.1:7761
```

Ambil URL:

```bash
docker logs simrekap-tunnel 2>&1 | grep trycloudflare
```

Contoh output:

```text
https://random-words.trycloudflare.com
```

Buka URL itu dari HP.

Aturan tunnel:

- Ini URL sementara, bukan domain permanen.
- Jangan pakai data warga asli.
- Stop tunnel setelah demo selesai.
- Kalau URL/credential tersebar, reset demo credential atau reset volume demo.

Stop tunnel:

```bash
docker rm -f simrekap-tunnel
```

## 13. Di Laptop: Tunnel Lokal untuk Tes HP Tanpa Server

Kalau aplikasi masih jalan di laptop lewat Docker:

```powershell
docker rm -f simrekap-cloudflared 2>$null

docker run -d --name simrekap-cloudflared --restart unless-stopped cloudflare/cloudflared:latest tunnel --no-autoupdate --url http://host.docker.internal:7761

docker logs simrekap-cloudflared
```

Buka URL `trycloudflare.com` dari HP.

Stop:

```powershell
docker rm -f simrekap-cloudflared
```

## 14. Reset Demo Database

Hati-hati: ini menghapus database dan credential demo di volume.

```bash
docker compose down -v
docker compose up -d
docker compose exec -T api sh -c "cat /data/simrekap/dev_credentials.txt"
```

## 15. Backup Demo Database

Backup dari volume ke file lokal server:

```bash
mkdir -p backups
docker compose exec -T api sh -c "cat /data/simrekap/database.db" > backups/database-$(date +%Y%m%d-%H%M%S).db
```

## 16. Troubleshooting

### Container tidak jalan

```bash
docker compose ps
docker compose logs api
docker compose logs web
```

### API tidak bisa diakses

```bash
curl http://localhost:7761/make-server-32aa5c5c/health
docker compose logs api
docker compose logs web
```

### Frontend terbuka tapi login gagal

Cek API prefix:

```bash
curl http://localhost:7761/make-server-32aa5c5c/health
```

Jika health OK, ambil credential ulang:

```bash
docker compose exec -T api sh -c "cat /data/simrekap/dev_credentials.txt"
```

### Tunnel URL tidak bisa dibuka

```bash
docker logs simrekap-tunnel
docker rm -f simrekap-tunnel
```

Jalankan ulang tunnel. Quick Tunnel memang random dan tidak punya uptime guarantee.

## 17. Checklist Berhasil

Server dianggap siap demo kalau semua ini OK:

```bash
docker compose ps
curl http://localhost:7761/make-server-32aa5c5c/health
curl http://localhost:7761/make-server-32aa5c5c/geo/stats
docker compose exec -T api sh -c "cat /data/simrekap/dev_credentials.txt"
```

Dan browser bisa membuka:

```text
http://SERVER_IP:7761
```

Jika perlu HP/internet:

```text
https://<random>.trycloudflare.com
```
