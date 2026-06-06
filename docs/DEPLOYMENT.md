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

## Demo Docker Runtime

Batch 5B packaging target is a simple VM/server-prodi demo package, not a city-wide production deployment. The validated runtime shape is two containers:

For a full laptop-to-server handover flow, including GHCR push/pull, server compose, updates, rollback, and Cloudflare Quick Tunnel, read `docs/SERVER_DOCKER_RUNBOOK.md`.

| Service | Responsibility | Runtime content |
|---|---|---|
| `web` | Serve the Vite production build through Nginx and proxy API calls | `dist/` only plus Nginx config |
| `api` | Run the Python backend runtime | `server/` plus `src/data/geographicData.ts` for geography parsing |

The frontend should be built into static assets. Do not serve raw frontend source from the runtime web image.

```text
Browser -> web:80 -> /make-server-32aa5c5c -> api:8000
Browser -> web:80 -> SPA routes -> dist/index.html
```

### Local Docker Demo

Build and run the validated demo runtime:

```bash
docker compose build
docker compose up -d
```

Open:

```text
Frontend: http://localhost:7761
API:      http://localhost:7761/make-server-32aa5c5c
```

Health checks:

```bash
curl http://localhost:7761/make-server-32aa5c5c/health
curl http://localhost:7761/make-server-32aa5c5c/geo/stats
```

Read generated local demo credentials from the API volume:

```bash
docker compose exec -T api sh -c "cat /data/simrekap/dev_credentials.txt"
```

Stop the demo without deleting SQLite data:

```bash
docker compose down
```

Use `docker compose down -v` only when intentionally resetting the demo database and generated credentials.

### Image and Registry Plan

Use one GHCR package under the project owner namespace. API and web are separated by tag so the GitHub Packages page stays clean:

```text
ghcr.io/lustresense/simrekap:api-demo
ghcr.io/lustresense/simrekap:web-demo
```

Recommended build sequence:

```bash
docker build -f Dockerfile.api -t ghcr.io/lustresense/simrekap:api-demo .
docker build -f Dockerfile.web -t ghcr.io/lustresense/simrekap:web-demo .
```

Recommended push sequence after local validation:

```bash
docker push ghcr.io/lustresense/simrekap:api-demo
docker push ghcr.io/lustresense/simrekap:web-demo
```

The VM/server prodi should either:

- run from the validated `docker-compose.yml` in this repository; or
- use a compose override that replaces local `build:` entries with the GHCR image names above.

Example image-based compose shape for a server that only pulls images:

```yaml
services:
  api:
    image: ghcr.io/lustresense/simrekap:api-demo
    environment:
      SIMRP_HOST: 0.0.0.0
      SIMRP_PORT: 8000
      SIMRP_DB_PATH: /data/simrekap/database.db
    volumes:
      - simrekap-data:/data/simrekap
    expose:
      - "8000"

  web:
    image: ghcr.io/lustresense/simrekap:web-demo
    ports:
      - "7761:80"
    depends_on:
      - api

volumes:
  simrekap-data:
```

### Runtime Data Plan

SQLite remains the active database for prototype/KP/demo. In Docker, runtime data must be a persistent volume:

```text
/data/simrekap/database.db
/data/simrekap/dev_credentials.txt
```

Required environment variables for the API container:

```env
SIMRP_HOST=0.0.0.0
SIMRP_PORT=8000
SIMRP_DB_PATH=/data/simrekap/database.db
```

Use additional env values on the server for demo credentials, CORS/origin policy, OTP mode, and production-like flags. Do not commit real secrets into the repo or bake them into the image.

### Exclusion Rules

The Docker package must not include:

```text
node_modules/
.git/
.venv/
.env
.env.local
database/runtime/
database/backups/
database/runtime/dev_credentials.txt
```

These exclusions are enforced through `.dockerignore` and should be reviewed before every packaging change.

### Tunnel Fallback for Temporary Demo URLs

For a short live demo when no domain/reverse proxy is available, expose only the local Docker web port with a temporary tunnel. This is a fallback for demonstration, not production hosting.

Recommended option:

```bash
cloudflared tunnel --url http://localhost:7761
```

The command returns a random temporary URL. Share that URL only with demo participants, and stop the tunnel immediately after the demo.

Operational rules:

- Use demo data only; do not expose real citizen data through a temporary tunnel.
- Use generated demo credentials from `/data/simrekap/dev_credentials.txt` or explicitly set temporary demo env values.
- Rotate demo credentials after public demos if the URL or credentials were shared outside the internal audience.
- Keep `SIMRP_ENABLE_DEMO_SEED=true` only for controlled demo environments.
- Do not treat the random tunnel URL as a permanent service address.

Alternatives:

- Cloudflare named tunnel with an approved domain for a longer pilot.
- Ngrok or another tunnel provider with access control enabled.
- VS Code port forwarding for a closed internal review.

## Data and Backup

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

Docker/GHCR packaging and tunnel fallback are now documented for demo/pilot usage. Do not treat them as the final city-wide production package without TLS/domain ownership, monitoring, backup operations, legal review, and security hardening.
