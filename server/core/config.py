"""
SIMREKAP Core Configuration
Centralized configuration for the application.
"""
import os
from pathlib import Path

# Paths
ROOT_DIR = Path(__file__).resolve().parents[2]
DB_DIR = ROOT_DIR / "database" / "runtime"
DB_PATH = Path(os.environ.get("SIMRP_DB_PATH", str(DB_DIR / "database.db")))
GEO_PATH = ROOT_DIR / "src" / "data" / "geographicData.ts"

# Application
APP_ENV = str(os.environ.get("SIMRP_ENV", "development")).strip().lower()
IS_PRODUCTION = APP_ENV in ("prod", "production")
API_PREFIX = "/make-server-32aa5c5c"
HOST = os.environ.get("SIMRP_HOST", "127.0.0.1")
PORT = int(os.environ.get("SIMRP_PORT", "8000"))

# Security
PBKDF2_ITERATIONS = int(os.environ.get("SIMRP_PBKDF2_ITERATIONS", "210000" if not IS_PRODUCTION else "600000"))
SESSION_TTL_HOURS = int(os.environ.get("SIMRP_SESSION_TTL_HOURS", "24" if IS_PRODUCTION else "168"))
MAX_BODY_BYTES = int(os.environ.get("SIMRP_MAX_BODY_BYTES", str(8 * 1024 * 1024)))

# Rate Limiting
RATE_LIMIT_WINDOW_SECONDS = int(os.environ.get("SIMRP_RATE_LIMIT_WINDOW_SECONDS", "60"))
RATE_LIMIT_AUTH_MAX = int(os.environ.get("SIMRP_RATE_LIMIT_AUTH_MAX", "10"))
RATE_LIMIT_MUTATION_MAX = int(os.environ.get("SIMRP_RATE_LIMIT_MUTATION_MAX", "120"))
TRUST_PROXY_HEADERS = str(os.environ.get("SIMRP_TRUST_PROXY_HEADERS", "")).strip().lower() in {"1", "true", "yes", "on"}

# CORS
DEV_ALLOWED_ORIGINS = {"http://localhost:5173", "http://127.0.0.1:5173"}
raw_allowed_origins = str(os.environ.get("SIMRP_ALLOWED_ORIGINS", "")).strip()
ALLOWED_ORIGINS = {item.strip() for item in raw_allowed_origins.split(",") if item.strip()}

# Admin
ADMIN_LOGIN_USERNAME = str(os.environ.get("SIMRP_ADMIN_LOGIN_USERNAME", "")).strip()
ADMIN_LOGIN_PASSWORD = str(os.environ.get("SIMRP_ADMIN_LOGIN_PASSWORD", "")).strip()
SEED_ADMIN_PASSWORD = str(os.environ.get("SIMRP_SEED_ADMIN_PASSWORD", "")).strip()

# Validation
EMAIL_PATTERN = r"^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$"

# Database
DB_TIMEOUT_SECONDS = 30
DB_PRAGMA_JOURNAL_MODE = "WAL" if IS_PRODUCTION else "MEMORY"
DB_PRAGMA_SYNCHRONOUS = "NORMAL"
DB_PRAGMA_TEMP_STORE = "MEMORY"
DB_PRAGMA_FOREIGN_KEYS = "ON"

# Field Limits
MAX_NAME_LENGTH = 120
MAX_EMAIL_LENGTH = 255
MAX_TEXT_LENGTH = 3000
MAX_DESCRIPTION_LENGTH = 2000
MAX_REASON_LENGTH = 300
MAX_OUTCOME_TAG_LENGTH = 60
MAX_OUTCOME_TAGS_COUNT = 20
MAX_PHOTO_URL_LENGTH = 2_000_000

# Quota Limits
MIN_EVENT_QUOTA = 0
MAX_EVENT_QUOTA = 10000
MIN_PARTICIPANTS = 1
MAX_PARTICIPANTS = 10000

# Points Adjustment
MIN_TEMP_POINTS = -500
MAX_TEMP_POINTS = 500

# Valid Values
VALID_PILLARS = {1, 2, 3, 4}
VALID_ROLE_CODES = {"user", "ksh", "moderator_t1", "moderator_t2", "moderator_t3", "admin"}
VALID_SCOPE_TYPES = {"kelurahan", "kecamatan"}
VALID_EVENT_STATUSES = {"draft", "approved", "published", "completed"}
VALID_REPORT_STATUSES = {"pending", "under_review", "verified", "rejected"}
VALID_PARTICIPATION_STATUSES = {"registered", "attended", "reported"}
VALID_SUPPORT_TYPES = {"dana", "konsumsi", "peralatan", "media_partner", "lainnya"}
VALID_CONTRIBUTION_SCOPES = {"kota", "kecamatan", "kelurahan"}
VALID_ADJUSTMENT_TYPES = {"points", "badge", "role"}
VALID_TIER2_BADGES = {"lurah", "camat"}
