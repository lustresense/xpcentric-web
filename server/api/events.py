"""
SIMRP Event Module
Event CRUD, approval, joining, and completion.
"""
import uuid

from core import execute, commit, generate_entity_id, utc_now_iso, VALID_PILLARS, VALID_SCOPE_TYPES, RATE_LIMIT_MUTATION_MAX
from services.rate_limiter import check_rate_limit


def get_events(handler, body, client_ip, query_params=None):
    """Get all events with optional filters."""
    user = handler.get_current_user()
    if not user:
        return handler.send_json(401, {"error": "Unauthorized"})
    
    status_filter = query_params.get("status", [None])[0] if query_params else None
    sql = "SELECT * FROM events WHERE 1=1"
    params = []
    
    if status_filter:
        sql += " AND status = ?"
        params.append(status_filter)
    sql += " ORDER BY event_date ASC"
    
    rows = execute(sql, tuple(params)).fetchall()
    events = []
    for r in rows:
        parts = execute("SELECT user_id FROM event_participation WHERE event_id = ?", (r["id"],)).fetchall()
        events.append({
            "id": r["id"], "title": r["title"], "description": r["description"],
            "pillar": r["pillar"], "date": r["event_date"], "time": r["event_time"],
            "location": r["location"], "quota": r["quota"], "scopeType": r["scope_type"],
            "status": r["status"], "participants": [p["user_id"] for p in parts]
        })
    return handler.send_json(200, {"events": events})


def create_event(handler, body, client_ip):
    """Create new event."""
    if check_rate_limit("mutation", client_ip, RATE_LIMIT_MUTATION_MAX):
        return handler.send_json(429, {"error": "Terlalu banyak permintaan"})
    
    user = handler.get_current_user()
    if not user or user["roleCode"] not in ("moderator_t1", "admin"):
        return handler.send_json(403, {"error": "Hanya ASN Tier 1/Admin yang boleh input kegiatan"})
    
    title = str(body.get("title", "")).strip()[:200]
    if not title:
        return handler.send_json(400, {"error": "Judul wajib diisi"})
    
    pillar = int(body.get("pillar", 1))
    if pillar not in VALID_PILLARS:
        return handler.send_json(400, {"error": "Pilar harus 1-4"})
    
    scope_type = str(body.get("scopeType", "kelurahan")).strip().lower()
    if scope_type not in VALID_SCOPE_TYPES:
        return handler.send_json(400, {"error": "Skala kegiatan harus kelurahan atau kecamatan"})
    
    kecamatan_id = int(body.get("kecamatanId"))
    kelurahan_id = int(body["kelurahanId"]) if body.get("kelurahanId") and scope_type == "kelurahan" else None
    
    event_id = generate_entity_id("event")
    now = utc_now_iso()
    
    execute(
        """INSERT INTO events(id, title, description, pillar, event_date, event_time, location, quota,
           scope_type, kecamatan_id, kelurahan_id, created_by_user_id, status, created_at, updated_at)
           VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?, ?)""",
        (event_id, title, body.get("description", ""), pillar, body.get("date"), 
         body.get("time", ""), body.get("location", ""), int(body.get("quota", 0)),
         scope_type, kecamatan_id, kelurahan_id, user["id"], now, now)
    )
    commit()
    return handler.send_json(200, {"success": True, "event": {"id": event_id}})


def join_event(handler, body, client_ip, event_id):
    """Join an event."""
    if check_rate_limit("mutation", client_ip, RATE_LIMIT_MUTATION_MAX):
        return handler.send_json(429, {"error": "Terlalu banyak permintaan"})
    
    user = handler.get_current_user()
    if not user or user["roleCode"] not in ("user", "ksh"):
        return handler.send_json(403, {"error": "Hanya relawan/KSH yang dapat mendaftar"})
    
    event = execute("SELECT * FROM events WHERE id = ?", (event_id,)).fetchone()
    if not event or event["status"] != "published":
        return handler.send_json(400, {"error": "Event belum dipublish"})
    
    if event["quota"] > 0:
        count = execute("SELECT COUNT(*) AS c FROM event_participation WHERE event_id = ?", (event_id,)).fetchone()["c"]
        if count >= event["quota"]:
            return handler.send_json(400, {"error": "Kuota penuh"})
    
    now = utc_now_iso()
    execute("INSERT OR IGNORE INTO event_participation(event_id, user_id, status, checklist_done, created_at, updated_at) VALUES(?, ?, 'registered', 0, ?, ?)",
            (event_id, user["id"], now, now))
    commit()
    return handler.send_json(200, {"success": True})


def approve_event(handler, body, client_ip, event_id):
    """Approve/reject event."""
    user = handler.get_current_user()
    if not user or user["roleCode"] not in ("moderator_t2", "admin"):
        return handler.send_json(403, {"error": "Hanya Moderator Tier 2/Admin yang boleh approve"})
    
    event = execute("SELECT * FROM events WHERE id = ?", (event_id,)).fetchone()
    if not event:
        return handler.send_json(404, {"error": "Event tidak ditemukan"})
    
    approved = bool(body.get("approved", False))
    status = "published" if approved else "draft"
    published_at = utc_now_iso() if approved else None
    
    execute("UPDATE events SET status = ?, published_at = COALESCE(published_at, ?), updated_at = ? WHERE id = ?",
            (status, published_at, utc_now_iso(), event_id))
    commit()
    return handler.send_json(200, {"success": True})


def complete_event(handler, body, client_ip, event_id):
    """Mark event as completed."""
    user = handler.get_current_user()
    if not user or not user["isKsh"]:
        return handler.send_json(403, {"error": "Hanya KSH yang bisa menandai selesai"})
    
    event = execute("SELECT * FROM events WHERE id = ?", (event_id,)).fetchone()
    if not event or event["status"] != "published":
        return handler.send_json(400, {"error": "Event harus published sebelum completed"})
    
    output_summary = str(body.get("outputSummary", "")).strip()
    if not output_summary:
        return handler.send_json(400, {"error": "Output summary wajib diisi"})
    
    now = utc_now_iso()
    execute("UPDATE events SET status = 'completed', output_summary = ?, completed_at = ?, completed_by_user_id = ?, updated_at = ? WHERE id = ?",
            (output_summary, now, user["id"], now, event_id))
    execute("UPDATE event_participation SET status = 'attended', updated_at = ? WHERE event_id = ?", (now, event_id))
    commit()
    return handler.send_json(200, {"success": True})


event_routes = {
    "GET": {"/events": get_events},
    "POST": {
        "/events": create_event,
        "/events/{id}/join": join_event,
        "/events/{id}/approval": approve_event,
        "/events/{id}/complete": complete_event,
    },
}


def _json(deps, handler, status, payload):
    deps["write_json"](handler, status, payload)
    return True


def _auth_header(handler):
    return handler.headers.get("Authorization")


def _actor(conn, handler, deps):
    return deps["user_from_token"](conn, _auth_header(handler))


def handle_get(handler, conn, path, query, deps):
    api_prefix = deps["API_PREFIX"]

    if path != f"{api_prefix}/events":
        return False

    actor = _actor(conn, handler, deps)
    if not actor:
        return _json(deps, handler, 401, {"error": "Unauthorized"})

    status_filter = query.get("status", [None])[0] if query else None
    sql = """
          SELECT events.*, kelurahan.name AS kelurahan, kecamatan.name AS kecamatan
          FROM events
          LEFT JOIN kelurahan ON kelurahan.id = events.kelurahan_id
          LEFT JOIN kecamatan ON kecamatan.id = events.kecamatan_id
          WHERE 1=1
        """
    params = []
    if status_filter:
        sql += " AND events.status = ?"
        params.append(status_filter)
    if actor["role_code"] in ("user", "ksh"):
        sql += " AND events.status IN ('published','completed')"
        sql += " AND ((events.scope_type = 'kelurahan' AND events.kelurahan_id = ?) OR (events.scope_type = 'kecamatan' AND events.kecamatan_id = ?))"
        params.append(actor["kelurahan_id"])
        params.append(actor["kecamatan_id"])
    elif actor and actor["is_ksh"]:
        sql += " AND ((events.scope_type = 'kelurahan' AND events.kelurahan_id = ?) OR (events.scope_type = 'kecamatan' AND events.kecamatan_id = ?))"
        params.append(actor["kelurahan_id"])
        params.append(actor["kecamatan_id"])
    sql += " ORDER BY events.event_date ASC"
    rows = conn.execute(sql, tuple(params)).fetchall()
    out = []
    for r in rows:
        participants = conn.execute("SELECT user_id FROM event_participation WHERE event_id = ?", (r["id"],)).fetchall()
        out.append(
            {
                "id": r["id"],
                "title": r["title"],
                "description": r["description"],
                "pillar": int(r["pillar"]),
                "date": r["event_date"],
                "time": r["event_time"],
                "location": r["location"],
                "quota": int(r["quota"]),
                "scopeType": r["scope_type"],
                "kecamatanId": r["kecamatan_id"],
                "kelurahanId": r["kelurahan_id"],
                "createdByUserId": r["created_by_user_id"],
                "status": r["status"],
                "kelurahan": r["kelurahan"],
                "kecamatan": r["kecamatan"],
                "participants": [p["user_id"] for p in participants],
            }
        )
    return _json(deps, handler, 200, {"events": out})


def handle_post(handler, conn, path, body, deps):
    api_prefix = deps["API_PREFIX"]

    if not path.startswith(f"{api_prefix}/events"):
        return False

    actor = _actor(conn, handler, deps)
    if not actor:
        return _json(deps, handler, 401, {"error": "Unauthorized"})

    if path == f"{api_prefix}/events":
        if not deps["can_create_event"](actor):
            return _json(deps, handler, 403, {"error": "Hanya ASN Tier 1/Admin yang boleh input kegiatan"})
        title = deps["bounded_text"](body.get("title", ""), 200)
        description = deps["bounded_text"](body.get("description", ""), 3000)
        time_text = deps["bounded_text"](body.get("time", ""), 16)
        location = deps["bounded_text"](body.get("location", ""), 220)
        date = str(body.get("date", "")).strip()
        scope_type = str(body.get("scopeType", "kelurahan")).strip().lower()
        if not title or not date:
            return _json(deps, handler, 400, {"error": "Judul dan tanggal wajib diisi"})
        if scope_type not in ("kelurahan", "kecamatan"):
            return _json(deps, handler, 400, {"error": "Skala kegiatan harus kelurahan atau kecamatan"})
        try:
            kecamatan_id = int(body.get("kecamatanId"))
        except Exception:
            return _json(deps, handler, 400, {"error": "Kecamatan wajib dipilih"})
        kelurahan_id = None
        if scope_type == "kelurahan":
            try:
                kelurahan_id = int(body.get("kelurahanId"))
            except Exception:
                return _json(deps, handler, 400, {"error": "Untuk skala kelurahan, kelurahan wajib dipilih"})
            check = conn.execute(
                "SELECT id FROM kelurahan WHERE id = ? AND kecamatan_id = ?",
                (kelurahan_id, kecamatan_id),
            ).fetchone()
            if not check:
                return _json(deps, handler, 400, {"error": "Kelurahan tidak cocok dengan kecamatan pilihan"})
        else:
            kec_exists = conn.execute("SELECT id FROM kecamatan WHERE id = ?", (kecamatan_id,)).fetchone()
            if not kec_exists:
                return _json(deps, handler, 400, {"error": "Kecamatan tidak ditemukan"})
        try:
            quota = int(body.get("quota", 0))
        except Exception:
            return _json(deps, handler, 400, {"error": "Kuota harus angka"})
        if quota < 0 or quota > 10000:
            return _json(deps, handler, 400, {"error": "Kuota harus 0-10000"})
        try:
            pillar = int(body.get("pillar", 1))
        except Exception:
            return _json(deps, handler, 400, {"error": "Pilar harus angka"})
        if pillar not in (1, 2, 3, 4):
            return _json(deps, handler, 400, {"error": "Pilar harus 1-4"})
        event_id = f"event-{uuid.uuid4().hex[:10]}"
        now = deps["utc_now_iso"]()
        deps["execute"](
            conn,
            """
          INSERT INTO events(
            id, title, description, pillar, event_date, event_time, location, quota,
            scope_type, kecamatan_id, kelurahan_id, created_by_user_id, status, created_at, updated_at
          )
          VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?, ?)
          """,
            (
                event_id,
                title,
                description,
                pillar,
                date,
                time_text,
                location,
                quota,
                scope_type,
                kecamatan_id,
                kelurahan_id,
                actor["id"],
                now,
                now,
            ),
        )
        return _json(deps, handler, 200, {"success": True, "event": {"id": event_id}})

    if path.endswith("/approval") and path.startswith(f"{api_prefix}/events/"):
        if not deps["can_approve_event"](actor):
            return _json(deps, handler, 403, {"error": "Hanya Moderator Tier 2/Admin yang boleh approve"})
        event_id = path.split("/")[-2]
        event = conn.execute("SELECT * FROM events WHERE id = ?", (event_id,)).fetchone()
        if not event:
            return _json(deps, handler, 404, {"error": "Event tidak ditemukan"})
        if event["status"] != "draft":
            return _json(deps, handler, 400, {"error": "Hanya event berstatus draft yang bisa di-review"})
        if actor["role_code"] == "moderator_t2":
            badge = (actor["tier2_badge"] or "").lower()
            if event["scope_type"] == "kelurahan":
                if badge != "lurah" or actor["kelurahan_id"] != event["kelurahan_id"]:
                    return _json(deps, handler, 403, {"error": "Draft skala kelurahan harus disetujui Lurah area terkait"})
            elif event["scope_type"] == "kecamatan":
                if badge != "camat" or actor["kecamatan_id"] != event["kecamatan_id"]:
                    return _json(deps, handler, 403, {"error": "Draft skala kecamatan harus disetujui Camat area terkait"})
        approved = bool(body.get("approved"))
        # PUBLISH GATE: approval hanya memberi status 'approved', bukan langsung 'published'.
        # Untuk publish ke publik, pengguna harus memanggil POST /events/:id/publish secara eksplisit.
        new_status = "approved" if approved else "draft"
        deps["execute"](
            conn,
            "UPDATE events SET status = ?, updated_at = ? WHERE id = ?",
            (new_status, deps["utc_now_iso"](), event_id),
        )
        deps["log_audit"](
            conn,
            actor["id"],
            "event.approve" if approved else "event.reject",
            "event",
            event_id,
            {"approved": approved, "newStatus": new_status},
        )
        notif_msg = (
            f"Kegiatan '{event['title']}' disetujui. Silakan publish agar terlihat oleh relawan."
            if approved
            else f"Kegiatan '{event['title']}' ditolak dan dikembalikan ke draft."
        )
        deps["create_notification"](
            conn,
            event["created_by_user_id"],
            "event.reviewed",
            "Status kegiatan diperbarui",
            notif_msg,
            "event",
            event_id,
        )
        return _json(deps, handler, 200, {"success": True, "status": new_status})

    if path.endswith("/publish") and path.startswith(f"{api_prefix}/events/"):
        # PUBLISH GATE: Endpoint eksplisit untuk transisi approved → published.
        # Hanya moderator_t2 (sesuai area) atau admin yang boleh publish.
        if not deps["can_approve_event"](actor):
            return _json(deps, handler, 403, {"error": "Hanya Moderator Tier 2/Admin yang boleh publish"})
        event_id = path.split("/")[-2]
        event = conn.execute("SELECT * FROM events WHERE id = ?", (event_id,)).fetchone()
        if not event:
            return _json(deps, handler, 404, {"error": "Event tidak ditemukan"})
        if event["status"] != "approved":
            return _json(deps, handler, 400, {"error": "Hanya event berstatus approved yang bisa dipublish"})
        if actor["role_code"] == "moderator_t2":
            badge = (actor["tier2_badge"] or "").lower()
            if event["scope_type"] == "kelurahan":
                if badge != "lurah" or actor["kelurahan_id"] != event["kelurahan_id"]:
                    return _json(deps, handler, 403, {"error": "Event skala kelurahan hanya bisa dipublish oleh Lurah area terkait"})
            elif event["scope_type"] == "kecamatan":
                if badge != "camat" or actor["kecamatan_id"] != event["kecamatan_id"]:
                    return _json(deps, handler, 403, {"error": "Event skala kecamatan hanya bisa dipublish oleh Camat area terkait"})
        now = deps["utc_now_iso"]()
        deps["execute"](
            conn,
            "UPDATE events SET status = 'published', published_at = ?, updated_at = ? WHERE id = ?",
            (now, now, event_id),
        )
        deps["log_audit"](
            conn,
            actor["id"],
            "event.publish",
            "event",
            event_id,
            {"publishedAt": now},
        )
        deps["create_notification"](
            conn,
            event["created_by_user_id"],
            "event.published",
            "Kegiatan dipublish",
            f"Kegiatan '{event['title']}' sudah dipublish dan terlihat oleh relawan.",
            "event",
            event_id,
        )
        return _json(deps, handler, 200, {"success": True, "status": "published"})

    if path.endswith("/join") and path.startswith(f"{api_prefix}/events/"):
        event_id = path.split("/")[-2]
        if actor["role_code"] not in ("user", "ksh"):
            return _json(deps, handler, 403, {"error": "Hanya relawan/KSH yang dapat mendaftar"})
        pending = conn.execute(
            """
          SELECT COUNT(*) AS c
          FROM event_participation ep
          JOIN events e ON e.id = ep.event_id
          WHERE ep.user_id = ? AND ep.status = 'attended' AND ep.checklist_done = 0 AND e.status = 'completed'
          """,
            (actor["id"],),
        ).fetchone()["c"]
        if pending > 0:
            return _json(deps, handler, 400, {"error": "Laporan event sebelumnya belum lengkap"})
        event = conn.execute("SELECT * FROM events WHERE id = ?", (event_id,)).fetchone()
        if not event or event["status"] != "published":
            return _json(deps, handler, 400, {"error": "Event belum dipublish"})
        if int(event["quota"]) > 0:
            count = conn.execute("SELECT COUNT(*) AS c FROM event_participation WHERE event_id = ?", (event_id,)).fetchone()["c"]
            if count >= int(event["quota"]):
                return _json(deps, handler, 400, {"error": "Kuota penuh"})
        deps["execute"](
            conn,
            """
          INSERT OR IGNORE INTO event_participation(event_id, user_id, status, checklist_done, created_at, updated_at)
          VALUES(?, ?, 'registered', 0, ?, ?)
          """,
            (event_id, actor["id"], deps["utc_now_iso"](), deps["utc_now_iso"]()),
        )
        return _json(deps, handler, 200, {"success": True})

    if path.endswith("/attendance") and path.startswith(f"{api_prefix}/events/"):
        event_id = path.split("/")[-2]
        if not actor["is_ksh"]:
            return _json(deps, handler, 403, {"error": "Hanya KSH yang bisa mengatur kehadiran"})
        event = conn.execute("SELECT * FROM events WHERE id = ?", (event_id,)).fetchone()
        if not event:
            return _json(deps, handler, 404, {"error": "Event tidak ditemukan"})
        if event["scope_type"] == "kelurahan" and event["kelurahan_id"] != actor["kelurahan_id"]:
            return _json(deps, handler, 403, {"error": "Event di luar kelurahan KSH"})
        if event["scope_type"] == "kecamatan" and event["kecamatan_id"] != actor["kecamatan_id"]:
            return _json(deps, handler, 403, {"error": "Event di luar kecamatan KSH"})
        if event["status"] not in ("published", "completed"):
            return _json(deps, handler, 400, {"error": "Checklist kehadiran hanya untuk event published/completed"})

        user_ids = body.get("userIds", [])
        if not isinstance(user_ids, list):
            return _json(deps, handler, 400, {"error": "userIds harus berbentuk array"})
        selected_ids = []
        seen = set()
        for item in user_ids:
            user_id = str(item).strip()
            if user_id and user_id not in seen:
                selected_ids.append(user_id)
                seen.add(user_id)

        registered_rows = conn.execute(
            "SELECT user_id FROM event_participation WHERE event_id = ?",
            (event_id,),
        ).fetchall()
        registered_ids = {row["user_id"] for row in registered_rows}
        invalid_ids = [uid for uid in selected_ids if uid not in registered_ids]
        if invalid_ids:
            return _json(deps, handler, 400, {"error": "Ada user yang bukan peserta event"})

        now = deps["utc_now_iso"]()
        deps["execute"](
            conn,
            "UPDATE event_participation SET status = 'registered', updated_at = ? WHERE event_id = ? AND status IN ('registered','attended')",
            (now, event_id),
        )
        if selected_ids:
            placeholders = ",".join(["?"] * len(selected_ids))
            deps["execute"](
                conn,
                f"UPDATE event_participation SET status = 'attended', updated_at = ? WHERE event_id = ? AND user_id IN ({placeholders}) AND status IN ('registered','attended')",
                tuple([now, event_id, *selected_ids]),
            )

        deps["log_audit"](
            conn,
            actor["id"],
            "event.attendance",
            "event",
            event_id,
            {"attendedUserIds": selected_ids, "attendedCount": len(selected_ids)},
        )
        return _json(deps, handler, 200, {"success": True, "attendedCount": len(selected_ids)})

    if path.endswith("/complete") and path.startswith(f"{api_prefix}/events/"):
        event_id = path.split("/")[-2]
        if not actor["is_ksh"]:
            return _json(deps, handler, 403, {"error": "Hanya KSH yang bisa menandai selesai"})
        event = conn.execute("SELECT * FROM events WHERE id = ?", (event_id,)).fetchone()
        if not event:
            return _json(deps, handler, 404, {"error": "Event tidak ditemukan"})
        if event["scope_type"] == "kelurahan" and event["kelurahan_id"] != actor["kelurahan_id"]:
            return _json(deps, handler, 403, {"error": "Event di luar kelurahan KSH"})
        if event["scope_type"] == "kecamatan" and event["kecamatan_id"] != actor["kecamatan_id"]:
            return _json(deps, handler, 403, {"error": "Event di luar kecamatan KSH"})
        if event["status"] != "published":
            return _json(deps, handler, 400, {"error": "Event harus published sebelum completed"})
        summary = str(body.get("outputSummary", "")).strip()
        if not summary:
            return _json(deps, handler, 400, {"error": "Output summary wajib diisi"})
        now = deps["utc_now_iso"]()
        deps["execute"](
            conn,
            """
          UPDATE events
          SET status = 'completed', output_summary = ?, completed_at = ?, completed_by_user_id = ?, updated_at = ?
          WHERE id = ?
          """,
            (summary, now, actor["id"], now, event_id),
        )
        deps["log_audit"](
            conn,
            actor["id"],
            "event.complete",
            "event",
            event_id,
            {"outputSummary": summary},
        )
        return _json(deps, handler, 200, {"success": True})

    return False


def handle_put(handler, conn, path, body, deps):
    api_prefix = deps["API_PREFIX"]

    if not (path.startswith(f"{api_prefix}/events/") and not path.endswith("/")):
        return False

    actor = _actor(conn, handler, deps)
    if not actor:
        return _json(deps, handler, 401, {"error": "Unauthorized"})

    event_id = path.split("/")[-1]
    event = conn.execute("SELECT * FROM events WHERE id = ?", (event_id,)).fetchone()
    if not event:
        return _json(deps, handler, 404, {"error": "Event tidak ditemukan"})
    if event["status"] != "draft":
        return _json(deps, handler, 400, {"error": "Hanya event draft yang bisa diedit"})
    if event["created_by_user_id"] != actor["id"] and actor["role_code"] != "admin":
        return _json(deps, handler, 403, {"error": "Hanya pembuat event yang bisa edit"})

    title = deps["bounded_text"](body.get("title", event["title"]), 200)
    description = deps["bounded_text"](body.get("description", event["description"] or ""), 3000)
    date = str(body.get("date", event["event_date"])).strip()
    event_time = deps["bounded_text"](body.get("time", event["event_time"] or ""), 16)
    location = deps["bounded_text"](body.get("location", event["location"] or ""), 220)
    scope_type = str(body.get("scopeType", event["scope_type"])).strip().lower()
    if not title or not date:
        return _json(deps, handler, 400, {"error": "Judul dan tanggal wajib diisi"})
    if scope_type not in ("kelurahan", "kecamatan"):
        return _json(deps, handler, 400, {"error": "Skala kegiatan harus kelurahan atau kecamatan"})

    if "pillar" in body:
        try:
            pillar = int(body.get("pillar", event["pillar"]))
        except Exception:
            return _json(deps, handler, 400, {"error": "Pilar harus angka"})
    else:
        pillar = int(event["pillar"])
    if pillar not in (1, 2, 3, 4):
        return _json(deps, handler, 400, {"error": "Pilar harus 1-4"})

    if "quota" in body:
        try:
            quota = int(body.get("quota", event["quota"]))
        except Exception:
            return _json(deps, handler, 400, {"error": "Kuota harus angka"})
    else:
        quota = int(event["quota"])
    if quota < 0 or quota > 10000:
        return _json(deps, handler, 400, {"error": "Kuota harus 0-10000"})

    if "kecamatanId" in body:
        try:
            kecamatan_id = int(body.get("kecamatanId"))
        except Exception:
            return _json(deps, handler, 400, {"error": "Kecamatan wajib dipilih"})
    else:
        kecamatan_id = int(event["kecamatan_id"])

    if scope_type == "kelurahan":
        if "kelurahanId" in body:
            try:
                kelurahan_id = int(body.get("kelurahanId"))
            except Exception:
                return _json(deps, handler, 400, {"error": "Untuk skala kelurahan, kelurahan wajib dipilih"})
        else:
            if event["kelurahan_id"] is None:
                return _json(deps, handler, 400, {"error": "Untuk skala kelurahan, kelurahan wajib dipilih"})
            kelurahan_id = int(event["kelurahan_id"])
        check = conn.execute(
            "SELECT id FROM kelurahan WHERE id = ? AND kecamatan_id = ?",
            (kelurahan_id, kecamatan_id),
        ).fetchone()
        if not check:
            return _json(deps, handler, 400, {"error": "Kelurahan tidak cocok dengan kecamatan pilihan"})
    else:
        kelurahan_id = None
        kec_exists = conn.execute("SELECT id FROM kecamatan WHERE id = ?", (kecamatan_id,)).fetchone()
        if not kec_exists:
            return _json(deps, handler, 400, {"error": "Kecamatan tidak ditemukan"})

    now = deps["utc_now_iso"]()
    deps["execute"](
        conn,
        """
          UPDATE events
          SET title = ?, description = ?, pillar = ?, event_date = ?, event_time = ?, location = ?,
              quota = ?, scope_type = ?, kecamatan_id = ?, kelurahan_id = ?, updated_at = ?
          WHERE id = ?
          """,
        (
            title,
            description,
            pillar,
            date,
            event_time,
            location,
            quota,
            scope_type,
            kecamatan_id,
            kelurahan_id,
            now,
            event_id,
        ),
    )
    deps["log_audit"](
        conn,
        actor["id"],
        "event.edit",
        "event",
        event_id,
        {
            "title": title,
            "scopeType": scope_type,
            "kecamatanId": kecamatan_id,
            "kelurahanId": kelurahan_id,
        },
    )
    return _json(deps, handler, 200, {"success": True, "event": {"id": event_id}})


event_routes_modular = {
    "GET": ("/events",),
    "POST": ("/events", "/events/{id}/approval", "/events/{id}/publish", "/events/{id}/join", "/events/{id}/attendance", "/events/{id}/complete"),
    "PUT": ("/events/{id}",),
}
