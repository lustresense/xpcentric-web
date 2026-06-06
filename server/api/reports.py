"""
SIMREKAP Report Module
Report creation and verification.
"""
import hashlib
import json
import uuid

from core import execute, commit, generate_entity_id, utc_now_iso, RATE_LIMIT_MUTATION_MAX
from services.rate_limiter import check_rate_limit


def get_reports(handler, body, client_ip, query_params=None):
    """Get all reports with filters."""
    user = handler.get_current_user()
    if not user:
        return handler.send_json(401, {"error": "Unauthorized"})
    
    status_filter = query_params.get("status", [None])[0] if query_params else None
    sql = "SELECT * FROM event_reports WHERE 1=1"
    params = []
    
    if status_filter:
        sql += " AND status = ?"
        params.append(status_filter)
    sql += " ORDER BY created_at DESC"
    
    rows = execute(sql, tuple(params)).fetchall()
    reports = [{
        "id": r["id"], "eventId": r["event_id"], "userId": r["user_id"],
        "participants": int(r["participants"]), "status": r["status"],
        "points": int(r["points_awarded"]), "createdAt": r["created_at"],
    } for r in rows]
    return handler.send_json(200, {"reports": reports})


def create_report(handler, body, client_ip):
    """Create new report."""
    if check_rate_limit("mutation", client_ip, RATE_LIMIT_MUTATION_MAX):
        return handler.send_json(429, {"error": "Terlalu banyak permintaan"})
    
    user = handler.get_current_user()
    if not user or user["roleCode"] not in ("user", "ksh"):
        return handler.send_json(403, {"error": "Hanya relawan/KSH yang dapat lapor"})
    
    event_id = body.get("eventId")
    if not event_id:
        return handler.send_json(400, {"error": "Event ID wajib diisi"})
    
    event = execute("SELECT * FROM events WHERE id = ?", (event_id,)).fetchone()
    if not event or event["status"] != "completed":
        return handler.send_json(400, {"error": "Laporan hanya setelah event selesai"})
    
    try:
        participants = int(body.get("participants", 1))
        if participants < 1 or participants > 10000:
            raise ValueError()
    except:
        return handler.send_json(400, {"error": "Jumlah peserta harus 1-10000"})
    
    outcome_tags = body.get("outcomeTags", [])
    if not isinstance(outcome_tags, list) or len(outcome_tags) > 20:
        return handler.send_json(400, {"error": "Outcome tags harus array (max 20)"})
    
    report_id = generate_entity_id("report")
    now = utc_now_iso()
    
    execute(
        """INSERT INTO event_reports(id, event_id, user_id, participants, checklist_json, outcome_tags_json, photo_url, status, points_awarded, created_at, updated_at)
           VALUES(?, ?, ?, ?, ?, ?, ?, 'pending', 0, ?, ?)""",
        (report_id, event_id, user["id"], participants, json.dumps({"attendance": True}), json.dumps(outcome_tags), body.get("photoUrl"), now, now)
    )
    commit()
    return handler.send_json(200, {"success": True, "report": {"id": report_id}})


def verify_report(handler, body, client_ip, report_id):
    """Verify (approve/reject) report."""
    user = handler.get_current_user()
    if not user or user["roleCode"] not in ("moderator_t2", "admin"):
        return handler.send_json(403, {"error": "Hanya Moderator Tier 2/Admin yang boleh verifikasi"})
    
    report = execute("SELECT * FROM event_reports WHERE id = ?", (report_id,)).fetchone()
    if not report or report["status"] != "pending":
        return handler.send_json(404, {"error": "Report tidak ditemukan atau sudah diproses"})
    
    approved = bool(body.get("approved", False))
    now = utc_now_iso()
    
    if approved:
        event = execute("SELECT * FROM events WHERE id = ?", (report["event_id"],)).fetchone()
        base_xp = 20 + (int(report["participants"]) * 2)
        gained_xp = base_xp  # Simplified - full XP calculation in production
        
        execute("UPDATE xp_kelurahan SET total_xp = total_xp + ?, updated_at = ? WHERE kelurahan_id = ?",
                (gained_xp, now, event["kelurahan_id"]))
        execute("UPDATE users SET points = points + 5, updated_at = ? WHERE id = ?", (now, report["user_id"]))
        execute("UPDATE event_reports SET status = 'verified', points_awarded = ?, verified_by_user_id = ?, verified_at = ?, updated_at = ? WHERE id = ?",
                (gained_xp, user["id"], now, now, report_id))
    else:
        execute("UPDATE event_reports SET status = 'rejected', verified_by_user_id = ?, verified_at = ?, updated_at = ? WHERE id = ?",
                (user["id"], now, now, report_id))
    
    commit()
    return handler.send_json(200, {"success": True})


report_routes = {
    "GET": {"/reports": get_reports},
    "POST": {"/reports": create_report, "/reports/{id}/verify": verify_report},
}


def _json(deps, handler, status, payload):
    deps["write_json"](handler, status, payload)
    return True


def _auth_header(handler):
    return handler.headers.get("Authorization")


def _actor(conn, handler, deps):
    return deps["user_from_token"](conn, _auth_header(handler))


def _can_moderate_report(actor, event):
    if actor["role_code"] == "admin":
        return True
    if actor["role_code"] != "moderator_t2":
        return False
    badge = str(actor["tier2_badge"] or "").strip().lower()
    if badge == "lurah":
        return (
            event["scope_type"] == "kelurahan"
            and actor["kelurahan_id"]
            and event["kelurahan_id"] == actor["kelurahan_id"]
        )
    if badge == "camat":
        return actor["kecamatan_id"] and event["kecamatan_id"] == actor["kecamatan_id"]
    return False


def _event_matches_actor_region(actor, event):
    if not actor or not event:
        return False
    if event["scope_type"] == "kelurahan":
        return bool(actor["kelurahan_id"]) and event["kelurahan_id"] == actor["kelurahan_id"]
    if event["scope_type"] == "kecamatan":
        return bool(actor["kecamatan_id"]) and event["kecamatan_id"] == actor["kecamatan_id"]
    return False


def handle_get(handler, conn, path, query, deps):
    api_prefix = deps["API_PREFIX"]

    if path != f"{api_prefix}/reports":
        return False

    actor = _actor(conn, handler, deps)
    if not actor:
        return _json(deps, handler, 401, {"error": "Unauthorized"})
    status_filter = query.get("status", [None])[0] if query else None
    user_filter = query.get("userId", [None])[0] if query else None
    try:
        limit, offset = deps["parse_pagination"](query, default_limit=100, max_limit=500)
    except ValueError as exc:
        return _json(deps, handler, 400, {"error": str(exc)})
    if status_filter and status_filter not in ("pending", "under_review", "verified", "rejected"):
        return _json(deps, handler, 400, {"error": "Status laporan tidak valid"})
    sql = "SELECT * FROM event_reports WHERE 1=1"
    params = []
    if status_filter:
        sql += " AND status = ?"
        params.append(status_filter)
    if actor["role_code"] in ("user", "ksh"):
        sql += " AND user_id = ?"
        params.append(actor["id"])
    elif actor["role_code"] == "admin":
        if user_filter:
            sql += " AND user_id = ?"
            params.append(user_filter)
    elif actor["role_code"] == "moderator_t1":
        sql += """
            AND EXISTS (
              SELECT 1 FROM events
              WHERE events.id = event_reports.event_id
                AND events.created_by_user_id = ?
            )
        """
        params.append(actor["id"])
    elif actor["role_code"] == "moderator_t2":
        badge = str(actor["tier2_badge"] or "").strip().lower()
        if badge == "lurah":
            sql += """
                AND EXISTS (
                  SELECT 1 FROM events
                  WHERE events.id = event_reports.event_id
                    AND events.scope_type = 'kelurahan'
                    AND events.kelurahan_id = ?
                )
            """
            params.append(actor["kelurahan_id"])
        elif badge == "camat":
            sql += """
                AND EXISTS (
                  SELECT 1 FROM events
                  WHERE events.id = event_reports.event_id
                    AND events.kecamatan_id = ?
                )
            """
            params.append(actor["kecamatan_id"])
        else:
            sql += " AND 1=0"
    elif actor["role_code"] == "moderator_t3":
        pass
    else:
        sql += " AND 1=0"
    total = conn.execute(f"SELECT COUNT(*) AS c FROM ({sql}) AS filtered_reports", tuple(params)).fetchone()["c"]
    sql += " ORDER BY created_at DESC LIMIT ? OFFSET ?"
    rows = conn.execute(sql, tuple([*params, limit, offset])).fetchall()
    out = []
    for r in rows:
        out.append(
            {
                "id": r["id"],
                "eventId": r["event_id"],
                "userId": r["user_id"],
                "participants": int(r["participants"]),
                "outcomeTags": json.loads(r["outcome_tags_json"] or "[]"),
                "photoUrl": r["photo_url"],
                "status": r["status"],
                "rejectReason": r["reject_reason"] or "",
                "points": int(r["points_awarded"]),
                "createdAt": r["created_at"],
            }
        )
    return _json(deps, handler, 200, {"reports": out, "pagination": deps["pagination_payload"](total, limit, offset)})


def handle_post(handler, conn, path, body, deps):
    api_prefix = deps["API_PREFIX"]

    if not path.startswith(f"{api_prefix}/reports"):
        return False

    actor = _actor(conn, handler, deps)
    if not actor:
        return _json(deps, handler, 401, {"error": "Unauthorized"})

    if path == f"{api_prefix}/reports":
        if actor["role_code"] not in ("user", "ksh"):
            return _json(deps, handler, 403, {"error": "Hanya relawan/KSH yang dapat lapor"})
        event_id = body.get("eventId")
        if not event_id:
            return _json(deps, handler, 400, {"error": "Event ID wajib diisi"})
        event = conn.execute("SELECT * FROM events WHERE id = ?", (event_id,)).fetchone()
        if not event or event["status"] != "completed":
            return _json(deps, handler, 400, {"error": "Laporan hanya setelah event selesai"})
        if not _event_matches_actor_region(actor, event):
            return _json(deps, handler, 403, {"error": "Event di luar wilayah relawan"})
        part = conn.execute(
            "SELECT * FROM event_participation WHERE event_id = ? AND user_id = ?",
            (event_id, actor["id"]),
        ).fetchone()
        if not part:
            return _json(deps, handler, 400, {"error": "Relawan belum terdaftar pada event ini"})
        if part["status"] != "attended":
            return _json(deps, handler, 400, {"error": "Laporan hanya bisa dikirim oleh peserta yang ditandai hadir"})
        existing_report = conn.execute(
            "SELECT id FROM event_reports WHERE event_id = ? AND user_id = ? LIMIT 1",
            (event_id, actor["id"]),
        ).fetchone()
        if existing_report:
            return _json(deps, handler, 400, {"error": "Kamu sudah pernah mengirim laporan untuk event ini"})
        try:
            participants = int(body.get("participants", 1))
        except Exception:
            return _json(deps, handler, 400, {"error": "Jumlah peserta harus angka"})
        if participants < 1 or participants > 10000:
            return _json(deps, handler, 400, {"error": "Jumlah peserta harus 1-10000"})
        outcome_tags = body.get("outcomeTags", [])
        if not isinstance(outcome_tags, list):
            return _json(deps, handler, 400, {"error": "Outcome tags harus berbentuk array"})
        if len(outcome_tags) > 20:
            return _json(deps, handler, 400, {"error": "Outcome tags maksimal 20 item"})
        safe_tags = [deps["bounded_text"](tag, 60) for tag in outcome_tags]
        photo_url = deps["bounded_text"](body.get("photoUrl", ""), 2_000_000)
        report_id = f"report-{uuid.uuid4().hex[:12]}"
        now = deps["utc_now_iso"]()
        deps["execute"](
            conn,
            """
          INSERT INTO event_reports(
            id, event_id, user_id, participants, checklist_json, outcome_tags_json, photo_url,
            status, points_awarded, created_at, updated_at
          )
          VALUES(?, ?, ?, ?, ?, ?, ?, 'pending', 0, ?, ?)
          """,
            (
                report_id,
                event_id,
                actor["id"],
                participants,
                json.dumps({"attendance": True, "post_event": True}),
                json.dumps(safe_tags),
                photo_url,
                now,
                now,
            ),
        )
        deps["execute"](
            conn,
            "UPDATE event_participation SET status = 'reported', checklist_done = 1, updated_at = ? WHERE event_id = ? AND user_id = ?",
            (now, event_id, actor["id"]),
        )
        deps["log_audit"](
            conn,
            actor["id"],
            "report.submit",
            "report",
            report_id,
            {"eventId": event_id, "participants": participants, "outcomeTags": safe_tags},
        )
        return _json(deps, handler, 200, {"success": True, "report": {"id": report_id}})

    if path.endswith("/review") and path.startswith(f"{api_prefix}/reports/"):
        # STATUS UNDER_REVIEW: Moderator menandai laporan sedang ditinjau (pending → under_review).
        # Ini memberi feedback ke relawan bahwa laporannya tidak diabaikan.
        if not deps["can_verify_report"](actor):
            return _json(deps, handler, 403, {"error": "Hanya Moderator Tier 2/Admin yang boleh me-review laporan"})
        report_id = path.split("/")[-2]
        report = conn.execute("SELECT * FROM event_reports WHERE id = ?", (report_id,)).fetchone()
        if not report:
            return _json(deps, handler, 404, {"error": "Report tidak ditemukan"})
        event = conn.execute("SELECT * FROM events WHERE id = ?", (report["event_id"],)).fetchone()
        if not event:
            return _json(deps, handler, 404, {"error": "Event tidak ditemukan"})
        if not _can_moderate_report(actor, event):
            return _json(deps, handler, 403, {"error": "Moderator tidak berwenang untuk wilayah laporan ini"})
        if report["status"] != "pending":
            return _json(deps, handler, 400, {"error": "Hanya laporan berstatus pending yang bisa ditandai under_review"})
        now = deps["utc_now_iso"]()
        deps["execute"](
            conn,
            "UPDATE event_reports SET status = 'under_review', verified_by_user_id = ?, updated_at = ? WHERE id = ?",
            (actor["id"], now, report_id),
        )
        deps["create_notification"](
            conn,
            report["user_id"],
            "report.under_review",
            "Laporan sedang ditinjau",
            "Laporanmu sedang dalam proses peninjauan oleh moderator.",
            "report",
            report_id,
        )
        deps["log_audit"](
            conn,
            actor["id"],
            "report.under_review",
            "report",
            report_id,
            {"reporterId": report["user_id"]},
        )
        return _json(deps, handler, 200, {"success": True, "status": "under_review"})

    if path.endswith("/verify") and path.startswith(f"{api_prefix}/reports/"):
        if not deps["can_verify_report"](actor):
            return _json(deps, handler, 403, {"error": "Hanya Moderator Tier 2/Admin yang boleh verifikasi"})
        report_id = path.split("/")[-2]
        report = conn.execute("SELECT * FROM event_reports WHERE id = ?", (report_id,)).fetchone()
        if not report:
            return _json(deps, handler, 404, {"error": "Report tidak ditemukan"})
        event = conn.execute("SELECT * FROM events WHERE id = ?", (report["event_id"],)).fetchone()
        if not event:
            return _json(deps, handler, 404, {"error": "Event tidak ditemukan"})
        if not _can_moderate_report(actor, event):
            return _json(deps, handler, 403, {"error": "Moderator tidak berwenang untuk wilayah laporan ini"})
        # Verifikasi bisa dilakukan dari status pending ATAU under_review
        if report["status"] not in ("pending", "under_review"):
            return _json(deps, handler, 400, {"error": "Report sudah diproses"})
        approved = bool(body.get("approved"))
        now = deps["utc_now_iso"]()
        if approved:
            gained = deps["apply_xp"](conn, event, int(report["participants"]))
            deps["execute"](
                conn,
                "UPDATE event_reports SET status = 'verified', points_awarded = ?, verified_by_user_id = ?, verified_at = ?, updated_at = ? WHERE id = ?",
                (gained, actor["id"], now, now, report_id),
            )
            deps["execute"](
                conn,
                "UPDATE users SET points = points + 5, updated_at = ? WHERE id = ?",
                (now, report["user_id"]),
            )
            cert_id = f"cert-{uuid.uuid4().hex[:12]}"
            cert_hash = hashlib.sha256(
                f"{cert_id}:{report['user_id']}:{report['event_id']}:{now}".encode("utf-8")
            ).hexdigest()[:16]
            deps["execute"](
                conn,
                """
            INSERT OR IGNORE INTO certificates(id, user_id, event_id, report_id, certificate_hash, issued_at)
            VALUES(?, ?, ?, ?, ?, ?)
            """,
                (cert_id, report["user_id"], report["event_id"], report_id, cert_hash, now),
            )
            cert_row = conn.execute(
                """
            SELECT id, certificate_hash
            FROM certificates
            WHERE user_id = ? AND event_id = ?
            LIMIT 1
            """,
                (report["user_id"], report["event_id"]),
            ).fetchone()
            deps["create_notification"](
                conn,
                report["user_id"],
                "report.verified",
                "Laporan disetujui",
                f"Laporanmu disetujui. Kamu mendapat +{gained} XP kampung dan +5 poin pribadi.",
                "report",
                report_id,
            )
            if cert_row:
                deps["create_notification"](
                    conn,
                    report["user_id"],
                    "certificate.issued",
                    "Sertifikat digital terbit",
                    f"Sertifikat untuk kegiatan ini terbit. Hash verifikasi: {cert_row['certificate_hash']}",
                    "certificate",
                    cert_row["id"],
                )
            deps["log_audit"](
                conn,
                actor["id"],
                "report.verify",
                "report",
                report_id,
                {"approved": True, "pointsAwarded": gained, "reporterId": report["user_id"]},
            )
        else:
            reject_reason = deps["bounded_text"](body.get("reason", ""), 500)
            if not reject_reason:
                return _json(deps, handler, 400, {"error": "Alasan penolakan wajib diisi"})
            deps["execute"](
                conn,
                "UPDATE event_reports SET status = 'rejected', reject_reason = ?, verified_by_user_id = ?, verified_at = ?, updated_at = ? WHERE id = ?",
                (reject_reason, actor["id"], now, now, report_id),
            )
            deps["create_notification"](
                conn,
                report["user_id"],
                "report.rejected",
                "Laporan ditolak",
                f"Laporanmu ditolak. Alasan: {reject_reason}",
                "report",
                report_id,
            )
            deps["log_audit"](
                conn,
                actor["id"],
                "report.reject",
                "report",
                report_id,
                {"approved": False, "reason": reject_reason, "reporterId": report["user_id"]},
            )
        return _json(deps, handler, 200, {"success": True})

    return False


report_routes_modular = {
    "GET": ("/reports",),
    "POST": ("/reports", "/reports/{id}/review", "/reports/{id}/verify"),
}
