# Changelog

All notable changes to the **SIMREKAP** project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.1.0] - 2026-07-27 — Prototype Demo Handover Diskominfo

### Added
- Complete SPBE & Diátaxis government handover documentation suite:
  - `docs/DEPLOYMENT_MANUAL_DISKOMINFO.md` (Systemd + Nginx Linux VPS manual)
  - `docs/USER_MANUAL_RELAWAN.md` (End-user tutorial for citizen volunteers)
  - `docs/USER_MANUAL_KSH_LURAH.md` (Tutorial for KSH officers, Lurah, and Camat)
  - `docs/ADMIN_MANUAL.md` (Diskominfo IT admin system manual)
  - `docs/MAINTENANCE_SOP.md` (Formal SOP for incident recovery & maintenance)
  - `docs/CREDENTIAL_HANDOVER_TEMPLATE.md` (Audit-compliant credential handover form)
  - `docs/handover/BERITA_ACARA_SERAH_TERIMA_TEMPLATE.md` (Official BAST legal template)
  - `docs/ADR/001-why-threading-http-server-and-sqlite.md` (Architecture Decision Record)
  - `docs/ERD_Mermaid.md` (Comprehensive visual Mermaid ERD diagram)
  - `docs/KNOWN_ISSUES_AND_TECH_DEBT.md` (Known issues, tech debt, & risk register)
  - `docs/AUDIT_REPORT_OPUS.md` (360° 8-Pillar Audit Report)

### Changed
- Refactored `.env.example` to add `SIMRP_HOST` and `SIMRP_PORT`, translated comments to Indonesian, and removed internal AI keys.
- Streamlined `README.md`, `SECURITY.md`, `docs/DEPLOYMENT.md`, `docs/ARCHITECTURE.md`, and `docs/README.md` for manual Linux deployment.

### Removed
- Internal Docker build artifacts (`docker-compose.yml`, `Dockerfile.api`, `Dockerfile.web`, `.dockerignore`, `docs/SERVER_DOCKER_RUNBOOK.md`).

---

## [0.0.3] - 2026-05-30

### Added
- Hardened production configuration checks for admin credentials, demo seed, CORS origins, and proxy headers.
- Tightened backend RBAC for event, report, collaboration, user, and admin data access.
- Updated certificate and reward flows, including safer certificate filenames and GoBis-oriented voucher copy.
- Split user dashboard features into smaller modules for events, reports, certificates, rewards, attendance, leaderboard, and data hooks.
- Extracted shared notification polling into a reusable navbar hook.
- Updated admin dashboard into a database-style interface with clearer role separation, filtering, sorting, and high-contrast controls.

---

## [0.0.2] - 2026-05-29

### Added
- Modularized backend schema, migrations, seed data, runtime services, and active API handlers.
- Completed backend smoke coverage for health, auth, event approval/publish, join, attendance, complete, report review/verify, certificate, reward, and notifications.
- Added frontend flows for event history, report timeline, rank card, and certificate download.
- Split moderator dashboard into event, report, collaboration, and data hook modules.

---

## [0.0.1] - 2026-05-06

### Added
- Initial prototype release.
- Added event publish gate and report `under_review` status.
- Added digital certificate download endpoint and collaboration approval email stub.
- Moved active endpoint groups from `server/main.py` into `server/api/*`.
