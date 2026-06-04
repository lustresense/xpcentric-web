# SIMRP Documentation

This directory contains the public project documentation that should remain in the repository.

## Index

- [Architecture](ARCHITECTURE.md)
- [API Reference](API_REFERENCE.md)
- [Deployment Guide](DEPLOYMENT.md)
- [Contributor Setup](SETUP.md)
- [Demo Accounts](DEMO_ACCOUNTS.md)
- [Production Readiness](PRODUCTION_READINESS.md)
- [Production Gap Roadmap](PRODUCTION_GAP_ROADMAP.md)
- [Maintainer Guide](MAINTAINER_GUIDE.md)
- [Operations Runbook](OPERATIONS_RUNBOOK.md)
- [Account Recovery Runbook](ACCOUNT_RECOVERY_RUNBOOK.md)
- [Privacy and Data Governance](PRIVACY_AND_DATA_GOVERNANCE.md)
- [UX Pilot Audit](UX_PILOT_AUDIT.md)

The root [README](../README.md) is the primary overview and can be used as context for academic reporting, demos, or onboarding.

For the role-approval demo, see "Demo Access Portal Flow" in [Demo Accounts](DEMO_ACCOUNTS.md) and the access request endpoints in [API Reference](API_REFERENCE.md).

## Documentation Rules

- Keep documentation aligned with the actual runtime in `server/main.py`, `server/api/*`, and `src/app/*`.
- Do not commit private credentials, local runtime notes, or AI-agent task logs.
- Put temporary planning notes outside the tracked repository.
