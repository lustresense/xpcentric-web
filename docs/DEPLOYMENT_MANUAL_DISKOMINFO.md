# Panduan Deployment Server Diskominfo (Linux VPS)

Dokumen ini adalah panduan teknis operasional untuk tim IT / Infra Diskominfo Kota Surabaya dalam menginstal, mengonfigurasi, dan menjalankan aplikasi **SIMREKAP** di lingkungan Linux Server (Ubuntu 22.04 LTS) tanpa menggunakan Docker.

---

## 1. Spesifikasi Server Minimal

| Komponen | Spesifikasi Minimal | Rekomendasi Production |
|---|---|---|
| OS | Ubuntu 22.04 LTS Server | Ubuntu 22.04 LTS Server |
| CPU | 2 Core | 4 Core |
| RAM | 2 GB | 4 GB |
| Storage | 20 GB SSD | 50 GB SSD |
| Runtimes | Node.js 20 LTS, Python 3.11+ | Node.js 20 LTS, Python 3.11+ |
| Web Server | Nginx 1.18+ | Nginx 1.18+ dengan Module HTTP/2 |
| SSL/TLS | Let's Encrypt / Certbot | Certbot / SSL Pemkot Surabaya |

---

## 2. Langkah Instalasi Environment & Dependencies

### Step 1: Update OS & Install System Packages
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git build-essential python3 python3-pip python3-venv nginx certbot python3-certbot-nginx
```

### Step 2: Install Node.js 20 LTS
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v # Pastikan v20.x.x
npm -v  # Pastikan v10.x.x
```

### Step 3: Clone Repository & Setup User Application
```bash
# Rekomendasi: Buat dedicated system user
sudo useradd -m -s /bin/bash simrekap
sudo su - simrekap

# Clone repository ke /home/simrekap/app
git clone https://github.com/lustresense/xpcentric-web.git app
cd app
```

### Step 4: Install Dependencies & Build Frontend
```bash
# Install Node dependencies
npm install

# Build static assets frontend (output akan ada di dist/)
npm run build
```

---

## 3. Konfigurasi Environment Variable (`.env`)

Salin file `.env.example` menjadi `.env`:
```bash
cp .env.example .env
nano .env
```

Sesuaikan variabel kunci berikut untuk server Diskominfo:
```env
SIMRP_ENV=production
SIMRP_HOST=127.0.0.1
SIMRP_PORT=8000
SIMRP_DB_PATH=/home/simrekap/app/database/runtime/database.db
SIMRP_ADMIN_LOGIN_USERNAME=admin_diskominfo
SIMRP_ADMIN_LOGIN_PASSWORD=PasswordSangatKuatDanUnik2026!
SIMRP_ALLOWED_ORIGINS=https://simrekap.surabaya.go.id
SIMRP_TRUST_PROXY_HEADERS=true
SIMRP_ENABLE_DEMO_SEED=false
VITE_API_BASE_URL=https://simrekap.surabaya.go.id/make-server-32aa5c5c
```

---

## 4. Konfigurasi Systemd (Backend Service)

Buat file service systemd agar Python API berjalan otomatis saat server boot.

File: `/etc/systemd/system/simrekap-api.service`
```ini
[Unit]
Description=SIMREKAP Python API Service
After=network.target

[Service]
Type=simple
User=simrekap
Group=simrekap
WorkingDirectory=/home/simrekap/app
EnvironmentFile=/home/simrekap/app/.env
ExecStart=/usr/bin/python3 /home/simrekap/app/server/main.py
Restart=always
RestartSec=5
PrivateTmp=true
ProtectSystem=full
ReadWritePaths=/home/simrekap/app/database/runtime /home/simrekap/app/database/backups

[Install]
WantedBy=multi-user.target
```

Aktifkan dan jalankan service:
```bash
sudo systemctl daemon-reload
sudo systemctl enable simrekap-api
sudo systemctl start simrekap-api
sudo systemctl status simrekap-api
```

---

## 5. Konfigurasi Nginx (Reverse Proxy & Static Web)

Buat konfigurasi Nginx untuk melayani frontend static `dist/` dan meneruskan API ke backend Python (`:8000`).

File: `/etc/nginx/sites-available/simrekap`
```nginx
server {
    listen 80;
    server_name simrekap.surabaya.go.id;

    root /home/simrekap/app/dist;
    index index.html;

    client_max_body_size 8m;

    # Proxy API backend ke Python ThreadingHTTPServer
    location /make-server-32aa5c5c/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 60s;
        proxy_send_timeout 60s;
    }

    # Static SPA Routing
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

Aktifkan konfigurasi dan test Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/simrekap /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Setup HTTPS / SSL Certbot
```bash
sudo certbot --nginx -d simrekap.surabaya.go.id
```

---

## 6. Prosedur Backup & Restore Data

### Automatic Backup via Cron Job
Buat script backup di `/home/simrekap/backup.sh`:
```bash
#!/bin/bash
BACKUP_DIR="/home/simrekap/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DB_PATH="/home/simrekap/app/database/runtime/database.db"

mkdir -p $BACKUP_DIR
if [ -f "$DB_PATH" ]; then
    cp "$DB_PATH" "$BACKUP_DIR/simrekap_backup_$TIMESTAMP.db"
    # Hapus backup yang lebih tua dari 30 hari
    find $BACKUP_DIR -name "*.db" -type f -mtime +30 -delete
fi
```

Tambahkan ke crontab user `simrekap` (Jalan setiap jam 02:00 malam):
```bash
crontab -e
# Tambahkan baris:
0 2 * * * /bin/bash /home/simrekap/backup.sh
```

### Prosedur Restore Database
1. Hentikan service backend:
   ```bash
   sudo systemctl stop simrekap-api
   ```
2. Timpa file database runtime dengan file backup:
   ```bash
   cp /home/simrekap/backups/simrekap_backup_YYYYMMDD_HHMMSS.db /home/simrekap/app/database/runtime/database.db
   ```
3. Nyalakan kembali service backend:
   ```bash
   sudo systemctl start simrekap-api
   ```

---

## 7. Verifikasi Deployment

Jalankan perintah pengujian kesehatan di server:
```bash
# 1. Test Backend Health Endpoint
curl -i http://127.0.0.1:8000/make-server-32aa5c5c/health

# 2. Test Nginx Proxy
curl -i https://simrekap.surabaya.go.id/make-server-32aa5c5c/health

# 3. Running Automated Smoke Test
cd /home/simrekap/app
SIMRP_SMOKE_BASE=https://simrekap.surabaya.go.id/make-server-32aa5c5c python3 scripts/smoketest.py
```
Hasil smoke test harus menunjukkan **PASS 59/59**.
