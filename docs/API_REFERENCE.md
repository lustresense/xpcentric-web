# API Reference

Default local base URL:

```text
http://127.0.0.1:8000/make-server-32aa5c5c
```

Authenticated requests use:

```text
Authorization: Bearer <session_token>
```

## Auth

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/auth/me` | Return current session user |
| `POST` | `/auth/signup` | Register relawan user |
| `POST` | `/auth/login` | Login user or moderator |
| `POST` | `/auth/admin-login` | Login admin portal |
| `POST` / `DELETE` | `/auth/logout` | Revoke session |

## Users

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/users` | List users with RBAC filtering |
| `PUT` | `/users/{id}` | Update profile |
| `GET` | `/users/me/participations` | Current user event history |

## Events

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/events` | List visible events |
| `POST` | `/events` | Create draft event |
| `PUT` | `/events/{id}` | Update event |
| `POST` | `/events/{id}/approval` | Approve or reject draft event |
| `POST` | `/events/{id}/publish` | Publish approved event |
| `POST` | `/events/{id}/join` | Join published event |
| `POST` | `/events/{id}/attendance` | Mark attendance |
| `POST` | `/events/{id}/complete` | Complete event |

## Reports

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/reports` | List reports with RBAC filtering |
| `POST` | `/reports` | Submit event report |
| `POST` | `/reports/{id}/review` | Move report to `under_review` |
| `POST` | `/reports/{id}/verify` | Verify or reject report |

## Certificates

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/certificates` | List certificates for current user/admin |
| `GET` | `/certificates/{id}/verify` | Public verification details |
| `GET` | `/certificates/{id}/download` | Download certificate HTML |

## Rewards

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/rewards/catalog` | List voucher catalog |
| `POST` | `/rewards/redeem` | Redeem voucher with XP |

## Collaboration

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/collaboration-requests` | List collaboration requests |
| `POST` | `/collaboration-requests` | Public partner submission |
| `POST` | `/collaboration-requests/{id}/approval` | Approve or reject partner request |

## Geography and Leaderboard

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/geo/options` | Geographic options |
| `GET` | `/geo/stats` | Geographic statistics |
| `GET` | `/kodepos/{code}` | Postal code lookup |
| `GET` | `/kampung` | Kampung leaderboard data |
| `GET` | `/kampung/{id}/pillars` | Four-pillar XP data |
| `GET` | `/landing/leaderboard` | Public landing leaderboard |

## Notifications

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/notifications/count` | Unread count |
| `GET` | `/notifications` | Notification list |
| `POST` | `/notifications/{id}/read` | Mark notification as read |
