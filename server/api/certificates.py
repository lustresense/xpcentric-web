"""
SIMRP Certificates Module.

Handles certificate listing, verification, and HTML download for printing as PDF.
"""
import html as html_mod
import re


def _json(deps, handler, status, payload):
  deps["write_json"](handler, status, payload)
  return True


def _auth_header(handler):
  return handler.headers.get("Authorization")


def _actor(conn, handler, deps):
  return deps["user_from_token"](conn, _auth_header(handler))


def _send_html_download(handler, filename, html_bytes, deps):
  """Kirim response berupa file HTML yang bisa didownload / dicetak sebagai PDF."""
  handler.send_response(200)
  handler.send_header("Content-Type", "text/html; charset=utf-8")
  handler.send_header("Content-Disposition", f'attachment; filename="{filename}"')
  handler.send_header("Content-Length", str(len(html_bytes)))
  deps["add_common_headers"](handler)
  handler.send_header("Access-Control-Expose-Headers", "Content-Disposition")
  handler.end_headers()
  handler.wfile.write(html_bytes)


def _safe_download_filename(value):
  cleaned = re.sub(r"[^A-Za-z0-9._ -]+", "-", str(value)).strip(" .-")
  return cleaned or "sertifikat-simrp"


def _generate_certificate_html(cert):
  """
  Generate HTML sertifikat yang bisa dicetak sebagai PDF dari browser.
  Semua nilai di-escape agar aman dari XSS.
  """
  e = html_mod.escape  # shorthand

  user_name   = e(cert["user_name"])
  event_title = e(cert["event_title"])
  event_date  = e(str(cert["event_date"]))
  issued_at   = e(str(cert["issued_at"])[:10])  # YYYY-MM-DD
  cert_id     = e(cert["id"])
  cert_hash   = e(cert["certificate_hash"])

  return f"""<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sertifikat SIMRP &mdash; {user_name}</title>
  <style>
    * {{ box-sizing: border-box; margin: 0; padding: 0; }}
    body {{
      font-family: Arial, Helvetica, sans-serif;
      background: #f8f5f0;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      padding: 32px;
    }}
    .cert-wrapper {{ width: 800px; max-width: 100%; }}
    .cert {{
      background: #fff;
      border: 3px solid #2d5a27;
      border-radius: 8px;
      padding: 56px 64px;
      text-align: center;
      box-shadow: 0 8px 40px rgba(0,0,0,0.12);
      position: relative;
    }}
    .cert::before {{
      content: '';
      position: absolute;
      inset: 10px;
      border: 1px solid #b8d4b5;
      border-radius: 4px;
      pointer-events: none;
    }}
    .logo-area {{
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      margin-bottom: 28px;
    }}
    .logo-icon {{
      width: 48px; height: 48px;
      background: #2d5a27;
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
    }}
    .logo-icon svg {{ fill: #fff; width: 28px; height: 28px; }}
    .logo-text {{ text-align: left; line-height: 1.2; }}
    .logo-text .org {{ font-size: 11px; color: #777; letter-spacing: 1px; text-transform: uppercase; }}
    .logo-text .name {{ font-size: 18px; font-weight: 700; color: #2d5a27; }}
    .divider {{ border: none; border-top: 2px solid #2d5a27; margin: 20px auto; width: 80px; }}
    .cert-label {{ font-size: 11px; letter-spacing: 3px; text-transform: uppercase; color: #888; margin-bottom: 8px; }}
    .cert-title {{ font-family: Georgia, 'Times New Roman', serif; font-size: 36px; font-weight: 700; color: #1a3a17; margin-bottom: 24px; }}
    .awarded-to {{ font-size: 13px; color: #666; margin-bottom: 10px; letter-spacing: 1px; text-transform: uppercase; }}
    .recipient {{
      font-family: Georgia, 'Times New Roman', serif;
      font-size: 32px; color: #2d5a27;
      border-bottom: 2px solid #e0e0e0;
      display: inline-block; padding-bottom: 8px; margin-bottom: 24px; min-width: 300px;
    }}
    .event-desc {{ font-size: 13px; color: #555; margin-bottom: 6px; }}
    .event-name {{ font-size: 18px; font-weight: 600; color: #1a3a17; margin-bottom: 4px; }}
    .event-date {{ font-size: 13px; color: #888; margin-bottom: 32px; }}
    .seal-area {{
      margin: 24px 0;
      display: flex; justify-content: center; align-items: center; gap: 40px;
    }}
    .seal {{
      width: 80px; height: 80px; border-radius: 50%;
      background: radial-gradient(circle, #2d5a27 60%, #1a3a17 100%);
      display: flex; align-items: center; justify-content: center; flex-direction: column;
      color: #fff; font-size: 9px; letter-spacing: 1px; font-weight: 600; text-transform: uppercase;
      box-shadow: 0 4px 16px rgba(45,90,39,0.3);
    }}
    .seal .seal-check {{ font-size: 24px; margin-bottom: 2px; }}
    .meta-box {{
      background: #f5f9f5; border: 1px solid #d0e8cd; border-radius: 6px;
      padding: 12px 20px; margin-top: 28px; text-align: left;
    }}
    .meta-row {{
      display: flex; justify-content: space-between;
      font-size: 11px; color: #777; padding: 3px 0;
    }}
    .meta-row span:last-child {{ font-family: monospace; font-size: 10px; color: #555; }}
    .print-note {{ margin-top: 20px; font-size: 11px; color: #aaa; }}
    @media print {{
      body {{ background: #fff; padding: 0; }}
      .print-note {{ display: none; }}
    }}
  </style>
</head>
<body>
  <div class="cert-wrapper">
    <div class="cert">
      <div class="logo-area">
        <div class="logo-icon">
          <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14l-4-4 1.41-1.41L10 13.17l6.59-6.59L18 8l-8 8z"/>
          </svg>
        </div>
        <div class="logo-text">
          <div class="org">Pemerintah Kota Surabaya</div>
          <div class="name">SIMRP</div>
        </div>
      </div>

      <hr class="divider">

      <p class="cert-label">Sertifikat Partisipasi</p>
      <h1 class="cert-title">Tanda Penghargaan</h1>

      <p class="awarded-to">Diberikan kepada</p>
      <div class="recipient">{user_name}</div>

      <p class="event-desc">atas partisipasi aktif dalam kegiatan</p>
      <p class="event-name">{event_title}</p>
      <p class="event-date">Tanggal Kegiatan: {event_date}</p>

      <div class="seal-area">
        <div class="seal">
          <span class="seal-check">&#10003;</span>
          <span>Verified</span>
        </div>
      </div>

      <div class="meta-box">
        <div class="meta-row"><span>ID Sertifikat</span><span>{cert_id}</span></div>
        <div class="meta-row"><span>Hash Verifikasi</span><span>{cert_hash}</span></div>
        <div class="meta-row"><span>Diterbitkan</span><span>{issued_at}</span></div>
        <div class="meta-row"><span>Verifikasi online</span><span>/certificates/{cert_id}/verify</span></div>
      </div>

      <p class="print-note">Untuk menyimpan sebagai PDF: Ctrl+P &rarr; Simpan sebagai PDF</p>
    </div>
  </div>
</body>
</html>""".encode("utf-8")


def handle_get(handler, conn, path, deps):
  api_prefix = deps["API_PREFIX"]

  # GET /certificates/:id/download — Generate HTML sertifikat sebagai file download
  # Dapat dicetak sebagai PDF dari browser (Ctrl+P → Save as PDF)
  if path.startswith(f"{api_prefix}/certificates/") and path.endswith("/download"):
    actor = _actor(conn, handler, deps)
    if not actor:
      return _json(deps, handler, 401, {"error": "Unauthorized"})
    cert_id = path.split("/")[-2]
    cert = conn.execute(
      """
      SELECT
        certificates.*,
        users.name AS user_name,
        events.title AS event_title,
        events.event_date AS event_date
      FROM certificates
      JOIN users ON users.id = certificates.user_id
      JOIN events ON events.id = certificates.event_id
      WHERE certificates.id = ?
      """,
      (cert_id,),
    ).fetchone()
    if not cert:
      return _json(deps, handler, 404, {"error": "Sertifikat tidak ditemukan"})
    # RBAC: hanya pemilik sertifikat atau admin yang bisa download (Least Privilege)
    if cert["user_id"] != actor["id"] and actor["role_code"] != "admin":
      return _json(deps, handler, 403, {"error": "Forbidden"})
    safe_title = _safe_download_filename(str(cert["event_title"])[:40])
    filename = _safe_download_filename(f"sertifikat-simrp-{cert_id[:8]}-{safe_title}") + ".html"
    html_bytes = _generate_certificate_html(cert)
    _send_html_download(handler, filename, html_bytes, deps)
    return True

  # GET /certificates/:id/verify — Verifikasi keaslian sertifikat (public)
  if path.startswith(f"{api_prefix}/certificates/") and path.endswith("/verify"):
    cert_id = path.split("/")[-2]
    cert = conn.execute(
      """
      SELECT
        certificates.*,
        users.name AS user_name,
        events.title AS event_title,
        events.event_date AS event_date
      FROM certificates
      JOIN users ON users.id = certificates.user_id
      JOIN events ON events.id = certificates.event_id
      WHERE certificates.id = ?
      """,
      (cert_id,),
    ).fetchone()
    if not cert:
      return _json(deps, handler, 404, {"valid": False, "error": "Sertifikat tidak ditemukan"})
    return _json(
      deps,
      handler,
      200,
      {
        "valid": True,
        "certificate": {
          "id": cert["id"],
          "userName": cert["user_name"],
          "eventTitle": cert["event_title"],
          "eventDate": cert["event_date"],
          "hash": cert["certificate_hash"],
          "issuedAt": cert["issued_at"],
        },
      },
    )

  # GET /certificates — Daftar sertifikat milik user yang sedang login
  if path == f"{api_prefix}/certificates":
    actor = _actor(conn, handler, deps)
    if not actor:
      return _json(deps, handler, 401, {"error": "Unauthorized"})
    rows = conn.execute(
      """
      SELECT
        certificates.*,
        events.title AS event_title,
        events.event_date AS event_date,
        users.name AS user_name
      FROM certificates
      JOIN events ON events.id = certificates.event_id
      JOIN users ON users.id = certificates.user_id
      WHERE certificates.user_id = ?
      ORDER BY certificates.issued_at DESC
      """,
      (actor["id"],),
    ).fetchall()
    certificates = [
      {
        "id": row["id"],
        "userId": row["user_id"],
        "userName": row["user_name"],
        "eventId": row["event_id"],
        "eventTitle": row["event_title"],
        "eventDate": row["event_date"],
        "reportId": row["report_id"],
        "hash": row["certificate_hash"],
        "issuedAt": row["issued_at"],
      }
      for row in rows
    ]
    return _json(deps, handler, 200, {"certificates": certificates})

  return False


certificate_routes = {
  "GET": ("/certificates", "/certificates/{id}/verify", "/certificates/{id}/download"),
}
