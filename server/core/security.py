"""
SIMREKAP Security Utilities
Password hashing, verification, and token generation.
"""
import os
import hmac
import secrets
from hashlib import pbkdf2_hmac
from datetime import datetime, timezone
from server.core.config import PBKDF2_ITERATIONS


def utc_now_iso():
    """Get current UTC time in ISO format."""
    return datetime.now(timezone.utc).isoformat()


def hash_password(password):
    """Hash a password using PBKDF2-HMAC-SHA256."""
    salt = os.urandom(16)
    digest = pbkdf2_hmac("sha256", password.encode("utf-8"), salt, PBKDF2_ITERATIONS)
    return f"{salt.hex()}:{digest.hex()}"


def verify_password(password, encoded_hash):
    """Verify a password against a stored hash."""
    try:
        salt_hex, digest_hex = encoded_hash.split(":", 1)
        salt = bytes.fromhex(salt_hex)
        expected = bytes.fromhex(digest_hex)
    except Exception:
        return False
    got = pbkdf2_hmac("sha256", password.encode("utf-8"), salt, PBKDF2_ITERATIONS)
    return hmac.compare_digest(got, expected)


def generate_token():
    """Generate a secure session token."""
    return secrets.token_urlsafe(48)


def generate_entity_id(prefix="entity"):
    """Generate a unique entity ID with prefix."""
    return f"{prefix}-{secrets.token_hex(8)}"


def secure_compare(a, b):
    """Constant-time string comparison."""
    return hmac.compare_digest(a.encode("utf-8"), b.encode("utf-8"))
