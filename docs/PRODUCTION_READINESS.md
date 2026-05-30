# Production Readiness

SIMRP has been hardened for a credible prototype/demo environment, but it should still be reviewed before being used as a public government-facing service.

## Ready for Demonstration

- Frontend builds with `npm run build`.
- Backend compiles with `python -m py_compile`.
- Smoke test covers auth, events, reports, certificates, rewards, and notifications.
- RBAC is enforced server-side for user, moderator, KSH, and admin flows.
- Admin dashboard separates relawan, ASN/moderator, and admin records.
- Demo seed can be disabled for production.
- Runtime credentials and database files are ignored by Git.

## Required Before Public Production

- Run behind HTTPS and a reverse proxy.
- Use strong admin credentials and rotate any demo secrets.
- Keep `SIMRP_ENABLE_DEMO_SEED=false`.
- Set strict `SIMRP_ALLOWED_ORIGINS`.
- Configure backup and restore procedures for SQLite or migrate to managed database storage.
- Review legal requirements for citizen data handling.
- Review certificate legality if certificates need official digital signature status.
- Replace email stub with real SMTP or notification provider if email delivery is required.
- Add operational monitoring and log rotation.

## Final Validation Checklist

```bash
npm install
npm run build
python -m py_compile server/main.py
python smoketest.py
npm audit --audit-level=high
git diff --check
```

## Known Prototype Boundaries

- No official GoBis API integration is included.
- Voucher redemption is simulated in-app.
- Certificate download generates print-ready HTML, not a cryptographically signed PDF.
- Backend uses Python stdlib HTTP server for prototype simplicity.
- SQLite is suitable for local/demo use; public-scale usage should evaluate operational limits.
