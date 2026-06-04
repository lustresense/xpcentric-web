# Production Readiness

SIMRP has been hardened for a credible prototype/demo environment, but it should still be reviewed before being used as a public government-facing service.

## Ready for Demonstration

- Frontend builds with `npm run build`.
- Backend compiles with `python -m py_compile`.
- Smoke test covers auth, events, reports, certificates, rewards, and notifications.
- RBAC is enforced server-side for user, moderator, KSH, and admin flows.
- Admin dashboard separates relawan, ASN/moderator, and admin records.
- Portal Akses Petugas `/access` supports request-based KSH/moderator approval for demo flows.
- Demo seed can be disabled for production.
- Runtime credentials and database files are ignored by Git.
- Large list endpoints support pagination metadata, with bounded search for selected admin/event/collaboration lists.
- Maintainer, operations, and privacy/data-governance documentation are available in `docs/`.
- Production gaps are explicitly documented in `docs/PRODUCTION_GAP_ROADMAP.md`.

## Required Before Public Production

- Run behind HTTPS and a reverse proxy.
- Use strong admin credentials and rotate any demo secrets.
- Keep `SIMRP_ENABLE_DEMO_SEED=false`.
- Set strict `SIMRP_ALLOWED_ORIGINS`.
- Configure backup and restore procedures for SQLite or migrate to managed database storage.
- Review legal requirements for citizen data handling.
- Define formal consent, correction, deletion, and retention procedures before collecting real citizen-scale data.
- Review certificate legality if certificates need official digital signature status.
- Replace email stub with real SMTP or notification provider if email delivery is required.
- Add operational monitoring and log rotation.
- Treat `deploy/nginx/simrp-api.conf.example` and `deploy/systemd/simrp-api.service.example` as examples only, not drop-in production config.
- Treat `/access` as a request portal only. It is not direct moderator activation; active role changes require admin approval.

## Final Validation Checklist

```bash
npm install
npm run build
python -m py_compile server/main.py
npm run smoke
npm audit --audit-level=high
git diff --check
```

## Known Prototype Boundaries

- No official GoBis API integration is included.
- Voucher redemption is simulated in-app.
- Certificate download generates print-ready HTML, not a cryptographically signed PDF.
- Backend uses Python stdlib HTTP server for prototype simplicity.
- SQLite is suitable for local/demo use; public-scale usage should evaluate operational limits.
- SQLite remains the active database for prototype/KP/demo. PostgreSQL/MySQL is future roadmap for broad pilot/production.
- OTP is optional/dev-mode for demo and must not block register/login unless a real provider is configured deliberately.
- `/access` is a portal for access requests, not direct moderator activation.
- KSH/moderator roles become active only after admin approval.
- OTP, official GoBis integration, legal digital signature, and final UU PDP compliance are external-dependency gaps, not completed implementation.
