"""
SIMRP Admin Module
Admin-only operations: user management, temporary adjustments.
"""
from core import execute, commit, generate_entity_id, utc_now_iso, MIN_TEMP_POINTS, MAX_TEMP_POINTS
from datetime import datetime, timezone, timedelta
import json
import uuid


def get_admin_stats(handler, body, client_ip):
    """Get admin dashboard statistics."""
    user = handler.get_current_user()
    if not user or user["roleCode"] != "admin":
        return handler.send_json(403, {"error": "Admin only"})
    
    stats = {
        "users": {"total": execute("SELECT COUNT(*) as c FROM users").fetchone()["c"]},
        "events": {"total": execute("SELECT COUNT(*) as c FROM events").fetchone()["c"]},
        "reports": {"pending": execute("SELECT COUNT(*) as c FROM event_reports WHERE status = 'pending'").fetchone()["c"]},
    }
    return handler.send_json(200, stats)


def get_temporary_adjustments(handler, body, client_ip):
    """Get all temporary adjustments."""
    user = handler.get_current_user()
    if not user or user["roleCode"] != "admin":
        return handler.send_json(403, {"error": "Admin only"})
    
    rows = execute("""
        SELECT temporary_adjustments.*, users.name AS user_name
        FROM temporary_adjustments JOIN users ON users.id = temporary_adjustments.user_id
        ORDER BY temporary_adjustments.created_at DESC
    """).fetchall()
    
    adjustments = []
    for r in rows:
        value = json.loads(r["value_json"])
        adjustments.append({
            "id": r["id"], "type": r["adjustment_type"],
            "value": value.get("points") if r["adjustment_type"] == "points" else value.get("badgeId", ""),
            "reason": r["reason"], "grantedAt": r["created_at"], "expiresAt": r["expires_at"],
            "targetUserName": r["user_name"],
        })
    return handler.send_json(200, {"adjustments": adjustments})


def add_temporary_points(handler, body, client_ip):
    """Add temporary points to user."""
    user = handler.get_current_user()
    if not user or user["roleCode"] != "admin":
        return handler.send_json(403, {"error": "Admin only"})
    
    points = int(body.get("points", 0))
    if points < MIN_TEMP_POINTS or points > MAX_TEMP_POINTS:
        return handler.send_json(400, {"error": f"Penyesuaian poin maksimal {MIN_TEMP_POINTS} sampai {MAX_TEMP_POINTS}"})
    
    now = utc_now_iso()
    execute("UPDATE users SET points = MAX(points + ?, 0), updated_at = ? WHERE id = ?", (points, now, body.get("userId")))
    execute("INSERT INTO temporary_adjustments(id, user_id, adjustment_type, value_json, reason, expires_at, created_at) VALUES(?, ?, 'points', ?, ?, ?, ?)",
            (generate_entity_id("adjust"), body.get("userId"), json.dumps({"points": points}), body.get("reason", "admin points"), 
             (datetime.now(timezone.utc) + timedelta(hours=24)).isoformat(), now))
    commit()
    return handler.send_json(200, {"success": True})


admin_routes = {
    "GET": {"/admin/stats": get_admin_stats, "/admin/temporary-adjustments": get_temporary_adjustments},
    "POST": {"/admin/add-temporary-points": add_temporary_points},
}


def _json(deps, handler, status, payload):
    deps["write_json"](handler, status, payload)
    return True


def _auth_header(handler):
    return handler.headers.get("Authorization")


def _actor(conn, handler, deps):
    return deps["user_from_token"](conn, _auth_header(handler))


def handle_get(handler, conn, path, deps):
    api_prefix = deps["API_PREFIX"]

    if path == f"{api_prefix}/admin/temporary-adjustments":
        actor = _actor(conn, handler, deps)
        if not actor or actor["role_code"] != "admin":
            return _json(deps, handler, 403, {"error": "Admin only"})
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
        return _json(deps, handler, 200, {"adjustments": out})

    return False


def handle_post(handler, conn, path, body, deps):
    api_prefix = deps["API_PREFIX"]
    if not path.startswith(f"{api_prefix}/admin/"):
        return False

    actor = _actor(conn, handler, deps)
    if not actor:
        return _json(deps, handler, 401, {"error": "Unauthorized"})
    if actor["role_code"] != "admin":
        return _json(deps, handler, 403, {"error": "Admin only"})

    if path == f"{api_prefix}/admin/assign-role":
        badge = str(body.get("tier2Badge", "lurah")).lower()
        if badge not in ("lurah", "camat"):
            badge = "lurah"
        target_user_id = str(body.get("userId", "")).strip()
        if not target_user_id:
            return _json(deps, handler, 400, {"error": "userId wajib diisi"})
        deps["execute"](
            conn,
            "UPDATE users SET role_code = 'moderator_t2', moderator_tier = 2, tier2_badge = ?, updated_at = ? WHERE id = ?",
            (badge, deps["utc_now_iso"](), target_user_id),
        )
        deps["log_audit"](
            conn,
            actor["id"],
            "admin.assign-role",
            "user",
            target_user_id,
            {"roleCode": "moderator_t2", "tier2Badge": badge},
        )
        return _json(deps, handler, 200, {"success": True})

    if path == f"{api_prefix}/admin/remove-role":
        target_user_id = str(body.get("userId", "")).strip()
        if not target_user_id:
            return _json(deps, handler, 400, {"error": "userId wajib diisi"})
        deps["execute"](
            conn,
            "UPDATE users SET role_code = 'user', moderator_tier = NULL, tier2_badge = NULL, updated_at = ? WHERE id = ?",
            (deps["utc_now_iso"](), target_user_id),
        )
        deps["log_audit"](
            conn,
            actor["id"],
            "admin.remove-role",
            "user",
            target_user_id,
            {"roleCode": "user"},
        )
        return _json(deps, handler, 200, {"success": True})

    if path == f"{api_prefix}/admin/add-temporary-points":
        points = int(body.get("points", 0))
        target_user_id = str(body.get("userId", "")).strip()
        if not target_user_id:
            return _json(deps, handler, 400, {"error": "userId wajib diisi"})
        if points < -500 or points > 500:
            return _json(deps, handler, 400, {"error": "Penyesuaian poin maksimal +/-500"})
        now = deps["utc_now_iso"]()
        reason = deps["bounded_text"](body.get("reason", "admin points"), 300)
        deps["execute"](
            conn,
            "UPDATE users SET points = MAX(points + ?, 0), updated_at = ? WHERE id = ?",
            (points, now, target_user_id),
        )
        deps["execute"](
            conn,
            """
            INSERT INTO temporary_adjustments(id, user_id, adjustment_type, value_json, reason, expires_at, created_at)
            VALUES(?, ?, 'points', ?, ?, ?, ?)
            """,
            (
                str(uuid.uuid4()),
                target_user_id,
                json.dumps({"points": points}),
                reason,
                (datetime.now(timezone.utc) + timedelta(hours=24)).isoformat(),
                now,
            ),
        )
        deps["log_audit"](
            conn,
            actor["id"],
            "admin.add-temporary-points",
            "user",
            target_user_id,
            {"points": points, "reason": reason},
        )
        return _json(deps, handler, 200, {"success": True})

    if path == f"{api_prefix}/admin/add-temporary-badge":
        target_id = str(body.get("userId", "")).strip()
        badge_id = deps["bounded_text"](body.get("badgeId", ""), 80)
        if not target_id:
            return _json(deps, handler, 400, {"error": "userId wajib diisi"})
        if not badge_id:
            return _json(deps, handler, 400, {"error": "badgeId wajib diisi"})
        user = conn.execute("SELECT badges_json FROM users WHERE id = ?", (target_id,)).fetchone()
        if not user:
            return _json(deps, handler, 404, {"error": "User tidak ditemukan"})
        badges = json.loads(user["badges_json"] or "[]")
        badges.append({"id": badge_id, "temporary": True})
        now = deps["utc_now_iso"]()
        reason = deps["bounded_text"](body.get("reason", "admin badge"), 300)
        deps["execute"](
            conn,
            "UPDATE users SET badges_json = ?, updated_at = ? WHERE id = ?",
            (json.dumps(badges), now, target_id),
        )
        deps["execute"](
            conn,
            """
            INSERT INTO temporary_adjustments(id, user_id, adjustment_type, value_json, reason, expires_at, created_at)
            VALUES(?, ?, 'badge', ?, ?, ?, ?)
            """,
            (
                str(uuid.uuid4()),
                target_id,
                json.dumps({"badgeId": badge_id}),
                reason,
                (datetime.now(timezone.utc) + timedelta(hours=24)).isoformat(),
                now,
            ),
        )
        deps["log_audit"](
            conn,
            actor["id"],
            "admin.add-temporary-badge",
            "user",
            target_id,
            {"badgeId": badge_id, "reason": reason},
        )
        return _json(deps, handler, 200, {"success": True})

    return False


admin_api_routes = {
    "GET": ("/admin/temporary-adjustments",),
    "POST": (
        "/admin/assign-role",
        "/admin/remove-role",
        "/admin/add-temporary-points",
        "/admin/add-temporary-badge",
    ),
}
