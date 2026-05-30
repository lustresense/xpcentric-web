"""
SIMRP Collaboration Module
Collaboration request management.
"""
import uuid

from core import execute, commit, generate_entity_id, utc_now_iso, VALID_SUPPORT_TYPES, VALID_CONTRIBUTION_SCOPES


def get_collaboration_requests(handler, body, client_ip, query_params=None):
    """Get all collaboration requests."""
    user = handler.get_current_user()
    if not user or user["roleCode"] not in ("moderator_t2", "admin"):
        return handler.send_json(403, {"error": "Hanya Moderator Tier 2/Admin"})
    
    status_filter = query_params.get("status", [None])[0] if query_params else None
    sql = "SELECT * FROM collaboration_requests WHERE 1=1"
    params = []
    
    if status_filter in ("pending", "approved", "rejected"):
        sql += " AND status = ?"
        params.append(status_filter)
    sql += " ORDER BY created_at DESC"
    
    rows = execute(sql, tuple(params)).fetchall()
    requests = [dict(r) for r in rows]
    return handler.send_json(200, {"requests": requests})


def create_collaboration_request(handler, body, client_ip):
    """Create new collaboration request."""
    required = ["organizationName", "picName", "email", "supportType", "supportDescription"]
    for field in required:
        if not body.get(field):
            return handler.send_json(400, {"error": f"{field} wajib diisi"})
    
    support_type = str(body.get("supportType")).strip().lower()
    if support_type not in VALID_SUPPORT_TYPES:
        return handler.send_json(400, {"error": "Jenis dukungan tidak valid"})
    
    contribution_scope = str(body.get("contributionScope", "kota")).strip().lower()
    if contribution_scope not in VALID_CONTRIBUTION_SCOPES:
        return handler.send_json(400, {"error": "Skala kontribusi tidak valid"})
    
    request_id = generate_entity_id("collab")
    now = utc_now_iso()
    
    execute(
        """INSERT INTO collaboration_requests(id, organization_name, pic_name, email, support_type, contribution_scope, support_description, status, reviewed_by_user_id, reviewed_at, created_at, updated_at)
           VALUES(?, ?, ?, ?, ?, ?, ?, 'pending', NULL, NULL, ?, ?)""",
        (request_id, body.get("organizationName"), body.get("picName"), body.get("email"), 
         support_type, contribution_scope, body.get("supportDescription"), now, now)
    )
    commit()
    return handler.send_json(200, {"success": True, "request": {"id": request_id}})


def review_collaboration_request(handler, body, client_ip, request_id):
    """Review (approve/reject) collaboration request."""
    user = handler.get_current_user()
    if not user or user["roleCode"] not in ("moderator_t2", "admin"):
        return handler.send_json(403, {"error": "Hanya Moderator Tier 2/Admin yang boleh approve"})
    
    request = execute("SELECT id, status FROM collaboration_requests WHERE id = ?", (request_id,)).fetchone()
    if not request:
        return handler.send_json(404, {"error": "Permintaan tidak ditemukan"})
    if request["status"] != "pending":
        return handler.send_json(400, {"error": "Permintaan sudah diproses"})
    
    approved = bool(body.get("approved", False))
    now = utc_now_iso()
    
    execute("UPDATE collaboration_requests SET status = ?, reviewed_by_user_id = ?, reviewed_at = ?, updated_at = ? WHERE id = ?",
            ("approved" if approved else "rejected", user["id"], now, now, request_id))
    commit()
    return handler.send_json(200, {"success": True})


collaboration_routes = {
    "GET": {"/collaboration-requests": get_collaboration_requests},
    "POST": {"/collaboration-requests": create_collaboration_request, "/collaboration-requests/{id}/approval": review_collaboration_request},
}


def _json(deps, handler, status, payload):
    deps["write_json"](handler, status, payload)
    return True


def _auth_header(handler):
    return handler.headers.get("Authorization")


def _actor(conn, handler, deps):
    return deps["user_from_token"](conn, _auth_header(handler))


def _collaboration_scope_clause(actor):
    if actor["role_code"] == "admin":
        return "", []
    if actor["role_code"] != "moderator_t2":
        return " AND 1=0", []
    badge = str(actor["tier2_badge"] or "").strip().lower()
    if badge == "lurah":
        return (
            " AND collaboration_requests.contribution_scope = 'kelurahan'"
            " AND collaboration_requests.scope_kelurahan_id = ?",
            [actor["kelurahan_id"]],
        )
    if badge == "camat":
        return (
            " AND collaboration_requests.contribution_scope IN ('kecamatan','kelurahan')"
            " AND collaboration_requests.scope_kecamatan_id = ?",
            [actor["kecamatan_id"]],
        )
    return " AND 1=0", []


def _can_review_collaboration(actor, row):
    if actor["role_code"] == "admin":
        return True
    if actor["role_code"] != "moderator_t2":
        return False
    badge = str(actor["tier2_badge"] or "").strip().lower()
    scope = row["contribution_scope"] or "kota"
    if badge == "lurah":
        return scope == "kelurahan" and row["scope_kelurahan_id"] == actor["kelurahan_id"]
    if badge == "camat":
        return scope in ("kecamatan", "kelurahan") and row["scope_kecamatan_id"] == actor["kecamatan_id"]
    return False


def _send_approval_email_stub(row, approved):
    """
    Stub pengiriman email ke mitra saat permintaan kolaborasi di-approve/reject.

    Production TODO: Ganti blok print ini dengan SMTP call yang sesungguhnya.
    Contoh integrasi:
      - SMTP native: smtplib.SMTP_SSL dengan kredensial dari env (SIMRP_SMTP_HOST, dll.)
      - Transactional email: SendGrid / Mailgun / AWS SES SDK

    Konfigurasi WAJIB via environment variable (bukan hardcode) sesuai .ai_rules 2.3:
      SIMRP_SMTP_HOST, SIMRP_SMTP_PORT, SIMRP_SMTP_USER, SIMRP_SMTP_PASSWORD,
      SIMRP_EMAIL_FROM, SIMRP_EMAIL_REPLY_TO

    Payload email yang akan dikirim:
    """
    import os
    status_text = "disetujui" if approved else "ditolak"
    subject = f"[SIMRP] Permintaan Kolaborasi {status_text.capitalize()} — {row['organization_name']}"
    body_text = (
        f"Yth. {row['pic_name']},\n\n"
        f"Permintaan kolaborasi dari {row['organization_name']} telah {status_text} "
        f"oleh tim SIMRP.\n\n"
        f"Jenis dukungan: {row['support_type']}\n"
        f"Deskripsi: {row['support_description'][:200]}\n\n"
        f"Terima kasih atas partisipasi dan dukungan Anda.\n\n"
        f"Salam,\nTim SIMRP — Pemerintah Kota Surabaya"
    )
    email_payload = {
        "to": row["email"],
        "subject": subject,
        "body": body_text,
        "smtp_host": os.environ.get("SIMRP_SMTP_HOST", "[not configured]"),
        "from": os.environ.get("SIMRP_EMAIL_FROM", "noreply@simrp.surabaya.go.id"),
    }
    # Stub: log ke stdout. Ganti dengan SMTP call di production.
    smtp_status = "configured" if os.environ.get("SIMRP_SMTP_HOST") else "not-configured"
    print(f"[EMAIL STUB] Approval email skipped/simulated "
          f"(subject: {email_payload['subject']}, smtp: {smtp_status})")
    return email_payload


def handle_get(handler, conn, path, query, deps):
    api_prefix = deps["API_PREFIX"]

    if path != f"{api_prefix}/collaboration-requests":
        return False

    actor = _actor(conn, handler, deps)
    if not actor:
        return _json(deps, handler, 401, {"error": "Unauthorized"})
    if actor["role_code"] not in ("moderator_t2", "admin"):
        return _json(deps, handler, 403, {"error": "Hanya Moderator Tier 2/Admin"})

    status_filter = query.get("status", [None])[0] if query else None
    sql = """
          SELECT
            collaboration_requests.*,
            users.name AS reviewer_name,
            kecamatan.name AS scope_kecamatan_name,
            kelurahan.name AS scope_kelurahan_name
          FROM collaboration_requests
          LEFT JOIN users ON users.id = collaboration_requests.reviewed_by_user_id
          LEFT JOIN kecamatan ON kecamatan.id = collaboration_requests.scope_kecamatan_id
          LEFT JOIN kelurahan ON kelurahan.id = collaboration_requests.scope_kelurahan_id
          WHERE 1=1
        """
    params = []
    if status_filter in ("pending", "approved", "rejected"):
        sql += " AND collaboration_requests.status = ?"
        params.append(status_filter)
    scope_sql, scope_params = _collaboration_scope_clause(actor)
    sql += scope_sql
    params.extend(scope_params)
    sql += " ORDER BY collaboration_requests.created_at DESC"
    rows = conn.execute(sql, tuple(params)).fetchall()
    requests = []
    for row in rows:
        requests.append(
            {
                "id": row["id"],
                "organizationName": row["organization_name"],
                "picName": row["pic_name"],
                "email": row["email"],
                "supportType": row["support_type"],
                "contributionScope": row["contribution_scope"] or "kota",
                "scopeKecamatanId": row["scope_kecamatan_id"],
                "scopeKelurahanId": row["scope_kelurahan_id"],
                "scopeKecamatanName": row["scope_kecamatan_name"],
                "scopeKelurahanName": row["scope_kelurahan_name"],
                "supportDescription": row["support_description"],
                "status": row["status"],
                "reviewedByName": row["reviewer_name"],
                "reviewedAt": row["reviewed_at"],
                "createdAt": row["created_at"],
            }
        )
    return _json(deps, handler, 200, {"requests": requests})


def handle_post(handler, conn, path, body, deps):
    api_prefix = deps["API_PREFIX"]

    if not path.startswith(f"{api_prefix}/collaboration-requests"):
        return False

    if path == f"{api_prefix}/collaboration-requests":
        submitter = _actor(conn, handler, deps)
        organization_name = deps["bounded_text"](body.get("organizationName", ""), 180)
        pic_name = deps["bounded_text"](body.get("picName", ""), 120)
        email = str(body.get("email", "")).strip().lower()
        support_type = str(body.get("supportType", "")).strip().lower()
        contribution_scope = str(body.get("contributionScope", "kota")).strip().lower()
        support_description = deps["bounded_text"](body.get("supportDescription", ""), 2000)
        if not organization_name or not pic_name or not email or not support_type or not support_description:
            return _json(deps, handler, 400, {"error": "Semua field kolaborasi wajib diisi"})
        if support_type not in ("dana", "konsumsi", "peralatan", "media_partner", "lainnya"):
            return _json(deps, handler, 400, {"error": "Jenis dukungan tidak valid"})
        if contribution_scope not in ("kota", "kecamatan", "kelurahan"):
            return _json(deps, handler, 400, {"error": "Skala kontribusi tidak valid"})
        if not deps["valid_email"](email):
            return _json(deps, handler, 400, {"error": "Format email tidak valid"})
        scope_kecamatan_id = None
        scope_kelurahan_id = None
        if contribution_scope in ("kecamatan", "kelurahan"):
            try:
                scope_kecamatan_id = int(body.get("kecamatanId"))
            except Exception:
                return _json(deps, handler, 400, {"error": "Kecamatan wajib dipilih untuk skala ini"})
            kec = conn.execute("SELECT id FROM kecamatan WHERE id = ?", (scope_kecamatan_id,)).fetchone()
            if not kec:
                return _json(deps, handler, 400, {"error": "Kecamatan tidak ditemukan"})
        if contribution_scope == "kelurahan":
            try:
                scope_kelurahan_id = int(body.get("kelurahanId"))
            except Exception:
                return _json(deps, handler, 400, {"error": "Kelurahan wajib dipilih untuk skala kelurahan"})
            kel = conn.execute(
                "SELECT id FROM kelurahan WHERE id = ? AND kecamatan_id = ?",
                (scope_kelurahan_id, scope_kecamatan_id),
            ).fetchone()
            if not kel:
                return _json(deps, handler, 400, {"error": "Kelurahan tidak sesuai kecamatan pilihan"})
        req_id = f"collab-{uuid.uuid4().hex[:10]}"
        now = deps["utc_now_iso"]()
        deps["execute"](
            conn,
            """
          INSERT INTO collaboration_requests(
            id, organization_name, pic_name, email, support_type, contribution_scope,
            scope_kecamatan_id, scope_kelurahan_id, support_description,
            submitted_by_user_id, status, reviewed_by_user_id, reviewed_at, created_at, updated_at
          )
          VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', NULL, NULL, ?, ?)
          """,
            (
                req_id,
                organization_name,
                pic_name,
                email,
                support_type,
                contribution_scope,
                scope_kecamatan_id,
                scope_kelurahan_id,
                support_description,
                submitter["id"] if submitter else None,
                now,
                now,
            ),
        )
        return _json(deps, handler, 200, {"success": True, "request": {"id": req_id}})

    if path.endswith("/approval") and path.startswith(f"{api_prefix}/collaboration-requests/"):
        actor = _actor(conn, handler, deps)
        if not actor:
            return _json(deps, handler, 401, {"error": "Unauthorized"})
        if actor["role_code"] not in ("moderator_t2", "admin"):
            return _json(deps, handler, 403, {"error": "Hanya Moderator Tier 2/Admin yang boleh approve"})
        req_id = path.split("/")[-2]
        row = conn.execute(
            """
            SELECT id, status, organization_name, submitted_by_user_id,
                   email, pic_name, support_type, support_description,
                   contribution_scope, scope_kecamatan_id, scope_kelurahan_id
            FROM collaboration_requests WHERE id = ?
            """,
            (req_id,),
        ).fetchone()
        if not row:
            return _json(deps, handler, 404, {"error": "Permintaan tidak ditemukan"})
        if not _can_review_collaboration(actor, row):
            return _json(deps, handler, 403, {"error": "Permintaan kolaborasi di luar kewenangan wilayah"})
        if row["status"] != "pending":
            return _json(deps, handler, 400, {"error": "Permintaan sudah diproses"})
        approved = bool(body.get("approved"))
        now = deps["utc_now_iso"]()
        deps["execute"](
            conn,
            """
          UPDATE collaboration_requests
          SET status = ?, reviewed_by_user_id = ?, reviewed_at = ?, updated_at = ?
          WHERE id = ?
          """,
            ("approved" if approved else "rejected", actor["id"], now, now, req_id),
        )
        deps["log_audit"](
            conn,
            actor["id"],
            "collab.approve" if approved else "collab.reject",
            "collaboration_request",
            req_id,
            {"approved": approved},
        )
        # EMAIL MITRA STUB: kirim notifikasi email ke PIC organisasi mitra.
        # Stub ini aman dijalankan — tidak throw exception jika SMTP belum dikonfigurasi.
        try:
            _send_approval_email_stub(row, approved)
        except Exception as email_err:
            # Fail gracefully: email gagal tidak boleh rollback transaksi approval
            print(f"[EMAIL STUB] Error sending email to {row.get('email', '?')}: {email_err}")
        if row["submitted_by_user_id"]:
            deps["create_notification"](
                conn,
                row["submitted_by_user_id"],
                "collaboration.reviewed",
                "Permintaan kolaborasi diproses",
                f"Permintaan dari {row['organization_name']} {'disetujui' if approved else 'ditolak'}.",
                "collaboration_request",
                req_id,
            )
        return _json(deps, handler, 200, {"success": True})

    return False
