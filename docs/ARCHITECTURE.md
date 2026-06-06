# Architecture

SIMREKAP is a single-page React application backed by a Python stdlib HTTP server and SQLite database.

## Runtime Overview

```text
Browser
  -> React + Vite frontend
  -> /make-server-32aa5c5c API prefix
  -> Python ThreadingHTTPServer
  -> SQLite database
```

## Frontend

Main entry points:

- `src/main.tsx`
- `src/app/App.tsx`
- `src/lib/api.ts`

Component groups:

- `src/app/components/user/` for relawan/KSH dashboard modules.
- `src/app/components/moderator/` for ASN/moderator workflows.
- `src/app/components/admin/` for database-style admin management.
- `src/app/components/ui/` for reusable UI primitives and navbars.
- `src/app/components/landing/` for public landing sections.

The frontend stores the session token in `localStorage` and sends it with the `Authorization: Bearer <token>` header through centralized API helpers.

## Backend

Main runtime:

- `server/main.py`

Backend responsibilities:

- load environment files;
- initialize SQLite schema, migrations, and seed data;
- enforce request body limits, CORS, security headers, and rate limits;
- resolve bearer token sessions;
- dispatch requests to active API modules.

Active API modules:

- `server/api/auth.py`
- `server/api/events.py`
- `server/api/reports.py`
- `server/api/collaboration.py`
- `server/api/geographic.py`
- `server/api/admin.py`
- `server/api/notifications.py`
- `server/api/certificates.py`
- `server/api/rewards.py`
- `server/api/users.py`

Supporting modules:

- `server/db/schema.py`
- `server/db/migrations.py`
- `server/db/seed.py`
- `server/services/runtime.py`
- `server/services/rate_limiter.py`
- `server/core/config.py`
- `server/core/utils.py`

## Main Workflows

Event workflow:

```text
draft -> approved -> published -> completed
```

Report workflow:

```text
pending -> under_review -> verified/rejected
```

Verified reports trigger XP distribution, certificate creation, notifications, and audit logs.

## Data Storage

SQLite runtime database:

```text
database/runtime/database.db
```

Runtime data is ignored by Git. Use environment variable `SIMRP_DB_PATH` to override the path.
