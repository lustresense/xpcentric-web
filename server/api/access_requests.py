"""
SIMREKAP Access Request Module.

Handles the officer access portal backend. Public registration remains a
regular relawan signup; KSH/moderator roles only become active after admin
review of stored access request data.
"""
import sqlite3
import uuid


REQUESTABLE_ROLES = {"ksh", "moderator_t1", "moderator_t2"}
REQUESTABLE_SCOPES = {"none", "kelurahan", "kecamatan"}
REVIEW_STATUSES = {"pending", "approved", "rejected", "all"}


def _json(deps, handler, status, payload):
  deps["write_json"](handler, status, payload)
  return True


def _auth_header(handler):
  return handler.headers.get("Authorization")


def _actor(conn, handler, deps):
  return deps["user_from_token"](conn, _auth_header(handler))


def _body_value(body, *keys, default=None):
  for key in keys:
    if key in body:
      return body.get(key)
  return default


def _parse_int(value, label):
  try:
    parsed = int(value)
  except (TypeError, ValueError):
    raise ValueError(f"{label} tidak valid")
  if parsed <= 0:
    raise ValueError(f"{label} tidak valid")
  return parsed


def _request_payload(row):
  return {
    "id": row["id"],
    "requesterUserId": row["requester_user_id"],
    "requesterEmail": row["requester_email"],
    "requesterName": row["requester_name"],
    "currentRole": row["current_role"],
    "requestedRole": row["requested_role"],
    "requestedScopeType": row["requested_scope_type"],
    "requestedKelurahanId": row["requested_kelurahan_id"],
    "requestedKecamatanId": row["requested_kecamatan_id"],
    "requestedKelurahan": row["requested_kelurahan"] if "requested_kelurahan" in row.keys() else None,
    "requestedKecamatan": row["requested_kecamatan"] if "requested_kecamatan" in row.keys() else None,
    "positionOrTitle": row["position_or_title"],
    "reason": row["reason"],
    "status": row["status"],
    "reviewedByUserId": row["reviewed_by_user_id"],
    "reviewerName": row["reviewer_name"] if "reviewer_name" in row.keys() else None,
    "reviewNote": row["review_note"],
    "createdAt": row["created_at"],
    "reviewedAt": row["reviewed_at"],
  }


def _select_requests_sql():
  return """
    SELECT
      access_requests.*,
      kelurahan.name AS requested_kelurahan,
      kecamatan.name AS requested_kecamatan,
      reviewer.name AS reviewer_name
    FROM access_requests
    LEFT JOIN kelurahan ON kelurahan.id = access_requests.requested_kelurahan_id
    LEFT JOIN kecamatan ON kecamatan.id = access_requests.requested_kecamatan_id
    LEFT JOIN users AS reviewer ON reviewer.id = access_requests.reviewed_by_user_id
  """


def _resolve_scope(conn, requested_role, requested_scope_type, kelurahan_value, kecamatan_value):
  scope_type = str(requested_scope_type or "").strip().lower()
  if not scope_type:
    if kelurahan_value:
      scope_type = "kelurahan"
    elif kecamatan_value:
      scope_type = "kecamatan"
    else:
      scope_type = "none"

  if scope_type not in REQUESTABLE_SCOPES:
    raise ValueError("Scope pengajuan tidak valid")

  if requested_role == "ksh":
    scope_type = "kelurahan"
  elif requested_role in ("moderator_t1", "moderator_t2") and scope_type not in ("kelurahan", "kecamatan"):
    raise ValueError("Role petugas ini harus memilih kelurahan atau kecamatan")

  if scope_type == "kelurahan":
    kelurahan_id = _parse_int(kelurahan_value, "Kelurahan")
    row = conn.execute(
      """
      SELECT kelurahan.id AS kelurahan_id, kecamatan.id AS kecamatan_id
      FROM kelurahan
      JOIN kecamatan ON kecamatan.id = kelurahan.kecamatan_id
      WHERE kelurahan.id = ?
      """,
      (kelurahan_id,),
    ).fetchone()
    if not row:
      raise ValueError("Kelurahan tidak ditemukan")
    return "kelurahan", int(row["kelurahan_id"]), int(row["kecamatan_id"])

  if scope_type == "kecamatan":
    kecamatan_id = _parse_int(kecamatan_value, "Kecamatan")
    row = conn.execute("SELECT id FROM kecamatan WHERE id = ?", (kecamatan_id,)).fetchone()
    if not row:
      raise ValueError("Kecamatan tidak ditemukan")
    return "kecamatan", None, int(row["id"])

  return "none", None, None


def _set_user_role_from_request(conn, request_row, deps):
  requested_role = request_row["requested_role"]
  scope_type = request_row["requested_scope_type"]
  kelurahan_id = request_row["requested_kelurahan_id"]
  kecamatan_id = request_row["requested_kecamatan_id"]
  now = deps["utc_now_iso"]()

  if requested_role == "ksh":
    deps["execute"](
      conn,
      """
      UPDATE users
      SET role_code = 'ksh', is_ksh = 1, moderator_tier = NULL, tier2_badge = NULL,
          kelurahan_id = ?, kecamatan_id = ?, updated_at = ?
      WHERE id = ?
      """,
      (kelurahan_id, kecamatan_id, now, request_row["requester_user_id"]),
    )
    return {"roleCode": "ksh", "isKsh": True, "scopeType": scope_type}

  if requested_role == "moderator_t1":
    deps["execute"](
      conn,
      """
      UPDATE users
      SET role_code = 'moderator_t1', is_ksh = 0, moderator_tier = 1, tier2_badge = NULL,
          kelurahan_id = ?, kecamatan_id = ?, updated_at = ?
      WHERE id = ?
      """,
      (kelurahan_id, kecamatan_id, now, request_row["requester_user_id"]),
    )
    return {"roleCode": "moderator_t1", "moderatorTier": 1, "scopeType": scope_type}

  if requested_role == "moderator_t2":
    tier2_badge = "lurah" if scope_type == "kelurahan" else "camat"
    final_kelurahan_id = kelurahan_id if tier2_badge == "lurah" else None
    deps["execute"](
      conn,
      """
      UPDATE users
      SET role_code = 'moderator_t2', is_ksh = 0, moderator_tier = 2, tier2_badge = ?,
          kelurahan_id = ?, kecamatan_id = ?, updated_at = ?
      WHERE id = ?
      """,
      (tier2_badge, final_kelurahan_id, kecamatan_id, now, request_row["requester_user_id"]),
    )
    return {
      "roleCode": "moderator_t2",
      "moderatorTier": 2,
      "tier2Badge": tier2_badge,
      "scopeType": scope_type,
    }

  raise ValueError("Role pengajuan tidak valid")


def _notify(conn, deps, user_id, title, message, request_id):
  create_notification = deps.get("create_notification")
  if not create_notification:
    return
  create_notification(conn, user_id, "access_request", title, message, "access_request", request_id)


def handle_get(handler, conn, path, query, deps):
  api_prefix = deps["API_PREFIX"]

  if path == f"{api_prefix}/access-requests/me":
    actor = _actor(conn, handler, deps)
    if not actor:
      return _json(deps, handler, 401, {"error": "Unauthorized"})
    rows = conn.execute(
      _select_requests_sql()
      + """
        WHERE access_requests.requester_user_id = ?
        ORDER BY access_requests.created_at DESC
        LIMIT 50
      """,
      (actor["id"],),
    ).fetchall()
    return _json(deps, handler, 200, {"requests": [_request_payload(row) for row in rows]})

  if path == f"{api_prefix}/admin/access-requests":
    actor = _actor(conn, handler, deps)
    if not actor:
      return _json(deps, handler, 401, {"error": "Unauthorized"})
    if actor["role_code"] != "admin":
      return _json(deps, handler, 403, {"error": "Admin only"})

    status_filter = str(query.get("status", ["pending"])[0] or "pending").strip().lower()
    if status_filter not in REVIEW_STATUSES:
      return _json(deps, handler, 400, {"error": "Status filter tidak valid"})
    try:
      search_filter = deps["bounded_text"](query.get("q", [""])[0], 120)
      limit, offset = deps["parse_pagination"](query, default_limit=100, max_limit=500)
    except ValueError as exc:
      return _json(deps, handler, 400, {"error": str(exc)})

    where = ["1=1"]
    params = []
    if status_filter != "all":
      where.append("access_requests.status = ?")
      params.append(status_filter)
    if search_filter:
      where.append("(access_requests.requester_email LIKE ? OR access_requests.requester_name LIKE ?)")
      like = f"%{search_filter}%"
      params.extend([like, like])

    where_sql = " WHERE " + " AND ".join(where)
    total = conn.execute(
      "SELECT COUNT(*) AS c FROM access_requests" + where_sql,
      tuple(params),
    ).fetchone()["c"]
    rows = conn.execute(
      _select_requests_sql()
      + where_sql
      + """
        ORDER BY
          CASE access_requests.status WHEN 'pending' THEN 0 WHEN 'approved' THEN 1 ELSE 2 END,
          access_requests.created_at DESC
        LIMIT ? OFFSET ?
      """,
      tuple([*params, limit, offset]),
    ).fetchall()
    return _json(deps, handler, 200, {
      "requests": [_request_payload(row) for row in rows],
      "pagination": deps["pagination_payload"](total, limit, offset),
    })

  return False


def handle_post(handler, conn, path, body, deps):
  api_prefix = deps["API_PREFIX"]

  if path == f"{api_prefix}/access-requests":
    actor = _actor(conn, handler, deps)
    if not actor:
      return _json(deps, handler, 401, {"error": "Unauthorized"})
    if actor["role_code"] not in ("user", "ksh"):
      return _json(deps, handler, 403, {"error": "Akun ini tidak perlu mengajukan akses petugas"})

    requested_role = str(_body_value(body, "requestedRole", "requested_role", default="")).strip().lower()
    if requested_role not in REQUESTABLE_ROLES:
      return _json(deps, handler, 400, {"error": "Role yang diajukan tidak valid"})
    if actor["role_code"] == requested_role:
      return _json(deps, handler, 400, {"error": "Role tersebut sudah aktif di akun ini"})

    try:
      scope_type, kelurahan_id, kecamatan_id = _resolve_scope(
        conn,
        requested_role,
        _body_value(body, "requestedScopeType", "requested_scope_type", default=""),
        _body_value(body, "requestedKelurahanId", "requested_kelurahan_id", "kelurahanId", default=None),
        _body_value(body, "requestedKecamatanId", "requested_kecamatan_id", "kecamatanId", default=None),
      )
      position_or_title = deps["bounded_text"](_body_value(body, "positionOrTitle", "position_or_title", default=""), 180)
      reason = deps["bounded_text"](body.get("reason", ""), 1000)
    except ValueError as exc:
      return _json(deps, handler, 400, {"error": str(exc)})
    if not position_or_title:
      return _json(deps, handler, 400, {"error": "Jabatan atau keterangan wajib diisi"})
    if not reason:
      return _json(deps, handler, 400, {"error": "Alasan pengajuan wajib diisi"})

    existing = conn.execute(
      """
      SELECT id FROM access_requests
      WHERE requester_user_id = ? AND requested_role = ? AND status = 'pending'
      LIMIT 1
      """,
      (actor["id"], requested_role),
    ).fetchone()
    if existing:
      return _json(deps, handler, 400, {"error": "Masih ada pengajuan pending untuk role ini"})

    request_id = str(uuid.uuid4())
    now = deps["utc_now_iso"]()
    try:
      deps["execute"](
        conn,
        """
        INSERT INTO access_requests(
          id, requester_user_id, requester_email, requester_name, current_role,
          requested_role, requested_scope_type, requested_kelurahan_id, requested_kecamatan_id,
          position_or_title, reason, status, created_at
        )
        VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)
        """,
        (
          request_id,
          actor["id"],
          actor["email"],
          actor["name"],
          actor["role_code"],
          requested_role,
          scope_type,
          kelurahan_id,
          kecamatan_id,
          position_or_title,
          reason,
          now,
        ),
      )
    except sqlite3.IntegrityError:
      return _json(deps, handler, 400, {"error": "Masih ada pengajuan pending untuk role ini"})

    deps["log_audit"](
      conn,
      actor["id"],
      "access-request.submit",
      "access_request",
      request_id,
      {"requestedRole": requested_role, "scopeType": scope_type},
    )
    row = conn.execute(_select_requests_sql() + " WHERE access_requests.id = ?", (request_id,)).fetchone()
    return _json(deps, handler, 200, {"success": True, "request": _request_payload(row)})

  review_prefix = f"{api_prefix}/admin/access-requests/"
  if path.startswith(review_prefix) and path.endswith("/review"):
    actor = _actor(conn, handler, deps)
    if not actor:
      return _json(deps, handler, 401, {"error": "Unauthorized"})
    if actor["role_code"] != "admin":
      return _json(deps, handler, 403, {"error": "Admin only"})

    request_id = path[len(review_prefix):-len("/review")].strip("/")
    if not request_id or "/" in request_id:
      return _json(deps, handler, 404, {"error": "Pengajuan tidak ditemukan"})
    if not isinstance(body.get("approved"), bool):
      return _json(deps, handler, 400, {"error": "Field approved harus boolean"})
    review_note = deps["bounded_text"](body.get("reviewNote", ""), 500)

    request_row = conn.execute(_select_requests_sql() + " WHERE access_requests.id = ?", (request_id,)).fetchone()
    if not request_row:
      return _json(deps, handler, 404, {"error": "Pengajuan tidak ditemukan"})
    if request_row["status"] != "pending":
      return _json(deps, handler, 400, {"error": "Pengajuan sudah direview"})

    requester = conn.execute("SELECT id FROM users WHERE id = ?", (request_row["requester_user_id"],)).fetchone()
    if not requester:
      return _json(deps, handler, 404, {"error": "Akun pemohon tidak ditemukan"})

    approved = bool(body.get("approved"))
    now = deps["utc_now_iso"]()
    role_payload = None
    if approved:
      role_payload = _set_user_role_from_request(conn, request_row, deps)
      status = "approved"
      title = "Akses petugas disetujui"
      message = "Pengajuan akses petugas kamu sudah disetujui. Silakan refresh dashboard untuk melihat fitur baru."
      action = "admin.access-request.approve"
    else:
      status = "rejected"
      title = "Pengajuan akses petugas ditolak"
      message = "Pengajuan akses petugas kamu ditolak. Lihat catatan admin atau hubungi petugas wilayah."
      action = "admin.access-request.reject"

    deps["execute"](
      conn,
      """
      UPDATE access_requests
      SET status = ?, reviewed_by_user_id = ?, review_note = ?, reviewed_at = ?
      WHERE id = ?
      """,
      (status, actor["id"], review_note or None, now, request_id),
    )
    deps["log_audit"](
      conn,
      actor["id"],
      action,
      "access_request",
      request_id,
      {
        "requesterUserId": request_row["requester_user_id"],
        "requestedRole": request_row["requested_role"],
        "scopeType": request_row["requested_scope_type"],
        "approved": approved,
        "rolePayload": role_payload,
      },
    )
    _notify(conn, deps, request_row["requester_user_id"], title, message, request_id)
    row = conn.execute(_select_requests_sql() + " WHERE access_requests.id = ?", (request_id,)).fetchone()
    return _json(deps, handler, 200, {"success": True, "request": _request_payload(row)})

  return False


access_request_routes = {
  "GET": ("/access-requests/me", "/admin/access-requests"),
  "POST": ("/access-requests", "/admin/access-requests/{id}/review"),
}
