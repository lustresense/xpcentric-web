"""SQLite base schema creation for SIMRP."""


TABLE_SCHEMAS = [
  """
  CREATE TABLE IF NOT EXISTS roles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL
  )
  """,
  """
  CREATE TABLE IF NOT EXISTS role_attributes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    role_id INTEGER NOT NULL,
    attribute_key TEXT NOT NULL,
    attribute_value TEXT NOT NULL,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
  )
  """,
  """
  CREATE TABLE IF NOT EXISTS kecamatan (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL UNIQUE
  )
  """,
  """
  CREATE TABLE IF NOT EXISTS kelurahan (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL UNIQUE,
    kecamatan_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    FOREIGN KEY (kecamatan_id) REFERENCES kecamatan(id) ON DELETE CASCADE
  )
  """,
  """
  CREATE TABLE IF NOT EXISTS postal_codes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL UNIQUE
  )
  """,
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
    phone_number TEXT,
    phone_verified INTEGER NOT NULL DEFAULT 0,
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
  """
  CREATE TABLE IF NOT EXISTS otp_challenges (
    id TEXT PRIMARY KEY,
    phone_number TEXT NOT NULL,
    purpose TEXT NOT NULL CHECK(purpose IN ('signup','login','account_recovery')),
    otp_hash TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    consumed_at TEXT,
    attempts INTEGER NOT NULL DEFAULT 0,
    max_attempts INTEGER NOT NULL DEFAULT 5,
    created_at TEXT NOT NULL
  )
  """,
  """
  CREATE TABLE IF NOT EXISTS access_requests (
    id TEXT PRIMARY KEY,
    requester_user_id TEXT NOT NULL,
    requester_email TEXT NOT NULL,
    requester_name TEXT NOT NULL,
    current_role TEXT NOT NULL,
    requested_role TEXT NOT NULL CHECK(requested_role IN ('ksh','moderator_t1','moderator_t2')),
    requested_scope_type TEXT NOT NULL CHECK(requested_scope_type IN ('none','kelurahan','kecamatan')),
    requested_kelurahan_id INTEGER,
    requested_kecamatan_id INTEGER,
    position_or_title TEXT NOT NULL,
    reason TEXT NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('pending','approved','rejected')),
    reviewed_by_user_id TEXT,
    review_note TEXT,
    created_at TEXT NOT NULL,
    reviewed_at TEXT,
    FOREIGN KEY (requester_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewed_by_user_id) REFERENCES users(id),
    FOREIGN KEY (requested_kelurahan_id) REFERENCES kelurahan(id),
    FOREIGN KEY (requested_kecamatan_id) REFERENCES kecamatan(id)
  )
  """,
  """
  CREATE INDEX IF NOT EXISTS idx_access_requests_requester_status
  ON access_requests(requester_user_id, status)
  """,
  """
  CREATE INDEX IF NOT EXISTS idx_access_requests_status_created
  ON access_requests(status, created_at)
  """,
  """
  CREATE UNIQUE INDEX IF NOT EXISTS idx_access_requests_pending_role
  ON access_requests(requester_user_id, requested_role)
  WHERE status = 'pending'
  """,
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
  """
  CREATE TABLE IF NOT EXISTS event_reports (
    id TEXT PRIMARY KEY,
    event_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    participants INTEGER NOT NULL,
    checklist_json TEXT NOT NULL,
    outcome_tags_json TEXT NOT NULL,
    photo_url TEXT,
    status TEXT NOT NULL CHECK(status IN ('pending','under_review','verified','rejected')),
    points_awarded INTEGER NOT NULL DEFAULT 0,
    verified_by_user_id TEXT,
    verified_at TEXT,
    reject_reason TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )
  """,
  """
  CREATE TABLE IF NOT EXISTS xp_kelurahan (
    kelurahan_id INTEGER PRIMARY KEY,
    total_xp INTEGER NOT NULL DEFAULT 0,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (kelurahan_id) REFERENCES kelurahan(id) ON DELETE CASCADE
  )
  """,
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
    submitted_by_user_id TEXT,
    status TEXT NOT NULL CHECK(status IN ('pending','approved','rejected')),
    reviewed_by_user_id TEXT,
    reviewed_at TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (submitted_by_user_id) REFERENCES users(id),
    FOREIGN KEY (reviewed_by_user_id) REFERENCES users(id),
    FOREIGN KEY (scope_kecamatan_id) REFERENCES kecamatan(id),
    FOREIGN KEY (scope_kelurahan_id) REFERENCES kelurahan(id)
  )
  """,
  """
  CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read INTEGER NOT NULL DEFAULT 0,
    entity_type TEXT,
    entity_id TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )
  """,
  """
  CREATE TABLE IF NOT EXISTS certificates (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    event_id TEXT NOT NULL,
    report_id TEXT NOT NULL,
    certificate_hash TEXT NOT NULL,
    issued_at TEXT NOT NULL,
    UNIQUE(user_id, event_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (event_id) REFERENCES events(id),
    FOREIGN KEY (report_id) REFERENCES event_reports(id)
  )
  """,
  """
  CREATE TABLE IF NOT EXISTS voucher_catalog (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    xp_cost INTEGER NOT NULL,
    stock INTEGER NOT NULL DEFAULT 0,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL
  )
  """,
  """
  CREATE TABLE IF NOT EXISTS voucher_redemptions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    voucher_id TEXT NOT NULL,
    xp_spent INTEGER NOT NULL,
    voucher_code TEXT NOT NULL,
    redeemed_at TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (voucher_id) REFERENCES voucher_catalog(id)
  )
  """,
  """
  CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )
  """,
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
]


def create_schema_tables(conn):
  for statement in TABLE_SCHEMAS:
    conn.execute(statement)
