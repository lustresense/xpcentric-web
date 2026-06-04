"""SQLite migrations for SIMRP."""


def migrate_schema(conn, execute):
  user_cols = {row["name"] for row in conn.execute("PRAGMA table_info(users)").fetchall()}
  if "tier2_badge" not in user_cols:
    execute(conn, "ALTER TABLE users ADD COLUMN tier2_badge TEXT")
  if "phone_number" not in user_cols:
    execute(conn, "ALTER TABLE users ADD COLUMN phone_number TEXT")
  if "phone_verified" not in user_cols:
    execute(conn, "ALTER TABLE users ADD COLUMN phone_verified INTEGER NOT NULL DEFAULT 0")

  execute(
    conn,
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
  )

  execute(
    conn,
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
  )
  execute(
    conn,
    """
    CREATE INDEX IF NOT EXISTS idx_access_requests_requester_status
    ON access_requests(requester_user_id, status)
    """,
  )
  execute(
    conn,
    """
    CREATE INDEX IF NOT EXISTS idx_access_requests_status_created
    ON access_requests(status, created_at)
    """,
  )
  execute(
    conn,
    """
    CREATE UNIQUE INDEX IF NOT EXISTS idx_access_requests_pending_role
    ON access_requests(requester_user_id, requested_role)
    WHERE status = 'pending'
    """,
  )

  collab_cols = {row["name"] for row in conn.execute("PRAGMA table_info(collaboration_requests)").fetchall()}
  if "contribution_scope" not in collab_cols:
    execute(conn, "ALTER TABLE collaboration_requests ADD COLUMN contribution_scope TEXT NOT NULL DEFAULT 'kota'")
  if "scope_kecamatan_id" not in collab_cols:
    execute(conn, "ALTER TABLE collaboration_requests ADD COLUMN scope_kecamatan_id INTEGER")
  if "scope_kelurahan_id" not in collab_cols:
    execute(conn, "ALTER TABLE collaboration_requests ADD COLUMN scope_kelurahan_id INTEGER")
  if "submitted_by_user_id" not in collab_cols:
    execute(conn, "ALTER TABLE collaboration_requests ADD COLUMN submitted_by_user_id TEXT")

  report_cols = {row["name"] for row in conn.execute("PRAGMA table_info(event_reports)").fetchall()}
  if "reject_reason" not in report_cols:
    execute(conn, "ALTER TABLE event_reports ADD COLUMN reject_reason TEXT")

  report_constraint_ok = False
  try:
    schema_row = conn.execute(
      "SELECT sql FROM sqlite_master WHERE type='table' AND name='event_reports'"
    ).fetchone()
    if schema_row and "under_review" in (schema_row["sql"] or ""):
      report_constraint_ok = True
  except Exception:
    pass

  if not report_constraint_ok:
    conn.commit()
    conn.execute("PRAGMA foreign_keys = OFF")
    conn.execute("BEGIN TRANSACTION")
    try:
      conn.execute("ALTER TABLE event_reports RENAME TO event_reports_legacy")
      conn.execute(
        """
        CREATE TABLE event_reports (
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
        """
      )
      legacy_report_cols = {row["name"] for row in conn.execute("PRAGMA table_info(event_reports_legacy)").fetchall()}
      reject_reason_expr = "reject_reason" if "reject_reason" in legacy_report_cols else "NULL"
      conn.execute(
        f"""
        INSERT INTO event_reports(
          id, event_id, user_id, participants, checklist_json, outcome_tags_json,
          photo_url, status, points_awarded, verified_by_user_id, verified_at,
          reject_reason, created_at, updated_at
        )
        SELECT
          id, event_id, user_id, participants, checklist_json, outcome_tags_json,
          photo_url, status, points_awarded, verified_by_user_id, verified_at,
          {reject_reason_expr}, created_at, updated_at
        FROM event_reports_legacy
        """
      )
      conn.execute("DROP TABLE event_reports_legacy")

      fk_violations = conn.execute("PRAGMA foreign_key_check(event_reports)").fetchall()
      if fk_violations:
        raise ValueError(f"Foreign key constraint failed after migration: {fk_violations}")

      conn.commit()
    except Exception:
      conn.rollback()
      raise
    finally:
      conn.execute("PRAGMA foreign_keys = ON")

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
