# Deployment Guide

SIMREKAP currently runs as a prototype web application with a Vite frontend and Python stdlib backend.

## Local Development

```bash
npm install
npm run dev
```

Local URLs:

```text
Frontend: http://localhost:5173
Admin:    http://localhost:5173/admin
API:      http://127.0.0.1:8000/make-server-32aa5c5c
```

## Production-Like Environment

Set these values before running in a production-like environment:

```env
SIMRP_ENV=production
SIMRP_ADMIN_LOGIN_USERNAME=<strong-admin-username>
SIMRP_ADMIN_LOGIN_PASSWORD=<strong-admin-password>
SIMRP_ENABLE_DEMO_SEED=false
SIMRP_ALLOWED_ORIGINS=https://your-frontend-domain.example
SIMRP_TRUST_PROXY_HEADERS=false
```

If the backend is behind a trusted reverse proxy that correctly sets forwarding headers, `SIMRP_TRUST_PROXY_HEADERS=true` can be enabled.

Example production-like files are available:

```text
deploy/nginx/simrekap-api.conf.example
deploy/systemd/simrekap-api.service.example
```

These files are references only. Do not deploy them without adjusting domain, TLS certificate paths, service user, database path, log policy, and secret handling.

## Demo Access Portal

For demo or KP scenarios, `/access` is available after user login as Portal Akses Petugas. It lets a relawan submit a KSH/moderator access request. Admin approval is still required before the role becomes active.

Deployment notes for this flow:

- Register remains public relawan registration.
- OTP remains optional/dev-mode unless a real OTP provider is configured.
- SQLite remains the active database for prototype/KP/demo.
- Refresh or login ulang after admin approval so the frontend reloads `/auth/me`.

## Build Frontend

```bash
npm run build
```

The static output is written to:

```text
dist/
```

## Run Backend

```bash
python server/main.py
```

Or on Windows:

```bat
scripts/start_server.bat
```

## Validate

```bash
npm run build
python -m py_compile server/main.py
npm run smoke
```


## Data and Backup

Runtime database asli tidak di-commit. Untuk kebutuhan review teknis, gunakan:

- `database/sample/simrekap_demo.sqlite` sebagai sample DB sanitized.
- `database/schema/simrekap_schema.sql` sebagai schema reference.
- `docs/DATABASE_SCHEMA.md` untuk ERD dan data dictionary.
- `docs/DATABASE_MIGRATION_NOTES.md` untuk catatan migrasi ke database server.

Untuk environment resmi, buat database runtime baru dan set credential melalui environment variable.

Default SQLite database:

```text
database/runtime/database.db
```

Backup helper:

```bat
scripts/backup_database.bat
```

Do not deploy with local runtime credentials or checked-in database files.

## Production Gaps

Before public city-scale usage, read:

```text
docs/PRODUCTION_GAP_ROADMAP.md
```

The roadmap tracks OTP, database migration, monitoring, official GoBis integration, legal digital signatures, and final UU PDP compliance.

Manual Linux deployment (Systemd + Nginx) and database backup guidelines are documented in `docs/DEPLOYMENT_MANUAL_DISKOMINFO.md`. Do not treat this prototype as a final city-wide production system without TLS/domain ownership, monitoring, automated backup operations, legal review, and security hardening.
