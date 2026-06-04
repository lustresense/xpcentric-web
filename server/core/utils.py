"""
SIMRP Core Utilities
Shared helpers extracted from server/main.py with identical behavior.
"""
import os
import re
from datetime import datetime, timezone


EMAIL_PATTERN = re.compile(r"^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$")
INDONESIA_PHONE_PATTERN = re.compile(r"^\+62\d{8,13}$")


def env_flag(name, default=False):
  raw = os.environ.get(name)
  if raw is None:
    return default
  value = str(raw).strip().lower()
  return value in ("1", "true", "yes", "on", "y")


def utc_now_iso():
  return datetime.now(timezone.utc).isoformat()


def valid_email(email):
  return bool(EMAIL_PATTERN.match(str(email or "").strip()))


def normalize_phone_number(value):
  text = str(value or "").strip()
  if not text:
    return ""
  text = re.sub(r"[\s().-]+", "", text)
  if text.startswith("00"):
    text = "+" + text[2:]
  if text.startswith("0"):
    text = "+62" + text[1:]
  elif text.startswith("62"):
    text = "+" + text
  return text


def valid_phone_number(value):
  return bool(INDONESIA_PHONE_PATTERN.match(normalize_phone_number(value)))


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


def parse_pagination(query, default_limit=100, max_limit=500):
  query = query or {}
  raw_limit = query.get("limit", [default_limit])[0]
  raw_offset = query.get("offset", [0])[0]
  try:
    limit = int(raw_limit)
    offset = int(raw_offset)
  except (TypeError, ValueError):
    raise ValueError("limit dan offset harus berupa angka")
  if limit < 1:
    raise ValueError("limit minimal 1")
  if offset < 0:
    raise ValueError("offset minimal 0")
  return min(limit, max_limit), offset


def pagination_payload(total, limit, offset):
  total = max(0, int(total or 0))
  limit = max(1, int(limit or 1))
  offset = max(0, int(offset or 0))
  return {
    "limit": limit,
    "offset": offset,
    "total": total,
    "hasMore": offset + limit < total,
  }
