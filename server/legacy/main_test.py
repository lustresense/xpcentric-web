"""Legacy monolithic backend copy kept for reference only."""

import json
import os
import re
import sqlite3
import uuid
import hmac
import secrets
import threading
import time
from datetime import datetime, timedelta, timezone
from hashlib import pbkdf2_hmac
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

ROOT_DIR = Path(__file__).resolve().parents[1]
DB_DIR = ROOT_DIR / "database"
DB_PATH = Path(os.environ.get("SIMRP_DB_PATH", str(DB_DIR / "runtime" / "database.db")))
GEO_PATH = ROOT_DIR / "src" / "data" / "geographicData.ts"
API_PREFIX = "/make-server-32aa5c5c"
DEV_CREDENTIALS_PATH = DB_PATH.parent / "dev_credentials.txt"
_DEV_CREDENTIAL_NOTES = []


def generate_runtime_secret():
  return secrets.token_urlsafe(24)


def record_dev_credential(label, identifier, env_name, secret):
  if IS_PRODUCTION:
    return
  _DEV_CREDENTIAL_NOTES.append({
    "label": label,
    "identifier": identifier,
    "env_name": env_name,
    "secret": secret,
  })


def write_dev_credentials_file():
  if IS_PRODUCTION or not _DEV_CREDENTIAL_NOTES:
    return
  lines = [
    "SIMREKAP local development credentials",
    "Generated because one or more demo credential environment variables were not set.",
    "This file is under database/runtime/ and must stay ignored by Git.",
    "",
  ]
  for item in _DEV_CREDENTIAL_NOTES:
    lines.extend([
      f"[{item['label']}]",
      item["identifier"],
      f"{item['env_name']}={item['secret']}",
      "",
    ])
  DEV_CREDENTIALS_PATH.parent.mkdir(parents=True, exist_ok=True)
  DEV_CREDENTIALS_PATH.write_text("\n".join(lines), encoding="utf-8")
  print(f"[SECURITY] Local development credentials file: {DEV_CREDENTIALS_PATH}")

APP_ENV = str(os.environ.get("SIMRP_ENV", "development")).strip().lower()
IS_PRODUCTION = APP_ENV in ("prod", "production")
PBKDF2_ITERATIONS = int(os.environ.get("SIMRP_PBKDF2_ITERATIONS", "210000"))
MAX_BODY_BYTES = int(os.environ.get("SIMRP_MAX_BODY_BYTES", str(8 * 1024 * 1024)))
SESSION_TTL_HOURS = int(os.environ.get("SIMRP_SESSION_TTL_HOURS", "24" if IS_PRODUCTION else "168"))
RATE_LIMIT_WINDOW_SECONDS = int(os.environ.get("SIMRP_RATE_LIMIT_WINDOW_SECONDS", "60"))
RATE_LIMIT_AUTH_MAX = int(os.environ.get("SIMRP_RATE_LIMIT_AUTH_MAX", "10"))
RATE_LIMIT_MUTATION_MAX = int(os.environ.get("SIMRP_RATE_LIMIT_MUTATION_MAX", "120"))

DEV_ALLOWED_ORIGINS = {
  "http://localhost:5173",
  "http://127.0.0.1:5173",
}
raw_allowed_origins = str(os.environ.get("SIMRP_ALLOWED_ORIGINS", "")).strip()
ALLOWED_ORIGINS = {item.strip() for item in raw_allowed_origins.split(",") if item.strip()}

ADMIN_LOGIN_USERNAME = str(os.environ.get("SIMRP_ADMIN_LOGIN_USERNAME", "")).strip()
ADMIN_LOGIN_PASSWORD = str(os.environ.get("SIMRP_ADMIN_LOGIN_PASSWORD", "")).strip()
DEMO_PASSWORD = str(os.environ.get("SIMRP_DEMO_PASSWORD", "")).strip()
if not ADMIN_LOGIN_USERNAME and not IS_PRODUCTION:
  ADMIN_LOGIN_USERNAME = "admin"
if not ADMIN_LOGIN_PASSWORD and not IS_PRODUCTION:
  ADMIN_LOGIN_PASSWORD = generate_runtime_secret()
  record_dev_credential("Admin portal", f"username={ADMIN_LOGIN_USERNAME}", "SIMRP_ADMIN_LOGIN_PASSWORD", ADMIN_LOGIN_PASSWORD)
if not DEMO_PASSWORD:
  if IS_PRODUCTION:
    raise RuntimeError("SIMRP_DEMO_PASSWORD is required for demo seed in production")
  DEMO_PASSWORD = generate_runtime_secret()
  record_dev_credential(
    "Demo user accounts",
    "emails=relawan.demo@simrp.app, moderator1.demo@simrp.app, ksh.demo@simrp.app, ...",
    "SIMRP_DEMO_PASSWORD",
    DEMO_PASSWORD,
  )

_rate_lock = threading.Lock()
_rate_hits = {}

EMAIL_PATTERN = re.compile(r"^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$")


def utc_now_iso():
  return datetime.now(timezone.utc).isoformat()


def hash_password(password):
  salt = os.urandom(16)
  digest = pbkdf2_hmac("sha256", password.encode("utf-8"), salt, PBKDF2_ITERATIONS)
  return f"{salt.hex()}:{digest.hex()}"


def verify_password(password, encoded):
  try:
    salt_hex, digest_hex = encoded.split(":", 1)
    salt = bytes.fromhex(salt_hex)
    expected = bytes.fromhex(digest_hex)
  except Exception:
    return False
  got = pbkdf2_hmac("sha256", password.encode("utf-8"), salt, PBKDF2_ITERATIONS)
  return hmac.compare_digest(got, expected)


def valid_email(email):
  return bool(EMAIL_PATTERN.match(str(email or "").strip()))


def valid_password(password):
  s = str(password or "")
  if len(s) < 8:
    return False
  has_alpha = any(ch.isalpha() for ch in s)
  has_digit = any(ch.isdigit() for ch in s)
  return has_alpha and has_digit


def bounded_text(value, max_len):
  text = str(value or "").strip()
  if len(text) > max_len:
    raise ValueError(f"Input terlalu panjang (maksimal {max_len} karakter)")
  return text


def client_ip(handler):
  forwarded = str(handler.headers.get("X-Forwarded-For", "")).strip()
  if forwarded:
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


def parse_geo_data():
  content = GEO_PATH.read_text(encoding="utf-8")
  rows = []
  current = None
  in_kelurahan_block = False

  kec_code_pattern = re.compile(r"kode:\s*'(\d{7})'")
  kec_name_pattern = re.compile(r"nama:\s*'([^']+)'")
  kel_pattern = re.compile(
    r"\{\s*kode:\s*'(\d{10})'\s*,\s*nama:\s*'([^']+)'\s*,\s*kodepos:\s*\[([^\]]*)\]"
  )
  code_pattern = re.compile(r"'(\d{5})'")

  for raw_line in content.splitlines():
    line = raw_line.strip()
    if not line or line.startswith("//"):
      continue

    if current is None:
      code_match = kec_code_pattern.search(line)
      if code_match:
        current = {"kode": code_match.group(1), "nama": "", "kelurahan": []}
      continue

    if "kelurahan:" in line and "[" in line:
      in_kelurahan_block = True
      continue

    if in_kelurahan_block:
      if line.startswith("]"):
        in_kelurahan_block = False
        continue
      kel_match = kel_pattern.search(line)
      if kel_match:
        kel_code, kel_name, code_block = kel_match.groups()
        current["kelurahan"].append(
          {"kode": kel_code, "nama": kel_name, "kodepos": code_pattern.findall(code_block)}
        )
      continue

    if not current["nama"]:
      name_match = kec_name_pattern.search(line)
      if name_match:
        current["nama"] = name_match.group(1)
      continue

    if line.startswith("},") or line.startswith("}"):
      if current["kode"] and current["nama"]:
        rows.append(current)
      current = None
      in_kelurahan_block = False

  if current and current["kode"] and current["nama"]:
    rows.append(current)
  return rows


def get_geo_stats():
  parsed = parse_geo_data()
  kecamatan_total = len(parsed)
  kelurahan_total = sum(len(kec.get("kelurahan", [])) for kec in parsed)
  postal_codes = {
    code
    for kec in parsed
    for kel in kec.get("kelurahan", [])
    for code in kel.get("kodepos", [])
    if isinstance(code, str) and len(code) == 5
  }
  return {
    "kecamatan": kecamatan_total,
    "kelurahan": kelurahan_total,
    "kodepos": len(postal_codes),
  }


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
    return json.loads(raw)
  except json.JSONDecodeError as exc:
    raise ValueError("Format JSON tidak valid") from exc


def create_session(conn, user_id):
  token = secrets.token_urlsafe(48)
  now = utc_now_iso()
  expires = (datetime.now(timezone.utc) + timedelta(hours=SESSION_TTL_HOURS)).isoformat()
  execute(
    conn,
    "INSERT INTO sessions(token, user_id, expires_at, created_at) VALUES(?, ?, ?, ?)",
    (token, user_id, expires, now),
  )
  return token


def user_from_token(conn, auth_header):
  if not auth_header or not auth_header.startswith("Bearer "):
    return None
  token = auth_header.split(" ", 1)[1].strip()
  return conn.execute(
    """
    SELECT users.*
    FROM sessions
    JOIN users ON users.id = sessions.user_id
    WHERE sessions.token = ? AND sessions.expires_at > ?
    """,
    (token, utc_now_iso()),
  ).fetchone()


def init_schema():
  DB_PATH.parent.mkdir(parents=True, exist_ok=True)
  conn = connect_db()
  execute(
    conn,
    """
    CREATE TABLE IF NOT EXISTS roles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL
    )
    """,
  )
  execute(
    conn,
    """
    CREATE TABLE IF NOT EXISTS role_attributes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      role_id INTEGER NOT NULL,
      attribute_key TEXT NOT NULL,
      attribute_value TEXT NOT NULL,
      FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
    )
    """,
  )
  execute(
    conn,
    """
    CREATE TABLE IF NOT EXISTS kecamatan (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL UNIQUE
    )
    """,
  )
  execute(
    conn,
    """
    CREATE TABLE IF NOT EXISTS kelurahan (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL UNIQUE,
      kecamatan_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      FOREIGN KEY (kecamatan_id) REFERENCES kecamatan(id) ON DELETE CASCADE
    )
    """,
  )
  execute(
    conn,
    """
    CREATE TABLE IF NOT EXISTS postal_codes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL UNIQUE
    )
    """,
  )
  execute(
    conn,
    """
    CREATE TABLE IF NOT EXISTS kampung_mapping (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      kelurahan_id INTEGER NOT NULL,
      postal_code_id INTEGER NOT NULL,
      UNIQUE(kelurahan_id, postal_code_id),
      FOREIGN KEY (kelurahan_id) REFERENCES kelurahan(id) ON DELETE CASCADE,
      FOREIGN KEY (postal_code_id) REFERENCES postal_codes(id) ON DELETE CASCADE
    )
    """,
  )
  execute(
    conn,
    """
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      nik TEXT,
      rw TEXT,
      role_code TEXT NOT NULL,
      is_ksh INTEGER NOT NULL DEFAULT 0,
      moderator_tier INTEGER,
      tier2_badge TEXT,
      email_verified INTEGER NOT NULL DEFAULT 1,
      kelurahan_id INTEGER,
      kecamatan_id INTEGER,
      points INTEGER NOT NULL DEFAULT 0,
      badges_json TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (kelurahan_id) REFERENCES kelurahan(id),
      FOREIGN KEY (kecamatan_id) REFERENCES kecamatan(id)
    )
    """,
  )
  execute(
    conn,
    """
    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      pillar INTEGER NOT NULL,
      event_date TEXT NOT NULL,
      event_time TEXT,
      location TEXT,
      quota INTEGER NOT NULL DEFAULT 0,
      scope_type TEXT NOT NULL CHECK(scope_type IN ('kelurahan','kecamatan')),
      kecamatan_id INTEGER NOT NULL,
      kelurahan_id INTEGER,
      created_by_user_id TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('draft','approved','published','completed')),
      output_summary TEXT,
      published_at TEXT,
      completed_at TEXT,
      completed_by_user_id TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (kecamatan_id) REFERENCES kecamatan(id),
      FOREIGN KEY (kelurahan_id) REFERENCES kelurahan(id),
      FOREIGN KEY (created_by_user_id) REFERENCES users(id)
    )
    """,
  )
  execute(
    conn,
    """
    CREATE TABLE IF NOT EXISTS event_participation (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('registered','attended','reported')),
      checklist_done INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE(event_id, user_id),
      FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
    """,
  )
  execute(
    conn,
    """
    CREATE TABLE IF NOT EXISTS event_reports (
      id TEXT PRIMARY KEY,
      event_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      participants INTEGER NOT NULL,
      checklist_json TEXT NOT NULL,
      outcome_tags_json TEXT NOT NULL,
      photo_url TEXT,
      status TEXT NOT NULL CHECK(status IN ('pending','verified','rejected')),
      points_awarded INTEGER NOT NULL DEFAULT 0,
      verified_by_user_id TEXT,
      verified_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
    """,
  )
  execute(
    conn,
    """
    CREATE TABLE IF NOT EXISTS xp_kelurahan (
      kelurahan_id INTEGER PRIMARY KEY,
      total_xp INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (kelurahan_id) REFERENCES kelurahan(id) ON DELETE CASCADE
    )
    """,
  )
  execute(
    conn,
    """
    CREATE TABLE IF NOT EXISTS xp_pillar (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      kelurahan_id INTEGER NOT NULL,
      pillar INTEGER NOT NULL,
      xp INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL,
      UNIQUE(kelurahan_id, pillar),
      FOREIGN KEY (kelurahan_id) REFERENCES kelurahan(id) ON DELETE CASCADE
    )
    """,
  )
  execute(
    conn,
    """
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      actor_user_id TEXT,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT,
      payload_json TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL
    )
    """,
  )
  execute(
    conn,
    """
    CREATE TABLE IF NOT EXISTS collaboration_requests (
      id TEXT PRIMARY KEY,
      organization_name TEXT NOT NULL,
      pic_name TEXT NOT NULL,
      email TEXT NOT NULL,
      support_type TEXT NOT NULL CHECK(support_type IN ('dana','konsumsi','peralatan','media_partner','lainnya')),
      contribution_scope TEXT NOT NULL DEFAULT 'kota' CHECK(contribution_scope IN ('kota','kecamatan','kelurahan')),
      scope_kecamatan_id INTEGER,
      scope_kelurahan_id INTEGER,
      support_description TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('pending','approved','rejected')),
      reviewed_by_user_id TEXT,
      reviewed_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (reviewed_by_user_id) REFERENCES users(id),
      FOREIGN KEY (scope_kecamatan_id) REFERENCES kecamatan(id),
      FOREIGN KEY (scope_kelurahan_id) REFERENCES kelurahan(id)
    )
    """,
  )
  execute(
    conn,
    """
    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
    """,
  )
  execute(
    conn,
    """
    CREATE TABLE IF NOT EXISTS temporary_adjustments (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      adjustment_type TEXT NOT NULL CHECK(adjustment_type IN ('points','badge','role')),
      value_json TEXT NOT NULL,
      reason TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
    """,
  )
  migrate_schema(conn)
  seed_roles(conn)
  # seed_geography(conn)  # Skip for now - causes parsing issues
  seed_demo(conn)
  conn.commit()
  conn.close()


def migrate_schema(conn):
  user_cols = {row["name"] for row in conn.execute("PRAGMA table_info(users)").fetchall()}
  if "tier2_badge" not in user_cols:
    execute(conn, "ALTER TABLE users ADD COLUMN tier2_badge TEXT")

  collab_cols = {row["name"] for row in conn.execute("PRAGMA table_info(collaboration_requests)").fetchall()}
  if "contribution_scope" not in collab_cols:
    execute(conn, "ALTER TABLE collaboration_requests ADD COLUMN contribution_scope TEXT NOT NULL DEFAULT 'kota'")
  if "scope_kecamatan_id" not in collab_cols:
    execute(conn, "ALTER TABLE collaboration_requests ADD COLUMN scope_kecamatan_id INTEGER")
  if "scope_kelurahan_id" not in collab_cols:
    execute(conn, "ALTER TABLE collaboration_requests ADD COLUMN scope_kelurahan_id INTEGER")

  event_cols = conn.execute("PRAGMA table_info(events)").fetchall()
  names = {row["name"] for row in event_cols}
  kel_notnull = 1
  for row in event_cols:
    if row["name"] == "kelurahan_id":
      kel_notnull = int(row["notnull"])
      break
  needs_event_migration = (
    "scope_type" not in names or
    "kecamatan_id" not in names or
    kel_notnull == 1
  )
  if not needs_event_migration:
    return

  execute(conn, "ALTER TABLE events RENAME TO events_legacy")
  execute(
    conn,
    """
    CREATE TABLE events (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      pillar INTEGER NOT NULL,
      event_date TEXT NOT NULL,
      event_time TEXT,
      location TEXT,
      quota INTEGER NOT NULL DEFAULT 0,
      scope_type TEXT NOT NULL CHECK(scope_type IN ('kelurahan','kecamatan')),
      kecamatan_id INTEGER NOT NULL,
      kelurahan_id INTEGER,
      created_by_user_id TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('draft','approved','published','completed')),
      output_summary TEXT,
      published_at TEXT,
      completed_at TEXT,
      completed_by_user_id TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (kecamatan_id) REFERENCES kecamatan(id),
      FOREIGN KEY (kelurahan_id) REFERENCES kelurahan(id),
      FOREIGN KEY (created_by_user_id) REFERENCES users(id)
    )
    """,
  )
  legacy_cols = {row["name"] for row in conn.execute("PRAGMA table_info(events_legacy)").fetchall()}
  if "kecamatan_id" in legacy_cols:
    kec_expr = "COALESCE(events_legacy.kecamatan_id, (SELECT kecamatan_id FROM kelurahan WHERE id = events_legacy.kelurahan_id))"
  else:
    kec_expr = "(SELECT kecamatan_id FROM kelurahan WHERE id = events_legacy.kelurahan_id)"
  execute(
    conn,
    f"""
    INSERT INTO events(
      id, title, description, pillar, event_date, event_time, location, quota,
      scope_type, kecamatan_id, kelurahan_id, created_by_user_id, status,
      output_summary, published_at, completed_at, completed_by_user_id, created_at, updated_at
    )
    SELECT
      events_legacy.id,
      events_legacy.title,
      events_legacy.description,
      events_legacy.pillar,
      events_legacy.event_date,
      events_legacy.event_time,
      events_legacy.location,
      events_legacy.quota,
      'kelurahan',
      {kec_expr},
      events_legacy.kelurahan_id,
      events_legacy.created_by_user_id,
      CASE WHEN events_legacy.status = 'rejected' THEN 'draft' ELSE events_legacy.status END,
      events_legacy.output_summary,
      events_legacy.published_at,
      events_legacy.completed_at,
      events_legacy.completed_by_user_id,
      events_legacy.created_at,
      events_legacy.updated_at
    FROM events_legacy
    """,
  )
  execute(conn, "DROP TABLE events_legacy")


def seed_roles(conn):
  roles = [
    ("user", "Relawan"),
    ("ksh", "Verified KSH"),
    ("moderator_t1", "Moderator Tier 1"),
    ("moderator_t2", "Moderator Tier 2"),
    ("moderator_t3", "Moderator Tier 3"),
    ("admin", "Administrator"),
  ]
  for code, name in roles:
    execute(conn, "INSERT OR IGNORE INTO roles(code, name) VALUES(?, ?)", (code, name))


def seed_geography(conn):
  # Keep DB in-sync with src/data/geographicData.ts by code (not by existing names).
  # This repairs legacy demo DBs where kelurahan names/kodepos mappings were shifted.
  # IMPORTANT: do not recreate rows to preserve foreign-key references from users/events.
  parsed = parse_geo_data()
  valid_kel_codes = set()
  for kec in parsed:
    execute(conn, "INSERT OR IGNORE INTO kecamatan(code, name) VALUES(?, ?)", (kec["kode"], kec["nama"]))
    execute(conn, "UPDATE kecamatan SET name = ? WHERE code = ?", (kec["nama"], kec["kode"]))
    kec_id = conn.execute("SELECT id FROM kecamatan WHERE code = ?", (kec["kode"],)).fetchone()["id"]

    for kel in kec["kelurahan"]:
      valid_kel_codes.add(kel["kode"])
      execute(
        conn,
        "INSERT OR IGNORE INTO kelurahan(code, kecamatan_id, name) VALUES(?, ?, ?)",
        (kel["kode"], kec_id, kel["nama"]),
      )
      execute(
        conn,
        "UPDATE kelurahan SET name = ?, kecamatan_id = ? WHERE code = ?",
        (kel["nama"], kec_id, kel["kode"]),
      )
      kel_id = conn.execute("SELECT id FROM kelurahan WHERE code = ?", (kel["kode"],)).fetchone()["id"]

      # Replace mapping for this kelurahan with exact mapping from geographicData.ts.
      execute(conn, "DELETE FROM kampung_mapping WHERE kelurahan_id = ?", (kel_id,))
      for code in kel["kodepos"]:
        execute(conn, "INSERT OR IGNORE INTO postal_codes(code) VALUES(?)", (code,))
        p_id = conn.execute("SELECT id FROM postal_codes WHERE code = ?", (code,)).fetchone()["id"]
        execute(conn, "INSERT OR IGNORE INTO kampung_mapping(kelurahan_id, postal_code_id) VALUES(?, ?)", (kel_id, p_id))

      execute(conn, "INSERT OR IGNORE INTO xp_kelurahan(kelurahan_id, total_xp, updated_at) VALUES(?, 0, ?)", (kel_id, utc_now_iso()))
      for pillar in (1, 2, 3, 4):
        execute(
          conn,
          "INSERT OR IGNORE INTO xp_pillar(kelurahan_id, pillar, xp, updated_at) VALUES(?, ?, 0, ?)",
          (kel_id, pillar, utc_now_iso()),
        )

  # Remove stale postcode links from deprecated kelurahan rows so `/kodepos/*`
  # always follows canonical mapping from geographicData.ts.
  if valid_kel_codes:
    placeholders = ",".join(["?"] * len(valid_kel_codes))
    execute(
      conn,
      f"""
      DELETE FROM kampung_mapping
      WHERE kelurahan_id IN (
        SELECT id FROM kelurahan WHERE code NOT IN ({placeholders})
      )
      """,
      tuple(sorted(valid_kel_codes)),
    )


def insert_user(conn, name, email, password, role_code, *, is_ksh=0, tier=None, tier2_badge=None, kelurahan_name=None):
  if conn.execute("SELECT id FROM users WHERE email = ?", (email,)).fetchone():
    return
  kel = None
  if kelurahan_name:
    kel = conn.execute(
      """
      SELECT kelurahan.id AS id, kecamatan.id AS kec_id
      FROM kelurahan JOIN kecamatan ON kecamatan.id = kelurahan.kecamatan_id
      WHERE kelurahan.name = ? LIMIT 1
      """,
      (kelurahan_name,),
    ).fetchone()
  user_id = str(uuid.uuid4())
  now = utc_now_iso()
  execute(
    conn,
    """
    INSERT INTO users(
      id, name, email, password_hash, role_code, is_ksh, moderator_tier,
      tier2_badge, kelurahan_id, kecamatan_id, created_at, updated_at
    )
    VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """,
    (
      user_id,
      name,
      email,
      hash_password(password),
      role_code,
      1 if is_ksh else 0,
      tier,
      tier2_badge,
      kel["id"] if kel else None,
      kel["kec_id"] if kel else None,
      now,
      now,
    ),
  )


def seed_demo(conn):
  admin_seed_password = str(os.environ.get("SIMRP_SEED_ADMIN_PASSWORD", "")).strip()
  if not admin_seed_password:
    if IS_PRODUCTION:
      raise RuntimeError("SIMRP_SEED_ADMIN_PASSWORD is required for demo seed in production")
    admin_seed_password = generate_runtime_secret()
    record_dev_credential("Seed admin account", "email=admin@simrp.local", "SIMRP_SEED_ADMIN_PASSWORD", admin_seed_password)
  insert_user(conn, "Administrator", "admin@simrp.local", admin_seed_password, "admin", kelurahan_name="Keputih")
  insert_user(conn, "Andi Relawan", "relawan.demo@simrp.app", DEMO_PASSWORD, "user", kelurahan_name="Bulak")
  insert_user(conn, "Nia Relawan", "relawan2.demo@simrp.app", DEMO_PASSWORD, "user", kelurahan_name="Keputih")
  insert_user(conn, "Budi Relawan", "relawan3.demo@simrp.app", DEMO_PASSWORD, "user", kelurahan_name="Wonorejo")
  insert_user(conn, "Kak Esa", "ksh.demo@simrp.app", DEMO_PASSWORD, "ksh", is_ksh=1, kelurahan_name="Keputih")
  insert_user(conn, "Pak Raka ASN", "moderator1.demo@simrp.app", DEMO_PASSWORD, "moderator_t1", tier=1, kelurahan_name="Keputih")
  insert_user(conn, "Bu Sinta Lurah", "moderator2.demo@simrp.app", DEMO_PASSWORD, "moderator_t2", tier=2, tier2_badge="lurah", kelurahan_name="Keputih")
  insert_user(conn, "Pak Dimas Camat", "moderator2.camat@simrp.app", DEMO_PASSWORD, "moderator_t2", tier=2, tier2_badge="camat", kelurahan_name="Keputih")
  insert_user(conn, "Pak Arif", "moderator3.demo@simrp.app", DEMO_PASSWORD, "moderator_t3", tier=3, kelurahan_name="Keputih")
  execute(
    conn,
    "UPDATE users SET tier2_badge = 'lurah' WHERE role_code = 'moderator_t2' AND (tier2_badge IS NULL OR tier2_badge = '')",
  )

  creator = conn.execute("SELECT id FROM users WHERE role_code = 'moderator_t1' LIMIT 1").fetchone()
  keputih = conn.execute("SELECT id FROM kelurahan WHERE name = 'Keputih' LIMIT 1").fetchone()
  bulak = conn.execute("SELECT id FROM kelurahan WHERE name = 'Bulak' LIMIT 1").fetchone()
  wonorejo = conn.execute("SELECT id FROM kelurahan WHERE name = 'Wonorejo' LIMIT 1").fetchone()
  if not creator or not keputih or not bulak or not wonorejo:
    return
  keputih_kec = conn.execute("SELECT kecamatan_id FROM kelurahan WHERE id = ?", (keputih["id"],)).fetchone()["kecamatan_id"]
  wonorejo_kec = conn.execute("SELECT kecamatan_id FROM kelurahan WHERE id = ?", (wonorejo["id"],)).fetchone()["kecamatan_id"]
  bulak_kec = conn.execute("SELECT kecamatan_id FROM kelurahan WHERE id = ?", (bulak["id"],)).fetchone()["kecamatan_id"]
  events = [
    ("event-seed-1", "Aksi Bersih Taman Kampung", "Pembersihan area publik.", 1, "2026-02-20", "07:00", "Balai RW Keputih", 40, "kelurahan", keputih_kec, keputih["id"], "published"),
    ("event-seed-2", "Pelatihan UMKM Digital", "Pendampingan UMKM kampung.", 2, "2026-02-22", "13:00", "Aula Kelurahan", 30, "kelurahan", keputih_kec, keputih["id"], "published"),
    ("event-seed-3", "Forum Guyub Warga", "Forum sosial antar warga.", 3, "2026-02-25", "19:00", "Pendopo Wonorejo", 50, "kecamatan", wonorejo_kec, None, "published"),
    ("event-seed-4", "Festival Seni Kampung", "Kegiatan budaya lokal.", 4, "2026-02-27", "18:00", "Lapangan Bulak", 60, "kelurahan", bulak_kec, bulak["id"], "draft"),
  ]
  for event in events:
    execute(
      conn,
      """
      INSERT OR IGNORE INTO events(
        id, title, description, pillar, event_date, event_time, location, quota,
        scope_type, kecamatan_id, kelurahan_id, created_by_user_id, status, created_at, updated_at, published_at
      )
      VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      """,
      (
        event[0], event[1], event[2], event[3], event[4], event[5], event[6], event[7],
        event[8], event[9], event[10], creator["id"], event[11], utc_now_iso(), utc_now_iso(), utc_now_iso() if event[11] == "published" else None
      ),
    )

  requests = [
    (
      "collab-seed-1",
      "Komunitas Hijau Surabaya",
      "Rina Putri",
      "rina@hijausby.id",
      "peralatan",
      "Dukungan alat kebersihan untuk 3 kegiatan lingkungan di kelurahan.",
      "pending",
    ),
    (
      "collab-seed-2",
      "PT Sejahtera Pangan",
      "Dedi Saputra",
      "dedi@sejahterapangan.co.id",
      "konsumsi",
      "Penyediaan konsumsi relawan pada kegiatan kemasyarakatan bulanan.",
      "pending",
    ),
  ]
  for req in requests:
    execute(
      conn,
      """
      INSERT OR IGNORE INTO collaboration_requests(
        id, organization_name, pic_name, email, support_type, support_description,
        status, reviewed_by_user_id, reviewed_at, created_at, updated_at
      )
      VALUES(?, ?, ?, ?, ?, ?, ?, NULL, NULL, ?, ?)
      """,
      (req[0], req[1], req[2], req[3], req[4], req[5], req[6], utc_now_iso(), utc_now_iso()),
    )


def cleanup_adjustments(conn):
  now = utc_now_iso()
  rows = conn.execute("SELECT * FROM temporary_adjustments WHERE expires_at <= ?", (now,)).fetchall()
  for row in rows:
    if row["adjustment_type"] == "points":
      value = json.loads(row["value_json"])
      execute(conn, "UPDATE users SET points = points - ? WHERE id = ?", (int(value.get("points", 0)), row["user_id"]))
    if row["adjustment_type"] == "badge":
      value = json.loads(row["value_json"])
      user = conn.execute("SELECT badges_json FROM users WHERE id = ?", (row["user_id"],)).fetchone()
      badges = json.loads(user["badges_json"] or "[]")
      badge_id = value.get("badgeId")
      badges = [item for item in badges if item.get("id") != badge_id]
      execute(conn, "UPDATE users SET badges_json = ? WHERE id = ?", (json.dumps(badges), row["user_id"]))
  execute(conn, "DELETE FROM temporary_adjustments WHERE expires_at <= ?", (now,))


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
    "points": int(user_row["points"]),
    "badges": json.loads(user_row["badges_json"] or "[]"),
    "hasPendingReport": bool(pending),
    "developerNote": "Definition of Kampung may shift in future (RW vs Kelurahan). Logic must stay flexible.",
  }


def can_create_event(user):
  return user["role_code"] in ("moderator_t1", "admin")


def can_approve_event(user):
  return user["role_code"] in ("moderator_t2", "admin")


def can_verify_report(user):
  return user["role_code"] in ("moderator_t2", "admin")


def apply_xp(conn, event_row, participants):
  kelurahan_id = event_row["kelurahan_id"]
  pillar = int(event_row["pillar"])
  base = 20 + (participants * 2)
  rows = conn.execute("SELECT pillar, xp FROM xp_pillar WHERE kelurahan_id = ?", (kelurahan_id,)).fetchall()
  pillar_map = {int(r["pillar"]): int(r["xp"]) for r in rows}
  total = sum(pillar_map.values())
  avg = total / 4 if total else 0
  p_value = pillar_map.get(pillar, 0)
  multiplier = 1.0
  if total > 0 and p_value > avg * 1.2:
    multiplier = 0.7
  elif total > 0 and p_value < avg * 0.8:
    multiplier = 1.3
  gained = int(round(base * multiplier))
  now = utc_now_iso()
  execute(
    conn,
    "UPDATE xp_pillar SET xp = xp + ?, updated_at = ? WHERE kelurahan_id = ? AND pillar = ?",
    (gained, now, kelurahan_id, pillar),
  )
  execute(
    conn,
    "UPDATE xp_kelurahan SET total_xp = total_xp + ?, updated_at = ? WHERE kelurahan_id = ?",
    (gained, now, kelurahan_id),
  )
  return gained


class Handler(BaseHTTPRequestHandler):
  def do_OPTIONS(self):
    write_json(self, 200, {"ok": True})

  def do_GET(self):
    conn = connect_db()
    cleanup_adjustments(conn)
    try:
      parsed = urlparse(self.path)
      path = parsed.path
      query = parse_qs(parsed.query)

      if path == f"{API_PREFIX}/health":
        return write_json(self, 200, {"status": "ok"})

      if path == f"{API_PREFIX}/auth/me":
        user = user_from_token(conn, self.headers.get("Authorization"))
        if not user:
          return write_json(self, 401, {"error": "Unauthorized"})
        return write_json(self, 200, {"user": get_user_payload(conn, user)})

      if path.startswith(f"{API_PREFIX}/kodepos/"):
        code = path.split("/")[-1]
        rows = conn.execute(
          """
          SELECT postal_codes.code AS kodepos, kelurahan.name AS kelurahan, kecamatan.name AS kecamatan
          FROM postal_codes
          JOIN kampung_mapping ON kampung_mapping.postal_code_id = postal_codes.id
          JOIN kelurahan ON kelurahan.id = kampung_mapping.kelurahan_id
          JOIN kecamatan ON kecamatan.id = kelurahan.kecamatan_id
          WHERE postal_codes.code = ?
          ORDER BY kelurahan.name
          """,
          (code,),
        ).fetchall()
        if not rows:
          return write_json(self, 404, {"error": "Kodepos tidak ditemukan"})
        payload = [{"kelurahan": r["kelurahan"], "kecamatan": r["kecamatan"]} for r in rows]
        return write_json(self, 200, {"kodepos": code, "kelurahan": payload})

      if path == f"{API_PREFIX}/geo/options":
        rows = conn.execute(
          """
          SELECT
            kecamatan.id AS kec_id,
            kecamatan.name AS kec_name,
            kelurahan.id AS kel_id,
            kelurahan.name AS kel_name,
            postal_codes.code AS kodepos
          FROM kampung_mapping
          JOIN kelurahan ON kelurahan.id = kampung_mapping.kelurahan_id
          JOIN kecamatan ON kecamatan.id = kelurahan.kecamatan_id
          JOIN postal_codes ON postal_codes.id = kampung_mapping.postal_code_id
          ORDER BY kecamatan.name ASC, kelurahan.name ASC, postal_codes.code ASC
          """
        ).fetchall()
        grouped = {}
        for row in rows:
          if row["kec_id"] not in grouped:
            grouped[row["kec_id"]] = {"id": row["kec_id"], "name": row["kec_name"], "kelurahan": [], "_kel_idx": {}}
          if row["kel_id"] is not None:
            key = row["kel_id"]
            if key not in grouped[row["kec_id"]]["_kel_idx"]:
              grouped[row["kec_id"]]["_kel_idx"][key] = len(grouped[row["kec_id"]]["kelurahan"])
              grouped[row["kec_id"]]["kelurahan"].append({"id": row["kel_id"], "name": row["kel_name"], "kodepos": []})
            kel_idx = grouped[row["kec_id"]]["_kel_idx"][key]
            if row["kodepos"] is not None and row["kodepos"] not in grouped[row["kec_id"]]["kelurahan"][kel_idx]["kodepos"]:
              grouped[row["kec_id"]]["kelurahan"][kel_idx]["kodepos"].append(row["kodepos"])
        result = []
        for kec in grouped.values():
          out = {"id": kec["id"], "name": kec["name"], "kelurahan": kec["kelurahan"]}
          result.append(out)
        return write_json(self, 200, {"kecamatan": result})

      if path == f"{API_PREFIX}/geo/stats":
        stats = get_geo_stats()
        return write_json(
          self,
          200,
          {
            "stats": {
              "kecamatan": int(stats["kecamatan"]),
              "kelurahan": int(stats["kelurahan"]),
              "kodepos": int(stats["kodepos"]),
            }
          },
        )

      if path == f"{API_PREFIX}/landing/leaderboard":
        rows = conn.execute(
          """
          SELECT kelurahan.name AS kelurahan, kecamatan.name AS kecamatan, xp_kelurahan.total_xp AS xp
          FROM xp_kelurahan
          JOIN kelurahan ON kelurahan.id = xp_kelurahan.kelurahan_id
          JOIN kecamatan ON kecamatan.id = kelurahan.kecamatan_id
          WHERE EXISTS (
            SELECT 1 FROM kampung_mapping WHERE kampung_mapping.kelurahan_id = kelurahan.id
          )
          ORDER BY xp_kelurahan.total_xp DESC, kelurahan.name ASC
          LIMIT 7
          """
        ).fetchall()
        entries = [
          {
            "rank": idx + 1,
            "kelurahan": row["kelurahan"],
            "kecamatan": row["kecamatan"],
            "xp": int(row["xp"]),
          }
          for idx, row in enumerate(rows)
        ]
        return write_json(self, 200, {"leaderboard": entries})

      if path == f"{API_PREFIX}/kampung":
        actor = user_from_token(conn, self.headers.get("Authorization"))
        if not actor:
          return write_json(self, 401, {"error": "Unauthorized"})
        rows = conn.execute(
          """
          SELECT kelurahan.id AS id, kelurahan.name AS name, kecamatan.name AS kecamatan, xp_kelurahan.total_xp AS xp
          FROM kelurahan
          JOIN kecamatan ON kecamatan.id = kelurahan.kecamatan_id
          JOIN xp_kelurahan ON xp_kelurahan.kelurahan_id = kelurahan.id
          WHERE EXISTS (
            SELECT 1 FROM kampung_mapping WHERE kampung_mapping.kelurahan_id = kelurahan.id
          )
          ORDER BY xp_kelurahan.total_xp DESC, kelurahan.name ASC
          LIMIT 100
          """
        ).fetchall()
        data = [{"id": r["id"], "name": r["name"], "kecamatan": r["kecamatan"], "xp": int(r["xp"])} for r in rows]
        return write_json(self, 200, {"kampung": data})

      if path == f"{API_PREFIX}/collaboration-requests":
        actor = user_from_token(conn, self.headers.get("Authorization"))
        if not actor:
          return write_json(self, 401, {"error": "Unauthorized"})
        if actor["role_code"] not in ("moderator_t2", "admin"):
          return write_json(self, 403, {"error": "Hanya Moderator Tier 2/Admin"})
        status_filter = query.get("status", [None])[0]
        sql = """
          SELECT
            collaboration_requests.*,
            users.name AS reviewer_name,
            kecamatan.name AS scope_kecamatan_name,
            kelurahan.name AS scope_kelurahan_name
          FROM collaboration_requests
          LEFT JOIN users ON users.id = collaboration_requests.reviewed_by_user_id
          LEFT JOIN kecamatan ON kecamatan.id = collaboration_requests.scope_kecamatan_id
          LEFT JOIN kelurahan ON kelurahan.id = collaboration_requests.scope_kelurahan_id
          WHERE 1=1
        """
        params = []
        if status_filter in ("pending", "approved", "rejected"):
          sql += " AND collaboration_requests.status = ?"
          params.append(status_filter)
        sql += " ORDER BY collaboration_requests.created_at DESC"
        rows = conn.execute(sql, tuple(params)).fetchall()
        requests = []
        for row in rows:
          requests.append(
            {
              "id": row["id"],
              "organizationName": row["organization_name"],
              "picName": row["pic_name"],
              "email": row["email"],
              "supportType": row["support_type"],
              "contributionScope": row["contribution_scope"] or "kota",
              "scopeKecamatanId": row["scope_kecamatan_id"],
              "scopeKelurahanId": row["scope_kelurahan_id"],
              "scopeKecamatanName": row["scope_kecamatan_name"],
              "scopeKelurahanName": row["scope_kelurahan_name"],
              "supportDescription": row["support_description"],
              "status": row["status"],
              "reviewedByName": row["reviewer_name"],
              "reviewedAt": row["reviewed_at"],
              "createdAt": row["created_at"],
            }
          )
        return write_json(self, 200, {"requests": requests})

      if path == f"{API_PREFIX}/users":
        actor = user_from_token(conn, self.headers.get("Authorization"))
        if not actor:
          return write_json(self, 401, {"error": "Unauthorized"})
        role_filter = query.get("role", [None])[0]
        kampung_filter = query.get("kampungId", [None])[0]
        sql = """
          SELECT users.*, kelurahan.name AS kel_name, kecamatan.name AS kec_name
          FROM users
          LEFT JOIN kelurahan ON kelurahan.id = users.kelurahan_id
          LEFT JOIN kecamatan ON kecamatan.id = users.kecamatan_id
          WHERE 1=1
        """
        params = []
        if role_filter == "user":
          sql += " AND users.role_code IN ('user','ksh')"
        if kampung_filter:
          sql += " AND users.kelurahan_id = ?"
          params.append(int(kampung_filter))
        sql += " ORDER BY users.name ASC"
        rows = conn.execute(sql, tuple(params)).fetchall()
        users = []
        for r in rows:
          users.append(
            {
              "id": r["id"],
              "name": r["name"],
              "email": r["email"],
              "role": "admin" if r["role_code"] == "admin" else ("moderator" if str(r["role_code"]).startswith("moderator_t") else "user"),
              "roleCode": r["role_code"],
              "isKsh": bool(r["is_ksh"]),
              "moderatorTier": r["moderator_tier"],
              "tier2Badge": r["tier2_badge"],
              "kecamatan": r["kec_name"],
              "kelurahan": r["kel_name"],
              "kampungId": r["kelurahan_id"],
              "points": int(r["points"]),
            }
          )
        return write_json(self, 200, {"users": users})

      if path == f"{API_PREFIX}/events":
        actor = user_from_token(conn, self.headers.get("Authorization"))
        if not actor:
          return write_json(self, 401, {"error": "Unauthorized"})
        status_filter = query.get("status", [None])[0]
        sql = """
          SELECT events.*, kelurahan.name AS kelurahan, kecamatan.name AS kecamatan
          FROM events
          LEFT JOIN kelurahan ON kelurahan.id = events.kelurahan_id
          LEFT JOIN kecamatan ON kecamatan.id = events.kecamatan_id
          WHERE 1=1
        """
        params = []
        if status_filter:
          sql += " AND events.status = ?"
          params.append(status_filter)
        if actor and actor["is_ksh"]:
          sql += " AND ((events.scope_type = 'kelurahan' AND events.kelurahan_id = ?) OR (events.scope_type = 'kecamatan' AND events.kecamatan_id = ?))"
          params.append(actor["kelurahan_id"])
          params.append(actor["kecamatan_id"])
        sql += " ORDER BY events.event_date ASC"
        rows = conn.execute(sql, tuple(params)).fetchall()
        out = []
        for r in rows:
          participants = conn.execute("SELECT user_id FROM event_participation WHERE event_id = ?", (r["id"],)).fetchall()
          out.append(
            {
              "id": r["id"],
              "title": r["title"],
              "description": r["description"],
              "pillar": int(r["pillar"]),
              "date": r["event_date"],
              "time": r["event_time"],
              "location": r["location"],
              "quota": int(r["quota"]),
              "scopeType": r["scope_type"],
              "status": r["status"],
              "kelurahan": r["kelurahan"],
              "kecamatan": r["kecamatan"],
              "participants": [p["user_id"] for p in participants],
            }
          )
        return write_json(self, 200, {"events": out})

      if path == f"{API_PREFIX}/reports":
        actor = user_from_token(conn, self.headers.get("Authorization"))
        if not actor:
          return write_json(self, 401, {"error": "Unauthorized"})
        status_filter = query.get("status", [None])[0]
        user_filter = query.get("userId", [None])[0]
        sql = "SELECT * FROM event_reports WHERE 1=1"
        params = []
        if status_filter:
          sql += " AND status = ?"
          params.append(status_filter)
        if user_filter:
          sql += " AND user_id = ?"
          params.append(user_filter)
        sql += " ORDER BY created_at DESC"
        rows = conn.execute(sql, tuple(params)).fetchall()
        out = []
        for r in rows:
          out.append(
            {
              "id": r["id"],
              "eventId": r["event_id"],
              "userId": r["user_id"],
              "participants": int(r["participants"]),
              "outcomeTags": json.loads(r["outcome_tags_json"] or "[]"),
              "photoUrl": r["photo_url"],
              "status": r["status"],
              "points": int(r["points_awarded"]),
              "createdAt": r["created_at"],
            }
          )
        return write_json(self, 200, {"reports": out})

      if path == f"{API_PREFIX}/recommendations":
        return write_json(self, 410, {"error": "ASN recommendation is off-system"})

      if path == f"{API_PREFIX}/admin/temporary-adjustments":
        actor = user_from_token(conn, self.headers.get("Authorization"))
        if not actor or actor["role_code"] != "admin":
          return write_json(self, 403, {"error": "Admin only"})
        rows = conn.execute(
          """
          SELECT temporary_adjustments.*, users.name AS user_name
          FROM temporary_adjustments
          JOIN users ON users.id = temporary_adjustments.user_id
          ORDER BY temporary_adjustments.created_at DESC
          """
        ).fetchall()
        out = []
        for r in rows:
          value = json.loads(r["value_json"])
          out.append(
            {
              "id": r["id"],
              "type": r["adjustment_type"],
              "value": value.get("points") if r["adjustment_type"] == "points" else value.get("badgeId", ""),
              "reason": r["reason"],
              "grantedAt": r["created_at"],
              "expiresAt": r["expires_at"],
              "targetUserName": r["user_name"],
            }
          )
        return write_json(self, 200, {"adjustments": out})

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

      if path == f"{API_PREFIX}/auth/signup":
        if rate_limited(self, "auth-signup", RATE_LIMIT_AUTH_MAX, RATE_LIMIT_WINDOW_SECONDS):
          return write_json(self, 429, {"error": "Terlalu banyak percobaan signup, coba lagi nanti"})
        if not body.get("email") or not body.get("password") or not body.get("name"):
          return write_json(self, 400, {"error": "Email, password, name wajib"})
        email = str(body.get("email")).strip().lower()
        if not valid_email(email):
          return write_json(self, 400, {"error": "Format email tidak valid"})
        if not valid_password(body.get("password")):
          return write_json(self, 400, {"error": "Password minimal 8 karakter dan kombinasi huruf-angka"})
        name = bounded_text(body.get("name"), 120)
        nik = bounded_text(body.get("nik", ""), 32)
        rw = bounded_text(body.get("rw", ""), 16)
        if conn.execute("SELECT id FROM users WHERE email = ?", (email,)).fetchone():
          return write_json(self, 400, {"error": "Email sudah terdaftar"})
        kel_name = bounded_text(body.get("kelurahan"), 120)
        kel = conn.execute(
          """
          SELECT kelurahan.id AS id, kecamatan.id AS kec_id
          FROM kelurahan JOIN kecamatan ON kecamatan.id = kelurahan.kecamatan_id
          WHERE kelurahan.name = ? LIMIT 1
          """,
          (kel_name,),
        ).fetchone()
        if not kel:
          return write_json(self, 400, {"error": "Kelurahan tidak ditemukan"})
        user_id = str(uuid.uuid4())
        now = utc_now_iso()
        execute(
          conn,
          """
          INSERT INTO users(
            id, name, email, password_hash, nik, rw, role_code, is_ksh, moderator_tier, email_verified,
            kelurahan_id, kecamatan_id, points, badges_json, created_at, updated_at
          )
          VALUES(?, ?, ?, ?, ?, ?, 'user', 0, NULL, 1, ?, ?, 0, '[]', ?, ?)
          """,
          (
            user_id,
            name,
            email,
            hash_password(body.get("password")),
            nik,
            rw,
            kel["id"],
            kel["kec_id"],
            now,
            now,
          ),
        )
        user = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
        token = create_session(conn, user_id)
        return write_json(self, 200, {"success": True, "token": token, "user": get_user_payload(conn, user)})

      if path == f"{API_PREFIX}/auth/login":
        if rate_limited(self, "auth-login", RATE_LIMIT_AUTH_MAX, RATE_LIMIT_WINDOW_SECONDS):
          return write_json(self, 429, {"error": "Terlalu banyak percobaan login, coba lagi nanti"})
        email = str(body.get("email", "")).strip().lower()
        if not valid_email(email):
          return write_json(self, 400, {"error": "Format email tidak valid"})
        password = str(body.get("password", ""))
        user = conn.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
        if not user or not verify_password(password, user["password_hash"]):
          return write_json(self, 401, {"error": "Email/password salah"})
        token = create_session(conn, user["id"])
        return write_json(self, 200, {"success": True, "token": token, "user": get_user_payload(conn, user)})

      if path == f"{API_PREFIX}/auth/admin-login":
        if rate_limited(self, "auth-admin-login", RATE_LIMIT_AUTH_MAX, RATE_LIMIT_WINDOW_SECONDS):
          return write_json(self, 429, {"error": "Terlalu banyak percobaan login admin, coba lagi nanti"})
        if not ADMIN_LOGIN_USERNAME or not ADMIN_LOGIN_PASSWORD:
          return write_json(self, 403, {"error": "Admin login tidak dikonfigurasi"})
        username = str(body.get("username", "")).strip()
        password = str(body.get("password", ""))
        expected_username = ADMIN_LOGIN_USERNAME
        expected_password = ADMIN_LOGIN_PASSWORD
        valid_user = hmac.compare_digest(username, expected_username)
        valid_pass = hmac.compare_digest(password, expected_password)
        if not valid_user or not valid_pass:
          return write_json(self, 401, {"error": "Invalid credentials"})
        admin = conn.execute("SELECT * FROM users WHERE role_code = 'admin' LIMIT 1").fetchone()
        if not admin:
          return write_json(self, 500, {"error": "Akun admin tidak ditemukan"})
        token = create_session(conn, admin["id"])
        return write_json(self, 200, {"success": True, "token": token, "user": get_user_payload(conn, admin)})

      if path == f"{API_PREFIX}/collaboration-requests":
        organization_name = bounded_text(body.get("organizationName", ""), 180)
        pic_name = bounded_text(body.get("picName", ""), 120)
        email = str(body.get("email", "")).strip().lower()
        support_type = str(body.get("supportType", "")).strip().lower()
        contribution_scope = str(body.get("contributionScope", "kota")).strip().lower()
        support_description = bounded_text(body.get("supportDescription", ""), 2000)
        if not organization_name or not pic_name or not email or not support_type or not support_description:
          return write_json(self, 400, {"error": "Semua field kolaborasi wajib diisi"})
        if support_type not in ("dana", "konsumsi", "peralatan", "media_partner", "lainnya"):
          return write_json(self, 400, {"error": "Jenis dukungan tidak valid"})
        if contribution_scope not in ("kota", "kecamatan", "kelurahan"):
          return write_json(self, 400, {"error": "Skala kontribusi tidak valid"})
        if not valid_email(email):
          return write_json(self, 400, {"error": "Format email tidak valid"})
        scope_kecamatan_id = None
        scope_kelurahan_id = None
        if contribution_scope in ("kecamatan", "kelurahan"):
          try:
            scope_kecamatan_id = int(body.get("kecamatanId"))
          except Exception:
            return write_json(self, 400, {"error": "Kecamatan wajib dipilih untuk skala ini"})
          kec = conn.execute("SELECT id FROM kecamatan WHERE id = ?", (scope_kecamatan_id,)).fetchone()
          if not kec:
            return write_json(self, 400, {"error": "Kecamatan tidak ditemukan"})
        if contribution_scope == "kelurahan":
          try:
            scope_kelurahan_id = int(body.get("kelurahanId"))
          except Exception:
            return write_json(self, 400, {"error": "Kelurahan wajib dipilih untuk skala kelurahan"})
          kel = conn.execute(
            "SELECT id FROM kelurahan WHERE id = ? AND kecamatan_id = ?",
            (scope_kelurahan_id, scope_kecamatan_id),
          ).fetchone()
          if not kel:
            return write_json(self, 400, {"error": "Kelurahan tidak sesuai kecamatan pilihan"})
        req_id = f"collab-{uuid.uuid4().hex[:10]}"
        now = utc_now_iso()
        execute(
          conn,
          """
          INSERT INTO collaboration_requests(
            id, organization_name, pic_name, email, support_type, contribution_scope,
            scope_kecamatan_id, scope_kelurahan_id, support_description,
            status, reviewed_by_user_id, reviewed_at, created_at, updated_at
          )
          VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', NULL, NULL, ?, ?)
          """,
          (
            req_id,
            organization_name,
            pic_name,
            email,
            support_type,
            contribution_scope,
            scope_kecamatan_id,
            scope_kelurahan_id,
            support_description,
            now,
            now,
          ),
        )
        return write_json(self, 200, {"success": True, "request": {"id": req_id}})

      if path == f"{API_PREFIX}/auth/logout":
        auth = self.headers.get("Authorization")
        if not auth or not auth.startswith("Bearer "):
          return write_json(self, 401, {"error": "Unauthorized"})
        token = auth.split(" ", 1)[1].strip()
        execute(conn, "DELETE FROM sessions WHERE token = ?", (token,))
        return write_json(self, 200, {"success": True})

      actor = user_from_token(conn, self.headers.get("Authorization"))
      if not actor:
        return write_json(self, 401, {"error": "Unauthorized"})

      if path.endswith("/approval") and path.startswith(f"{API_PREFIX}/collaboration-requests/"):
        if actor["role_code"] not in ("moderator_t2", "admin"):
          return write_json(self, 403, {"error": "Hanya Moderator Tier 2/Admin yang boleh approve"})
        req_id = path.split("/")[-2]
        row = conn.execute("SELECT id, status FROM collaboration_requests WHERE id = ?", (req_id,)).fetchone()
        if not row:
          return write_json(self, 404, {"error": "Permintaan tidak ditemukan"})
        if row["status"] != "pending":
          return write_json(self, 400, {"error": "Permintaan sudah diproses"})
        approved = bool(body.get("approved"))
        now = utc_now_iso()
        execute(
          conn,
          """
          UPDATE collaboration_requests
          SET status = ?, reviewed_by_user_id = ?, reviewed_at = ?, updated_at = ?
          WHERE id = ?
          """,
          ("approved" if approved else "rejected", actor["id"], now, now, req_id),
        )
        return write_json(self, 200, {"success": True})

      if path == f"{API_PREFIX}/events":
        if not can_create_event(actor):
          return write_json(self, 403, {"error": "Hanya ASN Tier 1/Admin yang boleh input kegiatan"})
        title = bounded_text(body.get("title", ""), 200)
        description = bounded_text(body.get("description", ""), 3000)
        time_text = bounded_text(body.get("time", ""), 16)
        location = bounded_text(body.get("location", ""), 220)
        date = str(body.get("date", "")).strip()
        scope_type = str(body.get("scopeType", "kelurahan")).strip().lower()
        if not title or not date:
          return write_json(self, 400, {"error": "Judul dan tanggal wajib diisi"})
        if scope_type not in ("kelurahan", "kecamatan"):
          return write_json(self, 400, {"error": "Skala kegiatan harus kelurahan atau kecamatan"})
        try:
          kecamatan_id = int(body.get("kecamatanId"))
        except Exception:
          return write_json(self, 400, {"error": "Kecamatan wajib dipilih"})
        kelurahan_id = None
        if scope_type == "kelurahan":
          try:
            kelurahan_id = int(body.get("kelurahanId"))
          except Exception:
            return write_json(self, 400, {"error": "Untuk skala kelurahan, kelurahan wajib dipilih"})
          check = conn.execute(
            "SELECT id FROM kelurahan WHERE id = ? AND kecamatan_id = ?",
            (kelurahan_id, kecamatan_id),
          ).fetchone()
          if not check:
            return write_json(self, 400, {"error": "Kelurahan tidak cocok dengan kecamatan pilihan"})
        else:
          kec_exists = conn.execute("SELECT id FROM kecamatan WHERE id = ?", (kecamatan_id,)).fetchone()
          if not kec_exists:
            return write_json(self, 400, {"error": "Kecamatan tidak ditemukan"})
        try:
          quota = int(body.get("quota", 0))
        except Exception:
          return write_json(self, 400, {"error": "Kuota harus angka"})
        if quota < 0 or quota > 10000:
          return write_json(self, 400, {"error": "Kuota harus 0-10000"})
        try:
          pillar = int(body.get("pillar", 1))
        except Exception:
          return write_json(self, 400, {"error": "Pilar harus angka"})
        if pillar not in (1, 2, 3, 4):
          return write_json(self, 400, {"error": "Pilar harus 1-4"})
        event_id = f"event-{uuid.uuid4().hex[:10]}"
        now = utc_now_iso()
        execute(
          conn,
          """
          INSERT INTO events(
            id, title, description, pillar, event_date, event_time, location, quota,
            scope_type, kecamatan_id, kelurahan_id, created_by_user_id, status, created_at, updated_at
          )
          VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?, ?)
          """,
          (
            event_id,
            title,
            description,
            pillar,
            date,
            time_text,
            location,
            quota,
            scope_type,
            kecamatan_id,
            kelurahan_id,
            actor["id"],
            now,
            now,
          ),
        )
        return write_json(self, 200, {"success": True, "event": {"id": event_id}})

      if path.endswith("/approval") and path.startswith(f"{API_PREFIX}/events/"):
        if not can_approve_event(actor):
          return write_json(self, 403, {"error": "Hanya Moderator Tier 2/Admin yang boleh approve"})
        event_id = path.split("/")[-2]
        event = conn.execute("SELECT * FROM events WHERE id = ?", (event_id,)).fetchone()
        if not event:
          return write_json(self, 404, {"error": "Event tidak ditemukan"})
        if actor["role_code"] == "moderator_t2":
          badge = (actor["tier2_badge"] or "").lower()
          if event["scope_type"] == "kelurahan":
            if badge != "lurah" or actor["kelurahan_id"] != event["kelurahan_id"]:
              return write_json(self, 403, {"error": "Draft skala kelurahan harus disetujui Lurah area terkait"})
          elif event["scope_type"] == "kecamatan":
            if badge != "camat" or actor["kecamatan_id"] != event["kecamatan_id"]:
              return write_json(self, 403, {"error": "Draft skala kecamatan harus disetujui Camat area terkait"})
        approved = bool(body.get("approved"))
        status = "published" if approved else "draft"
        execute(
          conn,
          "UPDATE events SET status = ?, published_at = ?, updated_at = ? WHERE id = ?",
          (status, utc_now_iso() if approved else None, utc_now_iso(), event_id),
        )
        return write_json(self, 200, {"success": True})

      if path.endswith("/join") and path.startswith(f"{API_PREFIX}/events/"):
        event_id = path.split("/")[-2]
        if actor["role_code"] not in ("user", "ksh"):
          return write_json(self, 403, {"error": "Hanya relawan/KSH yang dapat mendaftar"})
        pending = conn.execute(
          """
          SELECT COUNT(*) AS c
          FROM event_participation ep
          JOIN events e ON e.id = ep.event_id
          WHERE ep.user_id = ? AND ep.status = 'attended' AND ep.checklist_done = 0 AND e.status = 'completed'
          """,
          (actor["id"],),
        ).fetchone()["c"]
        if pending > 0:
          return write_json(self, 400, {"error": "Laporan event sebelumnya belum lengkap"})
        event = conn.execute("SELECT * FROM events WHERE id = ?", (event_id,)).fetchone()
        if not event or event["status"] != "published":
          return write_json(self, 400, {"error": "Event belum dipublish"})
        if int(event["quota"]) > 0:
          count = conn.execute("SELECT COUNT(*) AS c FROM event_participation WHERE event_id = ?", (event_id,)).fetchone()["c"]
          if count >= int(event["quota"]):
            return write_json(self, 400, {"error": "Kuota penuh"})
        execute(
          conn,
          """
          INSERT OR IGNORE INTO event_participation(event_id, user_id, status, checklist_done, created_at, updated_at)
          VALUES(?, ?, 'registered', 0, ?, ?)
          """,
          (event_id, actor["id"], utc_now_iso(), utc_now_iso()),
        )
        return write_json(self, 200, {"success": True})

      if path.endswith("/complete") and path.startswith(f"{API_PREFIX}/events/"):
        event_id = path.split("/")[-2]
        if not actor["is_ksh"]:
          return write_json(self, 403, {"error": "Hanya KSH yang bisa menandai selesai"})
        event = conn.execute("SELECT * FROM events WHERE id = ?", (event_id,)).fetchone()
        if not event:
          return write_json(self, 404, {"error": "Event tidak ditemukan"})
        if event["scope_type"] == "kelurahan" and event["kelurahan_id"] != actor["kelurahan_id"]:
          return write_json(self, 403, {"error": "Event di luar kelurahan KSH"})
        if event["scope_type"] == "kecamatan" and event["kecamatan_id"] != actor["kecamatan_id"]:
          return write_json(self, 403, {"error": "Event di luar kecamatan KSH"})
        if event["status"] != "published":
          return write_json(self, 400, {"error": "Event harus published sebelum completed"})
        summary = str(body.get("outputSummary", "")).strip()
        if not summary:
          return write_json(self, 400, {"error": "Output summary wajib diisi"})
        now = utc_now_iso()
        execute(
          conn,
          """
          UPDATE events
          SET status = 'completed', output_summary = ?, completed_at = ?, completed_by_user_id = ?, updated_at = ?
          WHERE id = ?
          """,
          (summary, now, actor["id"], now, event_id),
        )
        execute(conn, "UPDATE event_participation SET status = 'attended', updated_at = ? WHERE event_id = ?", (now, event_id))
        return write_json(self, 200, {"success": True})

      if path == f"{API_PREFIX}/reports":
        if actor["role_code"] not in ("user", "ksh"):
          return write_json(self, 403, {"error": "Hanya relawan/KSH yang dapat lapor"})
        event_id = body.get("eventId")
        if not event_id:
          return write_json(self, 400, {"error": "Event ID wajib diisi"})
        event = conn.execute("SELECT * FROM events WHERE id = ?", (event_id,)).fetchone()
        if not event or event["status"] != "completed":
          return write_json(self, 400, {"error": "Laporan hanya setelah event selesai"})
        part = conn.execute(
          "SELECT * FROM event_participation WHERE event_id = ? AND user_id = ?",
          (event_id, actor["id"]),
        ).fetchone()
        if not part:
          return write_json(self, 400, {"error": "Relawan belum terdaftar pada event ini"})
        try:
          participants = int(body.get("participants", 1))
        except Exception:
          return write_json(self, 400, {"error": "Jumlah peserta harus angka"})
        if participants < 1 or participants > 10000:
          return write_json(self, 400, {"error": "Jumlah peserta harus 1-10000"})
        outcome_tags = body.get("outcomeTags", [])
        if not isinstance(outcome_tags, list):
          return write_json(self, 400, {"error": "Outcome tags harus berbentuk array"})
        if len(outcome_tags) > 20:
          return write_json(self, 400, {"error": "Outcome tags maksimal 20 item"})
        safe_tags = [bounded_text(tag, 60) for tag in outcome_tags]
        photo_url = bounded_text(body.get("photoUrl", ""), 2_000_000)
        report_id = f"report-{uuid.uuid4().hex[:12]}"
        now = utc_now_iso()
        execute(
          conn,
          """
          INSERT INTO event_reports(
            id, event_id, user_id, participants, checklist_json, outcome_tags_json, photo_url,
            status, points_awarded, created_at, updated_at
          )
          VALUES(?, ?, ?, ?, ?, ?, ?, 'pending', 0, ?, ?)
          """,
          (
            report_id,
            event_id,
            actor["id"],
            participants,
            json.dumps({"attendance": True, "post_event": True}),
            json.dumps(safe_tags),
            photo_url,
            now,
            now,
          ),
        )
        execute(
          conn,
          "UPDATE event_participation SET status = 'reported', checklist_done = 1, updated_at = ? WHERE event_id = ? AND user_id = ?",
          (now, event_id, actor["id"]),
        )
        return write_json(self, 200, {"success": True, "report": {"id": report_id}})

      if path.endswith("/verify") and path.startswith(f"{API_PREFIX}/reports/"):
        if not can_verify_report(actor):
          return write_json(self, 403, {"error": "Hanya Moderator Tier 2/Admin yang boleh verifikasi"})
        report_id = path.split("/")[-2]
        report = conn.execute("SELECT * FROM event_reports WHERE id = ?", (report_id,)).fetchone()
        if not report:
          return write_json(self, 404, {"error": "Report tidak ditemukan"})
        if report["status"] != "pending":
          return write_json(self, 400, {"error": "Report sudah diproses"})
        approved = bool(body.get("approved"))
        now = utc_now_iso()
        if approved:
          event = conn.execute("SELECT * FROM events WHERE id = ?", (report["event_id"],)).fetchone()
          gained = apply_xp(conn, event, int(report["participants"]))
          execute(
            conn,
            "UPDATE event_reports SET status = 'verified', points_awarded = ?, verified_by_user_id = ?, verified_at = ?, updated_at = ? WHERE id = ?",
            (gained, actor["id"], now, now, report_id),
          )
          execute(conn, "UPDATE users SET points = points + 5, updated_at = ? WHERE id = ?", (now, report["user_id"]))
        else:
          execute(
            conn,
            "UPDATE event_reports SET status = 'rejected', verified_by_user_id = ?, verified_at = ?, updated_at = ? WHERE id = ?",
            (actor["id"], now, now, report_id),
          )
        return write_json(self, 200, {"success": True})

      if path == f"{API_PREFIX}/recommendations":
        return write_json(self, 410, {"error": "ASN recommendation is off-system"})

      if path == f"{API_PREFIX}/admin/assign-role":
        if actor["role_code"] != "admin":
          return write_json(self, 403, {"error": "Admin only"})
        badge = str(body.get("tier2Badge", "lurah")).lower()
        if badge not in ("lurah", "camat"):
          badge = "lurah"
        execute(
          conn,
          "UPDATE users SET role_code = 'moderator_t2', moderator_tier = 2, tier2_badge = ?, updated_at = ? WHERE id = ?",
          (badge, utc_now_iso(), body.get("userId")),
        )
        return write_json(self, 200, {"success": True})

      if path == f"{API_PREFIX}/admin/remove-role":
        if actor["role_code"] != "admin":
          return write_json(self, 403, {"error": "Admin only"})
        execute(
          conn,
          "UPDATE users SET role_code = 'user', moderator_tier = NULL, tier2_badge = NULL, updated_at = ? WHERE id = ?",
          (utc_now_iso(), body.get("userId")),
        )
        return write_json(self, 200, {"success": True})

      if path == f"{API_PREFIX}/admin/add-temporary-points":
        if actor["role_code"] != "admin":
          return write_json(self, 403, {"error": "Admin only"})
        points = int(body.get("points", 0))
        if points < -500 or points > 500:
          return write_json(self, 400, {"error": "Penyesuaian poin maksimal +/-500"})
        now = utc_now_iso()
        execute(conn, "UPDATE users SET points = points + ?, updated_at = ? WHERE id = ?", (points, now, body.get("userId")))
        execute(
          conn,
          """
          INSERT INTO temporary_adjustments(id, user_id, adjustment_type, value_json, reason, expires_at, created_at)
          VALUES(?, ?, 'points', ?, ?, ?, ?)
          """,
          (
            str(uuid.uuid4()),
            body.get("userId"),
            json.dumps({"points": points}),
            bounded_text(body.get("reason", "admin points"), 300),
            (datetime.now(timezone.utc) + timedelta(hours=24)).isoformat(),
            now,
          ),
        )
        return write_json(self, 200, {"success": True})

      if path == f"{API_PREFIX}/admin/add-temporary-badge":
        if actor["role_code"] != "admin":
          return write_json(self, 403, {"error": "Admin only"})
        target_id = body.get("userId")
        badge_id = body.get("badgeId")
        user = conn.execute("SELECT badges_json FROM users WHERE id = ?", (target_id,)).fetchone()
        badges = json.loads(user["badges_json"] or "[]")
        badges.append({"id": badge_id, "temporary": True})
        now = utc_now_iso()
        execute(conn, "UPDATE users SET badges_json = ?, updated_at = ? WHERE id = ?", (json.dumps(badges), now, target_id))
        execute(
          conn,
          """
          INSERT INTO temporary_adjustments(id, user_id, adjustment_type, value_json, reason, expires_at, created_at)
          VALUES(?, ?, 'badge', ?, ?, ?, ?)
          """,
          (
            str(uuid.uuid4()),
            target_id,
            json.dumps({"badgeId": badge_id}),
            bounded_text(body.get("reason", "admin badge"), 300),
            (datetime.now(timezone.utc) + timedelta(hours=24)).isoformat(),
            now,
          ),
        )
        return write_json(self, 200, {"success": True})

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
      actor = user_from_token(conn, self.headers.get("Authorization"))
      if not actor:
        return write_json(self, 401, {"error": "Unauthorized"})
      # DELETE /auth/logout alias
      if path == f"{API_PREFIX}/auth/logout":
        auth = self.headers.get("Authorization")
        token_val = auth.split(" ", 1)[1].strip()
        execute(conn, "DELETE FROM sessions WHERE token = ?", (token_val,))
        return write_json(self, 200, {"success": True})
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
      if path.startswith(f"{API_PREFIX}/users/"):
        actor = user_from_token(conn, self.headers.get("Authorization"))
        if not actor:
          return write_json(self, 401, {"error": "Unauthorized"})
        user_id = path.split("/")[-1]
        body = parse_json_body(self)
        if actor["id"] != user_id and actor["role_code"] != "admin":
          return write_json(self, 403, {"error": "Forbidden"})
        fields = []
        params = []
        for key in ("name", "rw", "nik"):
          if key in body and body[key] is not None:
            fields.append(f"{key} = ?")
            max_len = 120 if key == "name" else (16 if key == "rw" else 32)
            params.append(bounded_text(body[key], max_len))
        if not fields:
          return write_json(self, 400, {"error": "No fields"})
        fields.append("updated_at = ?")
        params.append(utc_now_iso())
        params.append(user_id)
        execute(conn, f"UPDATE users SET {', '.join(fields)} WHERE id = ?", tuple(params))
        row = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
        return write_json(self, 200, {"success": True, "user": get_user_payload(conn, row)})
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
  init_schema()
  write_dev_credentials_file()
  print(f"Local SIMREKAP API: http://127.0.0.1:8001{API_PREFIX}")
  print(f"DB: {DB_PATH}")
  server = ThreadingHTTPServer(("127.0.0.1", 8001), Handler)
  server.serve_forever()


if __name__ == "__main__":
  main()
