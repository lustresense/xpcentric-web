"""
SIMRP Notifications Module.

Handles notification listing and read status delegated from server/main.py.
"""


def _json(deps, handler, status, payload):
  deps["write_json"](handler, status, payload)
  return True


def _auth_header(handler):
  return handler.headers.get("Authorization")


def _actor(conn, handler, deps):
  return deps["user_from_token"](conn, _auth_header(handler))


def handle_get(handler, conn, path, query, deps):
  api_prefix = deps["API_PREFIX"]

  if path == f"{api_prefix}/notifications/count":
    actor = _actor(conn, handler, deps)
    if not actor:
      return _json(deps, handler, 401, {"error": "Unauthorized"})
    unread = conn.execute(
      "SELECT COUNT(*) AS c FROM notifications WHERE user_id = ? AND is_read = 0",
      (actor["id"],),
    ).fetchone()["c"]
    return _json(deps, handler, 200, {"unread": int(unread)})

  if path == f"{api_prefix}/notifications":
    actor = _actor(conn, handler, deps)
    if not actor:
      return _json(deps, handler, 401, {"error": "Unauthorized"})
    try:
      limit, offset = deps["parse_pagination"](query, default_limit=100, max_limit=500)
    except ValueError as exc:
      return _json(deps, handler, 400, {"error": str(exc)})
    total = conn.execute(
      "SELECT COUNT(*) AS c FROM notifications WHERE user_id = ?",
      (actor["id"],),
    ).fetchone()["c"]
    rows = conn.execute(
      """
      SELECT id, type, title, message, is_read, entity_type, entity_id, created_at
      FROM notifications
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
      """,
      (actor["id"], limit, offset),
    ).fetchall()
    notifications = [
      {
        "id": int(row["id"]),
        "type": row["type"],
        "title": row["title"],
        "message": row["message"],
        "isRead": bool(row["is_read"]),
        "entityType": row["entity_type"],
        "entityId": row["entity_id"],
        "createdAt": row["created_at"],
      }
      for row in rows
    ]
    return _json(deps, handler, 200, {"notifications": notifications, "pagination": deps["pagination_payload"](total, limit, offset)})

  return False


def handle_post(handler, conn, path, body, deps):
  api_prefix = deps["API_PREFIX"]

  if path.endswith("/read") and path.startswith(f"{api_prefix}/notifications/"):
    actor = _actor(conn, handler, deps)
    if not actor:
      return _json(deps, handler, 401, {"error": "Unauthorized"})
    notif_id = path.split("/")[-2]
    try:
      notif_id_int = int(notif_id)
    except Exception:
      return _json(deps, handler, 400, {"error": "ID notifikasi tidak valid"})
    updated = deps["execute"](
      conn,
      "UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?",
      (notif_id_int, actor["id"]),
    ).rowcount
    if updated == 0:
      return _json(deps, handler, 404, {"error": "Notifikasi tidak ditemukan"})
    return _json(deps, handler, 200, {"success": True})

  return False


notification_routes = {
  "GET": ("/notifications", "/notifications/count"),
  "POST": ("/notifications/{id}/read",),
}
