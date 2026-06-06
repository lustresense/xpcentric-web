# Security Policy

SIMREKAP is a prototype application, but the repository should still be handled like a real production codebase.

## Supported Version

Security fixes target the current `update` branch and any branch explicitly used for active demonstration or deployment.

## Reporting Security Issues

Do not publish sensitive security issues in public screenshots, issues, or commits. Report them directly to the maintainer with:

- affected endpoint or screen;
- reproduction steps;
- expected vs actual behavior;
- whether credentials, sessions, RBAC, database writes, certificates, or rewards are affected.

## Secret Handling

Never commit:

- `.env` or `.env.local`;
- `database/runtime/`;
- `database/backups/`;
- `database/runtime/dev_credentials.txt`;
- API keys, tokens, passwords, or real citizen data.

Use `.env.example` for placeholders only.

## Required Checks

Before production-like usage:

```bash
npm run build
python -m py_compile server/main.py
npm run smoke
```

Review `.env.example`, set strong admin credentials, disable demo seed, and set a strict CORS allowlist.

## Security Baseline

The current codebase includes:

- PBKDF2-HMAC-SHA256 password hashing;
- bearer session tokens stored server-side;
- server-side RBAC;
- moderator scope checks by wilayah;
- parameterized SQL queries;
- request body size limits;
- auth and mutation rate limiting;
- production startup guardrails;
- security headers and CORS allowlist;
- audit logging for important actions.
