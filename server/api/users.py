"""
api/users.py — Handler untuk endpoint /users/*, /recommendations,
               /health, dan /landing/leaderboard.
"""


def handle_get(handler, conn, path, query, deps):
    """
    Menangani GET request untuk rute users, health, leaderboard, recommendations.
    Kembalikan True jika rute cocok dan sudah ditangani, False jika tidak cocok.
    """
    API_PREFIX = deps["API_PREFIX"]
    write_json = deps["write_json"]
    user_from_token = deps["user_from_token"]
    get_user_payload = deps["get_user_payload"]
    bounded_text = deps["bounded_text"]
    parse_pagination = deps["parse_pagination"]
    pagination_payload = deps["pagination_payload"]

    # GET /health
    if path == f"{API_PREFIX}/health":
        write_json(handler, 200, {"status": "ok"})
        return True

    # GET /landing/leaderboard — public endpoint, no auth required
    if path == f"{API_PREFIX}/landing/leaderboard":
        rows = conn.execute(
            """
            SELECT kelurahan.name AS kelurahan, kecamatan.name AS kecamatan, xp_kelurahan.total_xp AS xp
            FROM xp_kelurahan
            JOIN kelurahan ON kelurahan.id = xp_kelurahan.kelurahan_id
            JOIN kecamatan ON kecamatan.id = kelurahan.kecamatan_id
            WHERE EXISTS (
              SELECT 1 FROM kampung_mapping WHERE kampung_mapping.kelurahan_id = kelurahan.id
            )
            ORDER BY xp_kelurahan.total_xp DESC, kelurahan.name ASC
            LIMIT 7
            """
        ).fetchall()
        entries = [
            {
                "rank": idx + 1,
                "kelurahan": row["kelurahan"],
                "kecamatan": row["kecamatan"],
                "xp": int(row["xp"]),
            }
            for idx, row in enumerate(rows)
        ]
        write_json(handler, 200, {"leaderboard": entries})
        return True

    # GET /users/me/participations — riwayat partisipasi user yang sedang login
    if path == f"{API_PREFIX}/users/me/participations":
        actor = user_from_token(conn, handler.headers.get("Authorization"))
        if not actor:
            write_json(handler, 401, {"error": "Unauthorized"})
            return True
        try:
            limit, offset = parse_pagination(query, default_limit=100, max_limit=500)
        except ValueError as exc:
            write_json(handler, 400, {"error": str(exc)})
            return True
        total = conn.execute(
            "SELECT COUNT(*) AS c FROM event_participation WHERE user_id = ?",
            (actor["id"],),
        ).fetchone()["c"]
        rows = conn.execute(
            """
            SELECT
              ep.event_id,
              ep.status AS participation_status,
              ep.checklist_done,
              ep.created_at AS joined_at,
              ep.updated_at AS participation_updated_at,
              e.title AS event_title,
              e.event_date AS event_date,
              e.status AS event_status,
              er.id AS report_id,
              er.status AS report_status
            FROM event_participation ep
            JOIN events e ON e.id = ep.event_id
            LEFT JOIN event_reports er ON er.event_id = ep.event_id AND er.user_id = ep.user_id
            WHERE ep.user_id = ?
            ORDER BY e.event_date DESC, ep.created_at DESC
            LIMIT ? OFFSET ?
            """,
            (actor["id"], limit, offset),
        ).fetchall()
        participations = [
            {
                "eventId": row["event_id"],
                "eventTitle": row["event_title"],
                "eventDate": row["event_date"],
                "eventStatus": row["event_status"],
                "status": row["participation_status"],
                "checklistDone": bool(row["checklist_done"]),
                "joinedAt": row["joined_at"],
                "updatedAt": row["participation_updated_at"],
                "reported": row["report_id"] is not None,
                "reportId": row["report_id"],
                "reportStatus": row["report_status"],
            }
            for row in rows
        ]
        write_json(handler, 200, {"participations": participations, "pagination": pagination_payload(total, limit, offset)})
        return True

    # GET /users — daftar semua pengguna (requires auth)
    if path == f"{API_PREFIX}/users":
        actor = user_from_token(conn, handler.headers.get("Authorization"))
        if not actor:
            write_json(handler, 401, {"error": "Unauthorized"})
            return True
        role_code = str(actor["role_code"])
        role_filter = query.get("role", [None])[0]
        kampung_filter = query.get("kampungId", [None])[0]
        try:
            search_filter = bounded_text(query.get("q", [""])[0], 120)
            limit, offset = parse_pagination(query, default_limit=100, max_limit=500)
        except ValueError as exc:
            write_json(handler, 400, {"error": str(exc)})
            return True
        sql = """
          SELECT users.*, kelurahan.name AS kel_name, kecamatan.name AS kec_name
          FROM users
          LEFT JOIN kelurahan ON kelurahan.id = users.kelurahan_id
          LEFT JOIN kecamatan ON kecamatan.id = users.kecamatan_id
          WHERE 1=1
        """
        params = []
        if role_code == "user":
            sql += " AND users.id = ?"
            params.append(actor["id"])
        elif role_code == "ksh":
            sql += " AND users.kelurahan_id = ? AND users.role_code IN ('user','ksh')"
            params.append(actor["kelurahan_id"])
        elif role_code == "moderator_t1":
            sql += " AND users.kelurahan_id = ? AND users.role_code IN ('user','ksh')"
            params.append(actor["kelurahan_id"])
        elif role_code == "moderator_t2":
            badge = str(actor["tier2_badge"] or "").strip().lower()
            if badge == "lurah":
                sql += " AND users.kelurahan_id = ? AND users.role_code IN ('user','ksh')"
                params.append(actor["kelurahan_id"])
            elif badge == "camat":
                sql += " AND users.kecamatan_id = ? AND users.role_code IN ('user','ksh')"
                params.append(actor["kecamatan_id"])
            else:
                sql += " AND 1=0"
        elif role_code == "moderator_t3":
            sql += " AND users.role_code IN ('user','ksh')"
        elif role_code != "admin":
            sql += " AND 1=0"
        if role_filter == "user" and role_code == "admin":
            sql += " AND users.role_code IN ('user','ksh')"
        if kampung_filter and role_code == "admin":
            try:
                kampung_id = int(kampung_filter)
            except Exception:
                write_json(handler, 400, {"error": "kampungId tidak valid"})
                return True
            sql += " AND users.kelurahan_id = ?"
            params.append(kampung_id)
        if search_filter and role_code == "admin":
            sql += " AND (users.name LIKE ? OR users.email LIKE ?)"
            like = f"%{search_filter}%"
            params.extend([like, like])
        total = conn.execute(f"SELECT COUNT(*) AS c FROM ({sql}) AS filtered_users", tuple(params)).fetchone()["c"]
        sql += " ORDER BY users.name ASC LIMIT ? OFFSET ?"
        rows = conn.execute(sql, tuple([*params, limit, offset])).fetchall()
        users = []
        for r in rows:
            users.append(
                {
                    "id": r["id"],
                    "name": r["name"],
                    "email": r["email"],
                    "role": "admin" if r["role_code"] == "admin" else ("moderator" if str(r["role_code"]).startswith("moderator_t") else "user"),
                    "roleCode": r["role_code"],
                    "isKsh": bool(r["is_ksh"]),
                    "moderatorTier": r["moderator_tier"],
                    "tier2Badge": r["tier2_badge"],
                    "kecamatan": r["kec_name"],
                    "kelurahan": r["kel_name"],
                    "kampungId": r["kelurahan_id"],
                    "points": max(0, int(r["points"])),
                }
            )
        write_json(handler, 200, {"users": users, "pagination": pagination_payload(total, limit, offset)})
        return True

    # GET /recommendations — stub, off-system
    if path == f"{API_PREFIX}/recommendations":
        write_json(handler, 410, {"error": "ASN recommendation is off-system"})
        return True

    return False


def handle_post(handler, conn, path, body, deps):
    """
    Menangani POST request untuk rute users dan recommendations.
    Kembalikan True jika rute cocok dan sudah ditangani, False jika tidak cocok.
    """
    API_PREFIX = deps["API_PREFIX"]
    write_json = deps["write_json"]

    # POST /recommendations — stub, off-system
    if path == f"{API_PREFIX}/recommendations":
        write_json(handler, 410, {"error": "ASN recommendation is off-system"})
        return True

    return False


def handle_put(handler, conn, path, body, actor, deps):
    """
    Menangani PUT request untuk rute /users/:id.
    Kembalikan True jika rute cocok dan sudah ditangani, False jika tidak cocok.

    Catatan: `actor` sudah divalidasi di main.py sebelum memanggil handler ini.
    """
    API_PREFIX = deps["API_PREFIX"]
    write_json = deps["write_json"]
    execute = deps["execute"]
    bounded_text = deps["bounded_text"]
    utc_now_iso = deps["utc_now_iso"]
    get_user_payload = deps["get_user_payload"]

    if path.startswith(f"{API_PREFIX}/users/"):
        user_id = path.split("/")[-1]
        if actor["id"] != user_id and actor["role_code"] != "admin":
            write_json(handler, 403, {"error": "Forbidden"})
            return True
        fields = []
        params = []
        for key in ("name", "rw", "nik"):
            if key in body and body[key] is not None:
                fields.append(f"{key} = ?")
                max_len = 120 if key == "name" else (16 if key == "rw" else 32)
                params.append(bounded_text(body[key], max_len))
        if not fields:
            write_json(handler, 400, {"error": "No fields"})
            return True
        fields.append("updated_at = ?")
        params.append(utc_now_iso())
        params.append(user_id)
        updated = execute(conn, f"UPDATE users SET {', '.join(fields)} WHERE id = ?", tuple(params)).rowcount
        if updated == 0:
            write_json(handler, 404, {"error": "User tidak ditemukan"})
            return True
        row = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
        if not row:
            write_json(handler, 404, {"error": "User tidak ditemukan"})
            return True
        write_json(handler, 200, {"success": True, "user": get_user_payload(conn, row)})
        return True

    return False
