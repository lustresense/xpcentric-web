# Deployment Guide

SIMRP currently runs as a prototype web application with a Vite frontend and Python stdlib backend.

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
start_server.bat
```

## Validate

```bash
npm run build
python -m py_compile server/main.py
python smoketest.py
```

## Data and Backup

Default SQLite database:

```text
database/runtime/database.db
```

Backup helper:

```bat
backup_database.bat
```

Do not deploy with local runtime credentials or checked-in database files.
