"""Runtime service logic extracted from server/main.py."""

import hmac
import json
import os
import re
import secrets
from datetime import datetime, timedelta, timezone
from hashlib import pbkdf2_hmac


def generate_runtime_secret():
  return secrets.token_urlsafe(24)


def record_dev_credential(notes, label, identifier, env_name, secret, is_production):
  if is_production:
    return
  notes.append({
    "label": label,
    "identifier": identifier,
    "env_name": env_name,
    "secret": secret,
  })


def write_dev_credentials_file(path, notes, is_production):
  if is_production or not notes:
    return
  lines = [
    "SIMRP local development credentials",
    "Generated because one or more demo credential environment variables were not set.",
    "This file is under database/runtime/ and must stay ignored by Git.",
    "",
  ]
  for item in notes:
    lines.extend([
      f"[{item['label']}]",
      item["identifier"],
      f"{item['env_name']}={item['secret']}",
      "",
    ])
  path.parent.mkdir(parents=True, exist_ok=True)
  path.write_text("\n".join(lines), encoding="utf-8")
  print(f"[SECURITY] Local development credentials file: {path}")


def hash_password(password, iterations):
  salt = os.urandom(16)
  digest = pbkdf2_hmac("sha256", password.encode("utf-8"), salt, iterations)
  return f"{salt.hex()}:{digest.hex()}"


def verify_password(password, encoded, iterations):
  try:
    salt_hex, digest_hex = encoded.split(":", 1)
    salt = bytes.fromhex(salt_hex)
    expected = bytes.fromhex(digest_hex)
  except Exception:
    return False
  got = pbkdf2_hmac("sha256", password.encode("utf-8"), salt, iterations)
  return hmac.compare_digest(got, expected)


def create_session(conn, execute, utc_now_iso, session_ttl_hours, user_id):
  token = secrets.token_urlsafe(48)
  now = utc_now_iso()
  expires = (datetime.now(timezone.utc) + timedelta(hours=session_ttl_hours)).isoformat()
  execute(
    conn,
    "INSERT INTO sessions(token, user_id, expires_at, created_at) VALUES(?, ?, ?, ?)",
    (token, user_id, expires, now),
  )
  return token


def user_from_token(conn, auth_header, utc_now_iso):
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


def log_audit(conn, execute, bounded_text, utc_now_iso, actor_id, action, entity_type, entity_id, payload=None):
  safe_payload = payload if isinstance(payload, dict) else {"value": payload}
  execute(
    conn,
    """
    INSERT INTO audit_logs(actor_user_id, action, entity_type, entity_id, payload_json, created_at)
    VALUES(?, ?, ?, ?, ?, ?)
    """,
    (
      actor_id,
      bounded_text(action, 120),
      bounded_text(entity_type, 120),
      str(entity_id) if entity_id is not None else None,
      json.dumps(safe_payload or {}, ensure_ascii=True),
      utc_now_iso(),
    ),
  )


def create_notification(conn, execute, bounded_text, utc_now_iso, user_id, notif_type, title, message, entity_type=None, entity_id=None):
  if not user_id:
    return None
  cur = execute(
    conn,
    """
    INSERT INTO notifications(user_id, type, title, message, is_read, entity_type, entity_id, created_at)
    VALUES(?, ?, ?, ?, 0, ?, ?, ?)
    """,
    (
      user_id,
      bounded_text(notif_type, 80),
      bounded_text(title, 180),
      bounded_text(message, 2000),
      bounded_text(entity_type, 120) if entity_type else None,
      str(entity_id) if entity_id is not None else None,
      utc_now_iso(),
    ),
  )
  return int(cur.lastrowid)


def parse_geo_data(geo_path):
  content = geo_path.read_text(encoding="utf-8")
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


def get_geo_stats(geo_path):
  parsed = parse_geo_data(geo_path)
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


def cleanup_adjustments(conn, execute, utc_now_iso):
  now = utc_now_iso()
  rows = conn.execute("SELECT * FROM temporary_adjustments WHERE expires_at <= ?", (now,)).fetchall()
  for row in rows:
    if row["adjustment_type"] == "points":
      value = json.loads(row["value_json"])
      execute(conn, "UPDATE users SET points = MAX(points - ?, 0) WHERE id = ?", (int(value.get("points", 0)), row["user_id"]))
    if row["adjustment_type"] == "badge":
      value = json.loads(row["value_json"])
      user = conn.execute("SELECT badges_json FROM users WHERE id = ?", (row["user_id"],)).fetchone()
      badges = json.loads(user["badges_json"] or "[]")
      badge_id = value.get("badgeId")
      badges = [item for item in badges if item.get("id") != badge_id]
      execute(conn, "UPDATE users SET badges_json = ? WHERE id = ?", (json.dumps(badges), row["user_id"]))
  execute(conn, "DELETE FROM temporary_adjustments WHERE expires_at <= ?", (now,))


def apply_xp(conn, execute, utc_now_iso, event_row, participants):
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
