"""
SIMREKAP Authentication Module.

The active runtime still owns the database connection and shared helpers in
server/main.py. These handlers receive those dependencies explicitly so auth
routing can be moved out of main.py without changing security behavior.
"""
import hmac
import uuid
from datetime import datetime, timedelta, timezone


OTP_PURPOSES = {"signup", "login", "account_recovery"}


def _json(deps, handler, status, payload):
  deps["write_json"](handler, status, payload)
  return True


def _auth_header(handler):
  return handler.headers.get("Authorization")


def _bearer_token(handler):
  auth = _auth_header(handler)
  if not auth or not auth.startswith("Bearer "):
    return None
  return auth.split(" ", 1)[1].strip()


def _otp_expires_at(minutes):
  return (datetime.now(timezone.utc) + timedelta(minutes=int(minutes))).isoformat()


def _is_expired(iso_value):
  try:
    return datetime.fromisoformat(str(iso_value)) <= datetime.now(timezone.utc)
  except Exception:
    return True


def _cleanup_otp_challenges(conn, execute, now):
  execute(
    conn,
    "DELETE FROM otp_challenges WHERE expires_at <= ? OR consumed_at IS NOT NULL",
    (now,),
  )


def _mask_phone(phone_number):
  text = str(phone_number or "")
  if len(text) <= 6:
    return "***"
  return f"{text[:4]}***{text[-3:]}"


def _consume_otp_challenge(conn, execute, deps, challenge_id, phone_number, code, purpose):
  row = conn.execute(
    """
    SELECT *
    FROM otp_challenges
    WHERE id = ? AND phone_number = ? AND purpose = ?
    LIMIT 1
    """,
    (challenge_id, phone_number, purpose),
  ).fetchone()
  if not row or row["consumed_at"] or _is_expired(row["expires_at"]):
    return False, "Kode OTP tidak valid atau sudah kedaluwarsa"
  if int(row["attempts"]) >= int(row["max_attempts"]):
    return False, "Percobaan OTP sudah mencapai batas"
  if not deps["verify_otp_code"](code, row["otp_hash"]):
    execute(
      conn,
      "UPDATE otp_challenges SET attempts = attempts + 1 WHERE id = ?",
      (challenge_id,),
    )
    return False, "Kode OTP tidak valid atau sudah kedaluwarsa"
  execute(
    conn,
    "UPDATE otp_challenges SET consumed_at = ? WHERE id = ?",
    (deps["utc_now_iso"](), challenge_id),
  )
  return True, ""


def handle_get(handler, conn, path, deps):
  """Handle GET /auth/* routes. Returns True when a route was handled."""
  api_prefix = deps["API_PREFIX"]

  if path == f"{api_prefix}/auth/me":
    user = deps["user_from_token"](conn, _auth_header(handler))
    if not user:
      return _json(deps, handler, 401, {"error": "Unauthorized"})
    return _json(deps, handler, 200, {"user": deps["get_user_payload"](conn, user)})

  return False


def handle_post(handler, conn, path, body, deps):
  """Handle POST /auth/* routes. Returns True when a route was handled."""
  api_prefix = deps["API_PREFIX"]
  write_json = lambda target, status, payload: _json(deps, target, status, payload)
  execute = deps["execute"]

  if path == f"{api_prefix}/auth/otp/request":
    if deps["rate_limited"](handler, "auth-otp-request", deps["RATE_LIMIT_AUTH_MAX"], deps["RATE_LIMIT_WINDOW_SECONDS"]):
      return write_json(handler, 429, {"error": "Terlalu banyak permintaan OTP, coba lagi nanti"})
    if deps["OTP_PROVIDER"] == "disabled":
      return write_json(handler, 503, {"error": "OTP belum dikonfigurasi"})

    purpose = deps["bounded_text"](body.get("purpose", "signup"), 32)
    if purpose not in OTP_PURPOSES:
      return write_json(handler, 400, {"error": "Tujuan OTP tidak valid"})
    phone_number = deps["normalize_phone_number"](body.get("phoneNumber") or body.get("phone"))
    if not deps["valid_phone_number"](phone_number):
      return write_json(handler, 400, {"error": "Nomor HP harus format Indonesia, contoh 081234567890"})

    now = deps["utc_now_iso"]()
    _cleanup_otp_challenges(conn, execute, now)
    challenge_id = str(uuid.uuid4())
    code = deps["generate_otp_code"]()
    expires_at = _otp_expires_at(deps["OTP_TTL_MINUTES"])
    execute(
      conn,
      """
      INSERT INTO otp_challenges(
        id, phone_number, purpose, otp_hash, expires_at, attempts, max_attempts, created_at
      )
      VALUES(?, ?, ?, ?, ?, 0, ?, ?)
      """,
      (
        challenge_id,
        phone_number,
        purpose,
        deps["hash_otp_code"](code),
        expires_at,
        int(deps["OTP_MAX_ATTEMPTS"]),
        now,
      ),
    )
    payload = {
      "success": True,
      "challengeId": challenge_id,
      "expiresAt": expires_at,
      "provider": deps["OTP_PROVIDER"],
    }
    deps["log_audit"](
      conn,
      None,
      "auth.otp_request",
      "otp_challenge",
      challenge_id,
      {"phone": _mask_phone(phone_number), "purpose": purpose, "provider": deps["OTP_PROVIDER"]},
    )
    if not deps["IS_PRODUCTION"] and deps["OTP_PROVIDER"] == "dev":
      payload["devOtpCode"] = code
    return write_json(handler, 200, payload)

  if path == f"{api_prefix}/auth/otp/verify":
    if deps["rate_limited"](handler, "auth-otp-verify", deps["RATE_LIMIT_AUTH_MAX"], deps["RATE_LIMIT_WINDOW_SECONDS"]):
      return write_json(handler, 429, {"error": "Terlalu banyak percobaan OTP, coba lagi nanti"})
    if deps["OTP_PROVIDER"] == "disabled":
      return write_json(handler, 503, {"error": "OTP belum dikonfigurasi"})

    purpose = deps["bounded_text"](body.get("purpose", "signup"), 32)
    if purpose not in OTP_PURPOSES:
      return write_json(handler, 400, {"error": "Tujuan OTP tidak valid"})
    phone_number = deps["normalize_phone_number"](body.get("phoneNumber") or body.get("phone"))
    challenge_id = deps["bounded_text"](body.get("challengeId"), 80)
    code = deps["bounded_text"](body.get("code") or body.get("otpCode"), 12)
    if not deps["valid_phone_number"](phone_number) or not challenge_id or not code:
      return write_json(handler, 400, {"error": "Nomor HP, challenge, dan kode OTP wajib valid"})

    ok, message = _consume_otp_challenge(conn, execute, deps, challenge_id, phone_number, code, purpose)
    if not ok:
      deps["log_audit"](
        conn,
        None,
        "auth.otp_verify_failed",
        "otp_challenge",
        challenge_id,
        {"phone": _mask_phone(phone_number), "purpose": purpose},
      )
      return write_json(handler, 400, {"error": message})
    deps["log_audit"](
      conn,
      None,
      "auth.otp_verify_success",
      "otp_challenge",
      challenge_id,
      {"phone": _mask_phone(phone_number), "purpose": purpose},
    )
    return write_json(handler, 200, {
      "success": True,
      "phoneNumber": phone_number,
      "phoneVerified": True,
    })

  if path == f"{api_prefix}/auth/signup":
    if deps["rate_limited"](handler, "auth-signup", deps["RATE_LIMIT_AUTH_MAX"], deps["RATE_LIMIT_WINDOW_SECONDS"]):
      return write_json(handler, 429, {"error": "Terlalu banyak percobaan signup, coba lagi nanti"})
    if not body.get("email") or not body.get("password") or not body.get("name"):
      return write_json(handler, 400, {"error": "Email, password, name wajib"})
    email = str(body.get("email")).strip().lower()
    if not deps["valid_email"](email):
      return write_json(handler, 400, {"error": "Format email tidak valid"})
    if not deps["valid_password"](body.get("password")):
      return write_json(handler, 400, {"error": "Password minimal 8 karakter dan kombinasi huruf-angka"})
    name = deps["bounded_text"](body.get("name"), 120)
    nik = deps["bounded_text"](body.get("nik", ""), 32)
    rw = deps["bounded_text"](body.get("rw", ""), 16)
    phone_number = deps["normalize_phone_number"](body.get("phoneNumber") or body.get("phone"))
    phone_verified = 0
    if phone_number and not deps["valid_phone_number"](phone_number):
      return write_json(handler, 400, {"error": "Nomor HP harus format Indonesia, contoh 081234567890"})
    if phone_number:
      challenge_id = deps["bounded_text"](body.get("otpChallengeId"), 80)
      otp_code = deps["bounded_text"](body.get("otpCode"), 12)
      if deps["OTP_REQUIRE_VERIFICATION"] and (not challenge_id or not otp_code):
        return write_json(handler, 400, {"error": "Verifikasi OTP nomor HP wajib"})
      if challenge_id or otp_code:
        if deps["OTP_PROVIDER"] == "disabled":
          return write_json(handler, 503, {"error": "OTP belum dikonfigurasi"})
        ok, message = _consume_otp_challenge(conn, execute, deps, challenge_id, phone_number, otp_code, "signup")
        if not ok:
          deps["log_audit"](
            conn,
            None,
            "auth.otp_verify_failed",
            "otp_challenge",
            challenge_id,
            {"phone": _mask_phone(phone_number), "purpose": "signup"},
          )
          return write_json(handler, 400, {"error": message})
        deps["log_audit"](
          conn,
          None,
          "auth.otp_verify_success",
          "otp_challenge",
          challenge_id,
          {"phone": _mask_phone(phone_number), "purpose": "signup"},
        )
        phone_verified = 1
    if conn.execute("SELECT id FROM users WHERE email = ?", (email,)).fetchone():
      return write_json(handler, 400, {"error": "Email sudah terdaftar"})
    kel_name = deps["bounded_text"](body.get("kelurahan"), 120)
    kel = conn.execute(
      """
      SELECT kelurahan.id AS id, kecamatan.id AS kec_id
      FROM kelurahan JOIN kecamatan ON kecamatan.id = kelurahan.kecamatan_id
      WHERE kelurahan.name = ? LIMIT 1
      """,
      (kel_name,),
    ).fetchone()
    if not kel:
      return write_json(handler, 400, {"error": "Kelurahan tidak ditemukan"})
    user_id = str(uuid.uuid4())
    now = deps["utc_now_iso"]()
    execute(
      conn,
      """
      INSERT INTO users(
        id, name, email, password_hash, nik, rw, role_code, is_ksh, moderator_tier, email_verified,
        phone_number, phone_verified, kelurahan_id, kecamatan_id, points, badges_json, created_at, updated_at
      )
      VALUES(?, ?, ?, ?, ?, ?, 'user', 0, NULL, 1, ?, ?, ?, ?, 0, '[]', ?, ?)
      """,
      (
        user_id,
        name,
        email,
        deps["hash_password"](body.get("password")),
        nik,
        rw,
        phone_number or None,
        phone_verified,
        kel["id"],
        kel["kec_id"],
        now,
        now,
      ),
    )
    user = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
    token = deps["create_session"](conn, user_id)
    return write_json(handler, 200, {"success": True, "token": token, "user": deps["get_user_payload"](conn, user)})

  if path == f"{api_prefix}/auth/login":
    if deps["rate_limited"](handler, "auth-login", deps["RATE_LIMIT_AUTH_MAX"], deps["RATE_LIMIT_WINDOW_SECONDS"]):
      return write_json(handler, 429, {"error": "Terlalu banyak percobaan login, coba lagi nanti"})
    email = str(body.get("email", "")).strip().lower()
    if not deps["valid_email"](email):
      return write_json(handler, 400, {"error": "Format email tidak valid"})
    password = str(body.get("password", ""))
    user = conn.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
    if not user or not deps["verify_password"](password, user["password_hash"]):
      return write_json(handler, 401, {"error": "Email/password salah"})
    token = deps["create_session"](conn, user["id"])
    return write_json(handler, 200, {"success": True, "token": token, "user": deps["get_user_payload"](conn, user)})

  if path == f"{api_prefix}/auth/admin-login":
    if deps["rate_limited"](handler, "auth-admin-login", deps["RATE_LIMIT_AUTH_MAX"], deps["RATE_LIMIT_WINDOW_SECONDS"]):
      return write_json(handler, 429, {"error": "Terlalu banyak percobaan login admin, coba lagi nanti"})
    if not deps["ADMIN_LOGIN_USERNAME"] or not deps["ADMIN_LOGIN_PASSWORD"]:
      return write_json(handler, 403, {"error": "Admin login tidak dikonfigurasi"})
    username = str(body.get("username", "")).strip()
    password = str(body.get("password", ""))
    expected_username = deps["ADMIN_LOGIN_USERNAME"]
    expected_password = deps["ADMIN_LOGIN_PASSWORD"]
    valid_user = hmac.compare_digest(username, expected_username)
    valid_pass = hmac.compare_digest(password, expected_password)
    if not valid_user or not valid_pass:
      return write_json(handler, 401, {"error": "Invalid credentials"})
    admin = conn.execute("SELECT * FROM users WHERE role_code = 'admin' LIMIT 1").fetchone()
    if not admin:
      return write_json(handler, 500, {"error": "Akun admin tidak ditemukan"})
    token = deps["create_session"](conn, admin["id"])
    return write_json(handler, 200, {"success": True, "token": token, "user": deps["get_user_payload"](conn, admin)})

  if path == f"{api_prefix}/auth/logout":
    token = _bearer_token(handler)
    if not token:
      return write_json(handler, 401, {"error": "Unauthorized"})
    execute(conn, "DELETE FROM sessions WHERE token = ?", (token,))
    return write_json(handler, 200, {"success": True})

  return False


def handle_delete(handler, conn, path, deps):
  """Handle DELETE /auth/* routes. Returns True when a route was handled."""
  api_prefix = deps["API_PREFIX"]

  if path == f"{api_prefix}/auth/logout":
    actor = deps["user_from_token"](conn, _auth_header(handler))
    if not actor:
      return _json(deps, handler, 401, {"error": "Unauthorized"})
    token = _bearer_token(handler)
    if not token:
      return _json(deps, handler, 401, {"error": "Unauthorized"})
    deps["execute"](conn, "DELETE FROM sessions WHERE token = ?", (token,))
    return _json(deps, handler, 200, {"success": True})

  return False


auth_routes = {
  "GET": ("/auth/me",),
  "POST": ("/auth/signup", "/auth/login", "/auth/admin-login", "/auth/logout", "/auth/otp/request", "/auth/otp/verify"),
  "DELETE": ("/auth/logout",),
}
