# API Reference

Default local base URL:

```text
http://127.0.0.1:8000/make-server-32aa5c5c
```

Authenticated requests use:

```text
Authorization: Bearer <session_token>
```

## List Pagination and Search

Endpoint list besar mendukung pagination backward-compatible. Response lama tetap punya array utama, lalu ditambah metadata `pagination`.

Query umum:

```text
?limit=100&offset=0
```

Response metadata:

```json
{
  "pagination": {
    "limit": 100,
    "offset": 0,
    "total": 250,
    "hasMore": true
  }
}
```

Endpoint yang mendukung `limit` dan `offset`:

- `GET /users`
- `GET /users/me/participations`
- `GET /events`
- `GET /reports`
- `GET /collaboration-requests`
- `GET /notifications`

Endpoint yang mendukung search `q`:

- `GET /users?q=andi` khusus admin
- `GET /events?q=bersih`
- `GET /collaboration-requests?q=komunitas`

Search tetap RBAC-aware dan input query dibatasi panjangnya oleh backend.

## Auth

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/auth/me` | Return current session user |
| `POST` | `/auth/signup` | Register relawan user |
| `POST` | `/auth/login` | Login user or moderator |
| `POST` | `/auth/admin-login` | Login admin portal |
| `POST` | `/auth/otp/request` | Create phone OTP challenge for `signup`, `login`, or `account_recovery` |
| `POST` | `/auth/otp/verify` | Verify and consume a phone OTP challenge |
| `POST` / `DELETE` | `/auth/logout` | Revoke session |

### OTP / Phone Verification

OTP is implemented as a provider-ready foundation. In local development, set `SIMRP_OTP_PROVIDER=dev`; the response includes `devOtpCode` so maintainers can test without an SMS vendor. Production must not use the dev provider.

Request OTP:

```json
{
  "phoneNumber": "081234567890",
  "purpose": "signup"
}
```

Response in development:

```json
{
  "success": true,
  "challengeId": "uuid",
  "expiresAt": "2026-06-03T12:00:00+00:00",
  "provider": "dev",
  "devOtpCode": "123456"
}
```

Signup can consume OTP directly by sending `phoneNumber`, `otpChallengeId`, and `otpCode`. Existing email/password signup still works when `SIMRP_OTP_REQUIRE_VERIFICATION=false`.

## Access Requests

Portal Akses Petugas memakai endpoint berikut. Register publik tetap membuat akun relawan (`user`); KSH dan moderator hanya aktif setelah admin approve.

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/access-requests` | User/KSH | Submit pengajuan akses KSH/moderator |
| `GET` | `/access-requests/me` | User/KSH | List pengajuan milik user sendiri, terbaru dulu |
| `GET` | `/admin/access-requests?status=pending&q=email` | Admin | Queue pengajuan akses untuk admin |
| `POST` | `/admin/access-requests/{id}/review` | Admin | Approve atau reject pengajuan |

### Submit Access Request

Allowed requester: `user` atau `ksh`.

Allowed `requestedRole`:

- `ksh`
- `moderator_t1`
- `moderator_t2`

Scope rules:

- `ksh`: wajib `kelurahan`.
- `moderator_t1`: mengikuti pola scope event existing, boleh `kelurahan` atau `kecamatan`.
- `moderator_t2`: `kelurahan` menjadi lurah, `kecamatan` menjadi camat.

Request:

```json
{
  "requestedRole": "ksh",
  "requestedScopeType": "kelurahan",
  "requestedKelurahanId": 12,
  "requestedKecamatanId": 3,
  "positionOrTitle": "KSH RW 04",
  "reason": "Membantu checklist kehadiran kegiatan demo."
}
```

Response:

```json
{
  "success": true,
  "request": {
    "id": "uuid",
    "requesterEmail": "relawan.demo@simrp.app",
    "currentRole": "user",
    "requestedRole": "ksh",
    "requestedScopeType": "kelurahan",
    "requestedKelurahan": "Keputih",
    "requestedKecamatan": "Sukolilo",
    "status": "pending",
    "createdAt": "2026-06-04T12:00:00+00:00"
  }
}
```

Duplicate pending request untuk user + requested role ditolak.

### Admin Review Access Request

Admin review body hanya berisi keputusan dan catatan. Role/scope final wajib memakai data request yang sudah tersimpan di database, bukan payload role baru dari admin.

Request:

```json
{
  "approved": true,
  "reviewNote": "Sesuai skenario demo KSH."
}
```

Approve behavior:

- `ksh`: update user menjadi `role_code='ksh'`, `is_ksh=1`, set wilayah kelurahan/kecamatan.
- `moderator_t1`: update user menjadi `role_code='moderator_t1'`, `moderator_tier=1`, set wilayah sesuai request.
- `moderator_t2` scope `kelurahan`: update user menjadi `role_code='moderator_t2'`, `moderator_tier=2`, `tier2_badge='lurah'`.
- `moderator_t2` scope `kecamatan`: update user menjadi `role_code='moderator_t2'`, `moderator_tier=2`, `tier2_badge='camat'`, `kelurahan_id=NULL`.

Reject behavior:

- Hanya update status request, reviewer, review note, dan timestamp.

Approve/reject membuat audit log dan notifikasi untuk requester.

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
