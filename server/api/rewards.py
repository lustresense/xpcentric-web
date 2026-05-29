"""
SIMRP Rewards Module.

Handles rewards catalog and redemption delegated from server/main.py.
"""

import secrets
import uuid
from datetime import datetime, timezone, timedelta


def _voucher_display(row):
  keys = set(row.keys()) if hasattr(row, "keys") else set()
  name = row["name"] or ""
  description = row["description"] if "description" in keys else ""
  description = description or ""
  if name.startswith("Voucher Rp"):
    name = name.replace("Voucher ", "Voucher GoBis ", 1)
  if "demo simrp" in description.lower():
    description = (
      "Voucher transportasi untuk ditukarkan di aplikasi GoBis sebagai akses tiket "
      "Suroboyo Bus dan layanan angkutan publik terkait."
    )
  return name, description


def _json(deps, handler, status, payload):
  deps["write_json"](handler, status, payload)
  return True


def _auth_header(handler):
  return handler.headers.get("Authorization")


def _actor(conn, handler, deps):
  return deps["user_from_token"](conn, _auth_header(handler))


def handle_get(handler, conn, path, deps):
  api_prefix = deps["API_PREFIX"]

  if path == f"{api_prefix}/rewards/catalog":
    actor = _actor(conn, handler, deps)
    if not actor:
      return _json(deps, handler, 401, {"error": "Unauthorized"})
    rows = conn.execute(
      """
      SELECT id, name, description, xp_cost, stock, is_active
      FROM voucher_catalog
      WHERE is_active = 1
      ORDER BY xp_cost ASC, name ASC
      """
    ).fetchall()
    catalog = []
    for row in rows:
      name, description = _voucher_display(row)
      catalog.append({
        "id": row["id"],
        "name": name,
        "description": description,
        "xpCost": int(row["xp_cost"]),
        "stock": int(row["stock"]),
        "isActive": bool(row["is_active"]),
      })
    return _json(deps, handler, 200, {"catalog": catalog})

  return False


def handle_post(handler, conn, path, body, deps):
  api_prefix = deps["API_PREFIX"]

  if path != f"{api_prefix}/rewards/redeem":
    return False

  actor = _actor(conn, handler, deps)
  if not actor:
    return _json(deps, handler, 401, {"error": "Unauthorized"})

  voucher_id = deps["bounded_text"](body.get("voucherId", ""), 120)
  if not voucher_id:
    return _json(deps, handler, 400, {"error": "voucherId wajib diisi"})
  voucher = conn.execute(
    """
    SELECT id, name, description, xp_cost, stock, is_active
    FROM voucher_catalog
    WHERE id = ?
    """,
    (voucher_id,),
  ).fetchone()
  if not voucher or not bool(voucher["is_active"]):
    return _json(deps, handler, 404, {"error": "Voucher tidak tersedia"})
  if int(voucher["stock"]) <= 0:
    return _json(deps, handler, 400, {"error": "Stok voucher habis"})
  if int(actor["points"]) < int(voucher["xp_cost"]):
    return _json(deps, handler, 400, {"error": "XP kamu belum cukup untuk menukar voucher ini"})

  now = deps["utc_now_iso"]()
  stock_updated = deps["execute"](
    conn,
    "UPDATE voucher_catalog SET stock = stock - 1 WHERE id = ? AND stock > 0 AND is_active = 1",
    (voucher_id,),
  ).rowcount
  if stock_updated == 0:
    return _json(deps, handler, 400, {"error": "Stok voucher habis"})

  points_updated = deps["execute"](
    conn,
    "UPDATE users SET points = points - ?, updated_at = ? WHERE id = ? AND points >= ?",
    (int(voucher["xp_cost"]), now, actor["id"], int(voucher["xp_cost"])),
  ).rowcount
  if points_updated == 0:
    deps["execute"](conn, "UPDATE voucher_catalog SET stock = stock + 1 WHERE id = ?", (voucher_id,))
    return _json(deps, handler, 400, {"error": "XP kamu belum cukup untuk menukar voucher ini"})

  redemption_id = f"redeem-{uuid.uuid4().hex[:12]}"
  voucher_code = f"GOBIS-SIMRP-{secrets.token_hex(4).upper()}"
  expires_at = (datetime.now(timezone.utc) + timedelta(days=30)).isoformat()
  deps["execute"](
    conn,
    """
    INSERT INTO voucher_redemptions(id, user_id, voucher_id, xp_spent, voucher_code, redeemed_at, expires_at)
    VALUES(?, ?, ?, ?, ?, ?, ?)
    """,
    (
      redemption_id,
      actor["id"],
      voucher_id,
      int(voucher["xp_cost"]),
      voucher_code,
      now,
      expires_at,
    ),
  )
  deps["create_notification"](
    conn,
    actor["id"],
    "reward.redeem",
    "Penukaran voucher berhasil",
    f"Kamu menukar {voucher['name']} ({voucher['xp_cost']} XP). Kode GoBis: {voucher_code}",
    "voucher_redemption",
    redemption_id,
  )
  deps["log_audit"](
    conn,
    actor["id"],
    "reward.redeem",
    "voucher",
    voucher_id,
    {"voucherCode": voucher_code, "xpSpent": int(voucher["xp_cost"])},
  )
  remaining_points_row = conn.execute("SELECT points FROM users WHERE id = ?", (actor["id"],)).fetchone()
  return _json(
    deps,
    handler,
    200,
    {
      "success": True,
      "redemption": {
        "id": redemption_id,
        "voucherId": voucher_id,
        "voucherName": _voucher_display(voucher)[0],
        "voucherCode": voucher_code,
        "xpSpent": int(voucher["xp_cost"]),
        "expiresAt": expires_at,
        "remainingPoints": max(0, int(remaining_points_row["points"])) if remaining_points_row else 0,
      },
    },
  )


rewards_routes = {
  "GET": ("/rewards/catalog",),
  "POST": ("/rewards/redeem",),
}
