import json
import os
import re
import sqlite3
import sys
import threading
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

SERVER_DIR = Path(__file__).resolve().parent
ROOT_DIR = SERVER_DIR.parent


def load_env_files():
  for env_path in (ROOT_DIR / ".env.local", ROOT_DIR / ".env"):
    if not env_path.exists():
      continue
    for raw_line in env_path.read_text(encoding="utf-8").splitlines():
      line = raw_line.strip()
      if not line or line.startswith("#") or "=" not in line:
        continue
      key, value = line.split("=", 1)
      key = key.strip()
      if not re.match(r"^[A-Za-z_][A-Za-z0-9_]*$", key):
        continue
      if key in os.environ:
        continue
      value = value.strip()
      if len(value) >= 2 and value[0] == value[-1] and value[0] in ("'", '"'):
        value = value[1:-1]
      os.environ[key] = value


load_env_files()

DB_DIR = ROOT_DIR / "database"
DB_PATH = Path(os.environ.get("SIMRP_DB_PATH", str(DB_DIR / "runtime" / "database.db")))
GEO_PATH = ROOT_DIR / "src" / "data" / "geographicData.ts"
API_PREFIX = "/make-server-32aa5c5c"
DEV_CREDENTIALS_PATH = DB_PATH.parent / "dev_credentials.txt"
_DEV_CREDENTIAL_NOTES = []


def generate_runtime_secret():
  return runtime_services.generate_runtime_secret()


def record_dev_credential(label, identifier, env_name, secret):
  return runtime_services.record_dev_credential(
    _DEV_CREDENTIAL_NOTES,
    label,
    identifier,
    env_name,
    secret,
    IS_PRODUCTION,
  )


def write_dev_credentials_file():
  return runtime_services.write_dev_credentials_file(
    DEV_CREDENTIALS_PATH,
    _DEV_CREDENTIAL_NOTES,
    IS_PRODUCTION,
  )

for import_path in (SERVER_DIR, ROOT_DIR):
  if str(import_path) not in sys.path:
    sys.path.insert(0, str(import_path))

from core.utils import (
  env_flag as core_env_flag,
  utc_now_iso as core_utc_now_iso,
  valid_email as core_valid_email,
  normalize_phone_number as core_normalize_phone_number,
  valid_phone_number as core_valid_phone_number,
  valid_password as core_valid_password,
  bounded_text as core_bounded_text,
  parse_pagination as core_parse_pagination,
  pagination_payload as core_pagination_payload,
)

from db.schema import create_schema_tables
from db.migrations import migrate_schema as db_migrate_schema
from db.seed import (
  seed_admin_account as db_seed_admin_account,
  seed_demo as db_seed_demo,
  seed_geography as db_seed_geography,
  seed_roles as db_seed_roles,
)
from services import runtime as runtime_services

from api import auth as auth_api
from api import events as events_api
from api import reports as reports_api
from api import collaboration as collaboration_api
from api import geographic as geographic_api
from api import admin as admin_api
from api import notifications as notifications_api
from api import certificates as certificates_api
from api import rewards as rewards_api
from api import users as users_api
from api import access_requests as access_requests_api


def env_flag(name, default=False):
  return core_env_flag(name, default)

APP_ENV = str(os.environ.get("SIMRP_ENV", "development")).strip().lower()
IS_PRODUCTION = APP_ENV in ("prod", "production")
PBKDF2_ITERATIONS = int(os.environ.get("SIMRP_PBKDF2_ITERATIONS", "600000" if IS_PRODUCTION else "210000"))
MAX_BODY_BYTES = int(os.environ.get("SIMRP_MAX_BODY_BYTES", str(8 * 1024 * 1024)))
SESSION_TTL_HOURS = int(os.environ.get("SIMRP_SESSION_TTL_HOURS", "24" if IS_PRODUCTION else "168"))
RATE_LIMIT_WINDOW_SECONDS = int(os.environ.get("SIMRP_RATE_LIMIT_WINDOW_SECONDS", "60"))
RATE_LIMIT_AUTH_MAX = int(os.environ.get("SIMRP_RATE_LIMIT_AUTH_MAX", "10"))
RATE_LIMIT_MUTATION_MAX = int(os.environ.get("SIMRP_RATE_LIMIT_MUTATION_MAX", "120"))
HOST = str(os.environ.get("SIMRP_HOST", "0.0.0.0" if IS_PRODUCTION else "127.0.0.1")).strip()
PORT = int(os.environ.get("SIMRP_PORT", "8000"))
ENABLE_DEMO_SEED = env_flag("SIMRP_ENABLE_DEMO_SEED", not IS_PRODUCTION)
DEMO_PASSWORD = str(os.environ.get("SIMRP_DEMO_PASSWORD", "")).strip()
TRUST_PROXY_HEADERS = env_flag("SIMRP_TRUST_PROXY_HEADERS", False)
OTP_PROVIDER = str(os.environ.get("SIMRP_OTP_PROVIDER", "disabled" if IS_PRODUCTION else "dev")).strip().lower()
OTP_SECRET = str(os.environ.get("SIMRP_OTP_SECRET", "")).strip()
OTP_TTL_MINUTES = int(os.environ.get("SIMRP_OTP_TTL_MINUTES", "10"))
OTP_MAX_ATTEMPTS = int(os.environ.get("SIMRP_OTP_MAX_ATTEMPTS", "5"))
OTP_REQUIRE_VERIFICATION = env_flag("SIMRP_OTP_REQUIRE_VERIFICATION", False)

DEV_ALLOWED_ORIGINS = {
  "http://localhost:5173",
  "http://127.0.0.1:5173",
}
raw_allowed_origins = str(os.environ.get("SIMRP_ALLOWED_ORIGINS", "")).strip()
ALLOWED_ORIGINS = {item.strip() for item in raw_allowed_origins.split(",") if item.strip()}

ADMIN_LOGIN_USERNAME = str(os.environ.get("SIMRP_ADMIN_LOGIN_USERNAME", "")).strip()
ADMIN_LOGIN_PASSWORD = str(os.environ.get("SIMRP_ADMIN_LOGIN_PASSWORD", "")).strip()
if not ADMIN_LOGIN_USERNAME and not IS_PRODUCTION:
  ADMIN_LOGIN_USERNAME = "admin"
if not ADMIN_LOGIN_PASSWORD and not IS_PRODUCTION:
  ADMIN_LOGIN_PASSWORD = generate_runtime_secret()
  record_dev_credential("Admin portal", f"username={ADMIN_LOGIN_USERNAME}", "SIMRP_ADMIN_LOGIN_PASSWORD", ADMIN_LOGIN_PASSWORD)
if ENABLE_DEMO_SEED and not DEMO_PASSWORD:
  if IS_PRODUCTION:
    raise RuntimeError("SIMRP_DEMO_PASSWORD is required when SIMRP_ENABLE_DEMO_SEED=true in production")
  DEMO_PASSWORD = generate_runtime_secret()
  record_dev_credential(
    "Demo user accounts",
    "emails=relawan.demo@simrp.app, moderator1.demo@simrp.app, ksh.demo@simrp.app, ...",
    "SIMRP_DEMO_PASSWORD",
    DEMO_PASSWORD,
  )
if OTP_PROVIDER not in ("disabled", "dev"):
  raise RuntimeError("SIMRP_OTP_PROVIDER saat ini harus 'disabled' atau 'dev'")
if OTP_PROVIDER != "disabled" and not OTP_SECRET:
  if IS_PRODUCTION:
    raise RuntimeError("SIMRP_OTP_SECRET wajib diisi saat OTP aktif di production")
  OTP_SECRET = generate_runtime_secret()
  record_dev_credential("OTP development provider", "provider=dev", "SIMRP_OTP_SECRET", OTP_SECRET)


def validate_production_config():
  if not IS_PRODUCTION:
    return

  errors = []
  placeholder_passwords = {
    "",
    "admin",
    "password",
    "password123",
    "CHANGE_THIS_BEFORE_PRODUCTION_123!",
  }
  if not ADMIN_LOGIN_USERNAME:
    errors.append("SIMRP_ADMIN_LOGIN_USERNAME wajib diisi")
  if ADMIN_LOGIN_PASSWORD in placeholder_passwords or len(ADMIN_LOGIN_PASSWORD) < 16:
    errors.append("SIMRP_ADMIN_LOGIN_PASSWORD wajib kuat dan minimal 16 karakter")
  if ENABLE_DEMO_SEED:
    errors.append("SIMRP_ENABLE_DEMO_SEED harus false untuk production warga nyata")
  if PBKDF2_ITERATIONS < 600000:
    errors.append("SIMRP_PBKDF2_ITERATIONS minimal 600000 untuk production")
  if SESSION_TTL_HOURS <= 0 or SESSION_TTL_HOURS > 24:
    errors.append("SIMRP_SESSION_TTL_HOURS production harus 1-24 jam")
  if OTP_REQUIRE_VERIFICATION and OTP_PROVIDER == "disabled":
    errors.append("SIMRP_OTP_PROVIDER tidak boleh disabled jika SIMRP_OTP_REQUIRE_VERIFICATION=true")
  if OTP_PROVIDER == "dev":
    errors.append("SIMRP_OTP_PROVIDER=dev tidak boleh dipakai untuk production warga nyata")
  if OTP_PROVIDER != "disabled" and len(OTP_SECRET) < 32:
    errors.append("SIMRP_OTP_SECRET minimal 32 karakter saat OTP aktif")
  for origin in ALLOWED_ORIGINS:
    if origin == "*":
      errors.append("SIMRP_ALLOWED_ORIGINS tidak boleh memakai wildcard '*'")
    if origin.startswith("http://") and not origin.startswith(("http://localhost", "http://127.0.0.1")):
      errors.append(f"SIMRP_ALLOWED_ORIGINS production harus HTTPS: {origin}")

  if errors:
    raise RuntimeError("Konfigurasi production SIMRP belum aman:\n- " + "\n- ".join(errors))

_rate_lock = threading.Lock()
_rate_hits = {}

def utc_now_iso():
  return core_utc_now_iso()


def hash_password(password):
  return runtime_services.hash_password(password, PBKDF2_ITERATIONS)


def verify_password(password, encoded):
  return runtime_services.verify_password(password, encoded, PBKDF2_ITERATIONS)


def generate_otp_code():
  return runtime_services.generate_otp_code()


def hash_otp_code(code):
  return runtime_services.hash_otp_code(code, OTP_SECRET)


def verify_otp_code(code, encoded):
  return runtime_services.verify_otp_code(code, encoded, OTP_SECRET)


def valid_email(email):
  return core_valid_email(email)


def normalize_phone_number(value):
  return core_normalize_phone_number(value)


def valid_phone_number(value):
  return core_valid_phone_number(value)


def valid_password(password):
  return core_valid_password(password)


def bounded_text(value, max_len):
  return core_bounded_text(value, max_len)


def client_ip(handler):
  forwarded = str(handler.headers.get("X-Forwarded-For", "")).strip()
  if TRUST_PROXY_HEADERS and forwarded:
    return forwarded.split(",")[0].strip()
  return str(handler.client_address[0] if handler.client_address else "unknown")


def resolve_cors_origin(handler):
  origin = str(handler.headers.get("Origin", "")).strip()
  if not origin:
    return None
  if origin in ALLOWED_ORIGINS:
    return origin
  if not IS_PRODUCTION and origin in DEV_ALLOWED_ORIGINS:
    return origin
  return None


def add_common_headers(handler):
  handler.send_header("X-Content-Type-Options", "nosniff")
  handler.send_header("X-Frame-Options", "DENY")
  handler.send_header("Referrer-Policy", "no-referrer")
  handler.send_header("Permissions-Policy", "geolocation=(), microphone=(), camera=()")
  handler.send_header("Cache-Control", "no-store")
  if IS_PRODUCTION:
    handler.send_header("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload")
    handler.send_header(
      "Content-Security-Policy",
      "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'",
    )
  origin = resolve_cors_origin(handler)
  if origin:
    handler.send_header("Access-Control-Allow-Origin", origin)
    handler.send_header("Vary", "Origin")
    handler.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
    handler.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")


def rate_limited(handler, bucket, limit, window_seconds):
  now = time.time()
  key = f"{bucket}:{client_ip(handler)}"
  with _rate_lock:
    hits = _rate_hits.get(key, [])
    threshold = now - window_seconds
    hits = [item for item in hits if item >= threshold]
    if len(hits) >= limit:
      _rate_hits[key] = hits
      return True
    hits.append(now)
    _rate_hits[key] = hits
  return False


def open_sqlite(path):
  conn = sqlite3.connect(str(path), timeout=30)
  conn.row_factory = sqlite3.Row
  # Use WAL journaling in production for better concurrency; fallback to MEMORY
  # for environments where file journals may be blocked.
  if IS_PRODUCTION:
    conn.execute("PRAGMA journal_mode = WAL")
    conn.execute("PRAGMA synchronous = NORMAL")
  else:
    conn.execute("PRAGMA journal_mode = MEMORY")
    conn.execute("PRAGMA synchronous = NORMAL")
  conn.execute("PRAGMA temp_store = MEMORY")
  conn.execute("PRAGMA foreign_keys = ON")
  return conn


def connect_db():
  return open_sqlite(DB_PATH)


def execute(conn, sql, params=()):
  cur = conn.execute(sql, params)
  return cur


def log_audit(conn, actor_id, action, entity_type, entity_id, payload=None):
  return runtime_services.log_audit(
    conn,
    execute,
    bounded_text,
    utc_now_iso,
    actor_id,
    action,
    entity_type,
    entity_id,
    payload,
  )


def create_notification(conn, user_id, notif_type, title, message, entity_type=None, entity_id=None):
  return runtime_services.create_notification(
    conn,
    execute,
    bounded_text,
    utc_now_iso,
    user_id,
    notif_type,
    title,
    message,
    entity_type,
    entity_id,
  )


def parse_geo_data():
  return runtime_services.parse_geo_data(GEO_PATH)


def get_geo_stats():
  return runtime_services.get_geo_stats(GEO_PATH)


def write_json(handler, code, payload):
  body = json.dumps(payload, ensure_ascii=True).encode("utf-8")
  handler.send_response(code)
  handler.send_header("Content-Type", "application/json")
  handler.send_header("Content-Length", str(len(body)))
  add_common_headers(handler)
  handler.end_headers()
  handler.wfile.write(body)


def parse_json_body(handler):
  length = int(handler.headers.get("Content-Length", "0"))
  if length <= 0:
    return {}
  if length > MAX_BODY_BYTES:
    raise ValueError("Payload terlalu besar")
  content_type = str(handler.headers.get("Content-Type", "")).lower()
  if content_type and "application/json" not in content_type:
    raise ValueError("Content-Type harus application/json")
  raw = handler.rfile.read(length).decode("utf-8")
  if not raw:
    return {}
  try:
    parsed = json.loads(raw)
  except json.JSONDecodeError as exc:
    raise ValueError("Format JSON tidak valid") from exc
  if not isinstance(parsed, dict):
    raise ValueError("Body JSON harus berupa object")
  return parsed


def create_session(conn, user_id):
  return runtime_services.create_session(conn, execute, utc_now_iso, SESSION_TTL_HOURS, user_id)


def user_from_token(conn, auth_header):
  return runtime_services.user_from_token(conn, auth_header, utc_now_iso)


def init_schema():
  DB_PATH.parent.mkdir(parents=True, exist_ok=True)
  conn = connect_db()
  create_schema_tables(conn)
  db_migrate_schema(conn, execute)
  db_seed_roles(conn, execute)
  db_seed_geography(conn, execute, parse_geo_data, utc_now_iso)
  db_seed_admin_account(
    conn,
    execute,
    hash_password,
    utc_now_iso,
    ADMIN_LOGIN_PASSWORD,
    IS_PRODUCTION,
    generate_runtime_secret,
    record_dev_credential,
  )
  if ENABLE_DEMO_SEED:
    if IS_PRODUCTION:
      print("[SECURITY] WARNING: Demo seed is enabled in production (SIMRP_ENABLE_DEMO_SEED=true)")
    db_seed_demo(conn, execute, hash_password, utc_now_iso, DEMO_PASSWORD)
  conn.commit()
  conn.close()


def cleanup_adjustments(conn):
  return runtime_services.cleanup_adjustments(conn, execute, utc_now_iso)


def get_user_payload(conn, user_row):
  kel = None
  kampung = None
  if user_row["kelurahan_id"]:
    kel = conn.execute(
      """
      SELECT kelurahan.id AS id, kelurahan.name AS kel_name, kecamatan.name AS kec_name
      FROM kelurahan JOIN kecamatan ON kecamatan.id = kelurahan.kecamatan_id
      WHERE kelurahan.id = ?
      """,
      (user_row["kelurahan_id"],),
    ).fetchone()
    total = conn.execute("SELECT total_xp FROM xp_kelurahan WHERE kelurahan_id = ?", (kel["id"],)).fetchone()
    volunteers = conn.execute(
      "SELECT COUNT(*) AS c FROM users WHERE kelurahan_id = ? AND role_code IN ('user','ksh')",
      (kel["id"],),
    ).fetchone()["c"]
    kampung = {
      "id": kel["id"],
      "name": kel["kel_name"],
      "kecamatan": kel["kec_name"],
      "xp": int(total["total_xp"]) if total else 0,
      "volunteers": int(volunteers),
    }

  pending = conn.execute(
    """
    SELECT COUNT(*) AS c
    FROM event_participation ep
    JOIN events e ON e.id = ep.event_id
    WHERE ep.user_id = ? AND ep.status = 'attended' AND ep.checklist_done = 0 AND e.status = 'completed'
    """,
    (user_row["id"],),
  ).fetchone()["c"]

  return {
    "id": user_row["id"],
    "name": user_row["name"],
    "email": user_row["email"],
    "role": "admin" if user_row["role_code"] == "admin" else ("moderator" if str(user_row["role_code"]).startswith("moderator_t") else "user"),
    "roleCode": user_row["role_code"],
    "isKsh": bool(user_row["is_ksh"]),
    "moderatorTier": user_row["moderator_tier"],
    "tier2Badge": user_row["tier2_badge"],
    "kelurahan": kel["kel_name"] if kel else None,
    "kecamatan": kel["kec_name"] if kel else None,
    "kampungId": kel["id"] if kel else None,
    "kampung": kampung,
    "points": max(0, int(user_row["points"])),
    "badges": json.loads(user_row["badges_json"] or "[]"),
    "phoneVerified": bool(user_row["phone_verified"]),
    "hasPendingReport": bool(pending),
    "developerNote": "Definition of Kampung may shift in future (RW vs Kelurahan). Logic must stay flexible.",
  }


def can_create_event(user):
  return user["role_code"] in ("moderator_t1", "admin")


def can_approve_event(user):
  return user["role_code"] in ("moderator_t2", "admin")


def can_verify_report(user):
  return user["role_code"] in ("moderator_t2", "admin")


def common_dependencies(**extra):
  deps = {
    "API_PREFIX": API_PREFIX,
    "pagination_payload": core_pagination_payload,
    "parse_pagination": core_parse_pagination,
    "user_from_token": user_from_token,
    "write_json": write_json,
  }
  deps.update(extra)
  return deps


def mutable_dependencies(**extra):
  return common_dependencies(
    bounded_text=bounded_text,
    execute=execute,
    utc_now_iso=utc_now_iso,
    **extra,
  )


def auth_dependencies():
  return mutable_dependencies(
    ADMIN_LOGIN_PASSWORD=ADMIN_LOGIN_PASSWORD,
    ADMIN_LOGIN_USERNAME=ADMIN_LOGIN_USERNAME,
    IS_PRODUCTION=IS_PRODUCTION,
    RATE_LIMIT_AUTH_MAX=RATE_LIMIT_AUTH_MAX,
    RATE_LIMIT_WINDOW_SECONDS=RATE_LIMIT_WINDOW_SECONDS,
    create_session=create_session,
    generate_otp_code=generate_otp_code,
    get_user_payload=get_user_payload,
    hash_otp_code=hash_otp_code,
    hash_password=hash_password,
    log_audit=log_audit,
    normalize_phone_number=normalize_phone_number,
    OTP_MAX_ATTEMPTS=OTP_MAX_ATTEMPTS,
    OTP_PROVIDER=OTP_PROVIDER,
    OTP_REQUIRE_VERIFICATION=OTP_REQUIRE_VERIFICATION,
    OTP_TTL_MINUTES=OTP_TTL_MINUTES,
    rate_limited=rate_limited,
    valid_email=valid_email,
    valid_phone_number=valid_phone_number,
    valid_password=valid_password,
    verify_otp_code=verify_otp_code,
    verify_password=verify_password,
  )


def events_dependencies():
  return mutable_dependencies(
    can_approve_event=can_approve_event,
    can_create_event=can_create_event,
    create_notification=create_notification,
    log_audit=log_audit,
  )


def reports_dependencies():
  return mutable_dependencies(
    apply_xp=apply_xp,
    can_verify_report=can_verify_report,
    create_notification=create_notification,
    log_audit=log_audit,
  )


def collaboration_dependencies():
  return mutable_dependencies(
    create_notification=create_notification,
    log_audit=log_audit,
    valid_email=valid_email,
  )


def geographic_dependencies():
  return common_dependencies(
    get_geo_stats=get_geo_stats,
  )


def admin_dependencies():
  return mutable_dependencies(
    log_audit=log_audit,
  )


def notifications_dependencies():
  return common_dependencies(
    execute=execute,
  )


def certificates_dependencies():
  return common_dependencies(
    add_common_headers=add_common_headers,
  )


def rewards_dependencies():
  return mutable_dependencies(
    create_notification=create_notification,
    log_audit=log_audit,
  )


def users_dependencies():
  return mutable_dependencies(
    get_user_payload=get_user_payload,
  )


def access_requests_dependencies():
  return mutable_dependencies(
    create_notification=create_notification,
    log_audit=log_audit,
  )


def apply_xp(conn, event_row, participants):
  return runtime_services.apply_xp(conn, execute, utc_now_iso, event_row, participants)


class Handler(BaseHTTPRequestHandler):
  server_version = "SIMRP"
  sys_version = ""

  def do_OPTIONS(self):
    write_json(self, 200, {"ok": True})

  def do_GET(self):
    conn = connect_db()
    cleanup_adjustments(conn)
    try:
      parsed = urlparse(self.path)
      path = parsed.path
      query = parse_qs(parsed.query)

      if auth_api.handle_get(self, conn, path, auth_dependencies()):
        return

      if events_api.handle_get(self, conn, path, query, events_dependencies()):
        return

      if reports_api.handle_get(self, conn, path, query, reports_dependencies()):
        return

      if collaboration_api.handle_get(self, conn, path, query, collaboration_dependencies()):
        return

      if geographic_api.handle_get(self, conn, path, geographic_dependencies()):
        return

      if admin_api.handle_get(self, conn, path, admin_dependencies()):
        return

      if access_requests_api.handle_get(self, conn, path, query, access_requests_dependencies()):
        return

      if notifications_api.handle_get(self, conn, path, query, notifications_dependencies()):
        return

      if certificates_api.handle_get(self, conn, path, certificates_dependencies()):
        return

      if rewards_api.handle_get(self, conn, path, rewards_dependencies()):
        return

      if users_api.handle_get(self, conn, path, query, users_dependencies()):
        return

      return write_json(self, 404, {"error": "Not found"})
    except ValueError as exc:
      return write_json(self, 400, {"error": str(exc)})
    except Exception as exc:
      print(f"[GET] error path={self.path}: {exc}")
      if IS_PRODUCTION:
        return write_json(self, 500, {"error": "Internal server error"})
      return write_json(self, 500, {"error": str(exc)})
    finally:
      conn.commit()
      conn.close()

  def do_POST(self):
    conn = connect_db()
    cleanup_adjustments(conn)
    try:
      path = urlparse(self.path).path
      if rate_limited(self, "mutation", RATE_LIMIT_MUTATION_MAX, RATE_LIMIT_WINDOW_SECONDS):
        return write_json(self, 429, {"error": "Terlalu banyak permintaan, coba lagi sebentar"})
      body = parse_json_body(self)

      if auth_api.handle_post(self, conn, path, body, auth_dependencies()):
        return

      if events_api.handle_post(self, conn, path, body, events_dependencies()):
        return

      if reports_api.handle_post(self, conn, path, body, reports_dependencies()):
        return

      if collaboration_api.handle_post(self, conn, path, body, collaboration_dependencies()):
        return

      if access_requests_api.handle_post(self, conn, path, body, access_requests_dependencies()):
        return

      if admin_api.handle_post(self, conn, path, body, admin_dependencies()):
        return

      if notifications_api.handle_post(self, conn, path, body, notifications_dependencies()):
        return

      if rewards_api.handle_post(self, conn, path, body, rewards_dependencies()):
        return

      actor = user_from_token(conn, self.headers.get("Authorization"))
      if not actor:
        return write_json(self, 401, {"error": "Unauthorized"})

      if users_api.handle_post(self, conn, path, body, users_dependencies()):
        return

      return write_json(self, 404, {"error": "Not found"})
    except ValueError as exc:
      return write_json(self, 400, {"error": str(exc)})
    except Exception as exc:
      print(f"[POST] error path={self.path}: {exc}")
      if IS_PRODUCTION:
        return write_json(self, 500, {"error": "Internal server error"})
      return write_json(self, 500, {"error": str(exc)})
    finally:
      conn.commit()
      conn.close()

  def do_DELETE(self):
    conn = connect_db()
    try:
      path = urlparse(self.path).path
      if rate_limited(self, "mutation", RATE_LIMIT_MUTATION_MAX, RATE_LIMIT_WINDOW_SECONDS):
        return write_json(self, 429, {"error": "Terlalu banyak permintaan, coba lagi sebentar"})
      if auth_api.handle_delete(self, conn, path, auth_dependencies()):
        return
      actor = user_from_token(conn, self.headers.get("Authorization"))
      if not actor:
        return write_json(self, 401, {"error": "Unauthorized"})
      return write_json(self, 404, {"error": "Not found"})
    except Exception as exc:
      print(f"[DELETE] error path={self.path}: {exc}")
      if IS_PRODUCTION:
        return write_json(self, 500, {"error": "Internal server error"})
      return write_json(self, 500, {"error": str(exc)})
    finally:
      conn.commit()
      conn.close()

  def do_PUT(self):
    conn = connect_db()
    try:
      path = urlparse(self.path).path
      if rate_limited(self, "mutation", RATE_LIMIT_MUTATION_MAX, RATE_LIMIT_WINDOW_SECONDS):
        return write_json(self, 429, {"error": "Terlalu banyak permintaan, coba lagi sebentar"})
      actor = user_from_token(conn, self.headers.get("Authorization"))
      if not actor:
        return write_json(self, 401, {"error": "Unauthorized"})

      body = parse_json_body(self)

      if events_api.handle_put(self, conn, path, body, events_dependencies()):
        return

      if users_api.handle_put(self, conn, path, body, actor, users_dependencies()):
        return

      return write_json(self, 404, {"error": "Not found"})
    except ValueError as exc:
      return write_json(self, 400, {"error": str(exc)})
    except Exception as exc:
      print(f"[PUT] error path={self.path}: {exc}")
      if IS_PRODUCTION:
        return write_json(self, 500, {"error": "Internal server error"})
      return write_json(self, 500, {"error": str(exc)})
    finally:
      conn.commit()
      conn.close()


def main():
  validate_production_config()
  init_schema()
  write_dev_credentials_file()
  display_host = "127.0.0.1" if HOST in ("0.0.0.0", "::") else HOST
  print(f"SIMRP API: http://{display_host}:{PORT}{API_PREFIX}")
  print(f"Bind: {HOST}:{PORT}")
  print(f"DB: {DB_PATH}")
  print(f"Mode: {APP_ENV} | demo-seed={'on' if ENABLE_DEMO_SEED else 'off'}")
  server = ThreadingHTTPServer((HOST, PORT), Handler)
  server.serve_forever()


if __name__ == "__main__":
  main()
