"""Seed helpers for SIMRP SQLite data."""

import os
import uuid


def seed_roles(conn, execute):
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


def seed_geography(conn, execute, parse_geo_data, utc_now_iso):
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


def insert_user(
  conn,
  execute,
  hash_password,
  utc_now_iso,
  name,
  email,
  password,
  role_code,
  *,
  is_ksh=0,
  tier=None,
  tier2_badge=None,
  kelurahan_name=None,
  sync_existing=False,
):
  existing = conn.execute("SELECT id FROM users WHERE email = ?", (email,)).fetchone()
  if existing and not sync_existing:
    return existing["id"]
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
  now = utc_now_iso()
  if existing:
    execute(
      conn,
      """
      UPDATE users
      SET name = ?, password_hash = ?, role_code = ?, is_ksh = ?, moderator_tier = ?, tier2_badge = ?,
          kelurahan_id = ?, kecamatan_id = ?, updated_at = ?
      WHERE id = ?
      """,
      (
        name,
        hash_password(password),
        role_code,
        1 if is_ksh else 0,
        tier,
        tier2_badge,
        kel["id"] if kel else None,
        kel["kec_id"] if kel else None,
        now,
        existing["id"],
      ),
    )
    return existing["id"]

  user_id = str(uuid.uuid4())
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
  return user_id


def seed_admin_account(
  conn,
  execute,
  hash_password,
  utc_now_iso,
  admin_login_password,
  is_production,
  generate_runtime_secret,
  record_dev_credential,
):
  if conn.execute("SELECT id FROM users WHERE role_code = 'admin' LIMIT 1").fetchone():
    return
  admin_seed_password = str(os.environ.get("SIMRP_SEED_ADMIN_PASSWORD", "")).strip()
  if not admin_seed_password:
    admin_seed_password = admin_login_password
  if not admin_seed_password:
    if is_production:
      return
    admin_seed_password = generate_runtime_secret()
  if not os.environ.get("SIMRP_SEED_ADMIN_PASSWORD", "").strip() and not is_production:
    record_dev_credential("Seed admin account", "email=admin@simrp.local", "SIMRP_SEED_ADMIN_PASSWORD", admin_seed_password)
  insert_user(
    conn,
    execute,
    hash_password,
    utc_now_iso,
    "Administrator",
    "admin@simrp.local",
    admin_seed_password,
    "admin",
    kelurahan_name="Keputih",
    sync_existing=True,
  )


def seed_demo(conn, execute, hash_password, utc_now_iso, demo_password):
  insert_user(conn, execute, hash_password, utc_now_iso, "Andi Relawan", "relawan.demo@simrp.app", demo_password, "user", kelurahan_name="Bulak", sync_existing=True)
  insert_user(conn, execute, hash_password, utc_now_iso, "Nia Relawan", "relawan2.demo@simrp.app", demo_password, "user", kelurahan_name="Keputih", sync_existing=True)
  insert_user(conn, execute, hash_password, utc_now_iso, "Budi Relawan", "relawan3.demo@simrp.app", demo_password, "user", kelurahan_name="Wonorejo", sync_existing=True)
  insert_user(conn, execute, hash_password, utc_now_iso, "Kak Esa", "ksh.demo@simrp.app", demo_password, "ksh", is_ksh=1, kelurahan_name="Keputih", sync_existing=True)
  insert_user(conn, execute, hash_password, utc_now_iso, "Pak Raka ASN", "moderator1.demo@simrp.app", demo_password, "moderator_t1", tier=1, kelurahan_name="Keputih", sync_existing=True)
  insert_user(conn, execute, hash_password, utc_now_iso, "Bu Sinta Lurah", "moderator2.demo@simrp.app", demo_password, "moderator_t2", tier=2, tier2_badge="lurah", kelurahan_name="Keputih", sync_existing=True)
  insert_user(conn, execute, hash_password, utc_now_iso, "Pak Dimas Camat", "moderator2.camat@simrp.app", demo_password, "moderator_t2", tier=2, tier2_badge="camat", kelurahan_name="Keputih", sync_existing=True)
  insert_user(conn, execute, hash_password, utc_now_iso, "Pak Arif", "moderator3.demo@simrp.app", demo_password, "moderator_t3", tier=3, kelurahan_name="Keputih", sync_existing=True)
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

  vouchers = [
    (
      "voucher-10000",
      "Voucher GoBis Rp 10.000",
      "Voucher transportasi untuk ditukarkan di aplikasi GoBis sebagai akses tiket Suroboyo Bus dan layanan terkait.",
      100,
      50,
      1,
    ),
    (
      "voucher-25000",
      "Voucher GoBis Rp 25.000",
      "Voucher transportasi untuk ditukarkan di aplikasi GoBis sebagai akses tiket Suroboyo Bus dan layanan terkait.",
      200,
      20,
      1,
    ),
  ]
  for voucher in vouchers:
    execute(
      conn,
      """
      INSERT OR IGNORE INTO voucher_catalog(id, name, description, xp_cost, stock, is_active, created_at)
      VALUES(?, ?, ?, ?, ?, ?, ?)
      """,
      (voucher[0], voucher[1], voucher[2], voucher[3], voucher[4], voucher[5], utc_now_iso()),
    )
