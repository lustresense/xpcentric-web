# Changelog

All notable SIMREKAP changes are summarized here.

## 2026-05-30

- Hardened production configuration checks for admin credentials, demo seed, CORS origins, and proxy headers.
- Tightened backend RBAC for event, report, collaboration, user, and admin data access.
- Updated certificate and reward flows, including safer certificate filenames and GoBis-oriented voucher copy.
- Split user dashboard features into smaller modules for events, reports, certificates, rewards, attendance, leaderboard, and data hooks.
- Extracted shared notification polling into a reusable navbar hook.
- Updated admin dashboard into a database-style interface with clearer role separation, filtering, sorting, and high-contrast controls.
- Refreshed README, demo account documentation, setup guide, and public documentation set.
- Removed obsolete internal docs, local agent files, unused TSX examples, and stale project artifacts from the tracked tree.

## 2026-05-29

- Modularized backend schema, migrations, seed data, runtime services, and active API handlers.
- Completed backend smoke coverage for health, auth, event approval/publish, join, attendance, complete, report review/verify, certificate, reward, and notifications.
- Added frontend flows for event history, report timeline, rank card, and certificate download.
- Split moderator dashboard into event, report, collaboration, and data hook modules.

## 2026-05-06

- Added event publish gate.
- Added report `under_review` status.
- Added digital certificate download endpoint.
- Added collaboration approval email stub.
- Moved active endpoint groups from `server/main.py` into `server/api/*`.
