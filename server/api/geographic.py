"""
SIMREKAP Geographic Module.

Handles geographic lookup routes delegated from server/main.py.
"""


def _json(deps, handler, status, payload):
  deps["write_json"](handler, status, payload)
  return True


def _auth_user(handler, conn, deps):
  return deps["user_from_token"](conn, handler.headers.get("Authorization"))


def handle_get(handler, conn, path, deps):
  """Handle GET /geo/*, /kodepos/*, and /kampung* routes."""
  api_prefix = deps["API_PREFIX"]

  if path.startswith(f"{api_prefix}/kodepos/"):
    code = path.split("/")[-1]
    rows = conn.execute(
      """
      SELECT postal_codes.code AS kodepos, kelurahan.name AS kelurahan, kecamatan.name AS kecamatan
      FROM postal_codes
      JOIN kampung_mapping ON kampung_mapping.postal_code_id = postal_codes.id
      JOIN kelurahan ON kelurahan.id = kampung_mapping.kelurahan_id
      JOIN kecamatan ON kecamatan.id = kelurahan.kecamatan_id
      WHERE postal_codes.code = ?
      ORDER BY kelurahan.name
      """,
      (code,),
    ).fetchall()
    if not rows:
      return _json(deps, handler, 404, {"error": "Kodepos tidak ditemukan"})
    payload = [{"kelurahan": r["kelurahan"], "kecamatan": r["kecamatan"]} for r in rows]
    return _json(deps, handler, 200, {"kodepos": code, "kelurahan": payload})

  if path == f"{api_prefix}/geo/options":
    rows = conn.execute(
      """
      SELECT
        kecamatan.id AS kec_id,
        kecamatan.name AS kec_name,
        kelurahan.id AS kel_id,
        kelurahan.name AS kel_name,
        postal_codes.code AS kodepos
      FROM kampung_mapping
      JOIN kelurahan ON kelurahan.id = kampung_mapping.kelurahan_id
      JOIN kecamatan ON kecamatan.id = kelurahan.kecamatan_id
      JOIN postal_codes ON postal_codes.id = kampung_mapping.postal_code_id
      ORDER BY kecamatan.name ASC, kelurahan.name ASC, postal_codes.code ASC
      """
    ).fetchall()
    grouped = {}
    for row in rows:
      if row["kec_id"] not in grouped:
        grouped[row["kec_id"]] = {"id": row["kec_id"], "name": row["kec_name"], "kelurahan": [], "_kel_idx": {}}
      if row["kel_id"] is not None:
        key = row["kel_id"]
        if key not in grouped[row["kec_id"]]["_kel_idx"]:
          grouped[row["kec_id"]]["_kel_idx"][key] = len(grouped[row["kec_id"]]["kelurahan"])
          grouped[row["kec_id"]]["kelurahan"].append({"id": row["kel_id"], "name": row["kel_name"], "kodepos": []})
        kel_idx = grouped[row["kec_id"]]["_kel_idx"][key]
        if row["kodepos"] is not None and row["kodepos"] not in grouped[row["kec_id"]]["kelurahan"][kel_idx]["kodepos"]:
          grouped[row["kec_id"]]["kelurahan"][kel_idx]["kodepos"].append(row["kodepos"])
    result = []
    for kec in grouped.values():
      result.append({"id": kec["id"], "name": kec["name"], "kelurahan": kec["kelurahan"]})
    return _json(deps, handler, 200, {"kecamatan": result})

  if path == f"{api_prefix}/geo/stats":
    stats = deps["get_geo_stats"]()
    return _json(
      deps,
      handler,
      200,
      {
        "stats": {
          "kecamatan": int(stats["kecamatan"]),
          "kelurahan": int(stats["kelurahan"]),
          "kodepos": int(stats["kodepos"]),
        }
      },
    )

  if path.startswith(f"{api_prefix}/kampung/") and path.endswith("/pillars"):
    actor = _auth_user(handler, conn, deps)
    if not actor:
      return _json(deps, handler, 401, {"error": "Unauthorized"})
    kel_id_raw = path.split("/")[-2]
    try:
      kel_id = int(kel_id_raw)
    except Exception:
      return _json(deps, handler, 400, {"error": "ID kampung tidak valid"})
    rows = conn.execute(
      "SELECT pillar, xp FROM xp_pillar WHERE kelurahan_id = ?",
      (kel_id,),
    ).fetchall()
    pillars = {int(r["pillar"]): int(r["xp"]) for r in rows}
    return _json(
      deps,
      handler,
      200,
      {
        "pillars": {
          "lingkungan": pillars.get(1, 0),
          "ekonomi": pillars.get(2, 0),
          "kemasyarakatan": pillars.get(3, 0),
          "sosialBudaya": pillars.get(4, 0),
        }
      },
    )

  if path == f"{api_prefix}/kampung":
    actor = _auth_user(handler, conn, deps)
    if not actor:
      return _json(deps, handler, 401, {"error": "Unauthorized"})
    rows = conn.execute(
      """
      SELECT kelurahan.id AS id, kelurahan.name AS name, kecamatan.name AS kecamatan, xp_kelurahan.total_xp AS xp
      FROM kelurahan
      JOIN kecamatan ON kecamatan.id = kelurahan.kecamatan_id
      JOIN xp_kelurahan ON xp_kelurahan.kelurahan_id = kelurahan.id
      WHERE EXISTS (
        SELECT 1 FROM kampung_mapping WHERE kampung_mapping.kelurahan_id = kelurahan.id
      )
      ORDER BY xp_kelurahan.total_xp DESC, kelurahan.name ASC
      LIMIT 100
      """
    ).fetchall()
    data = [{"id": r["id"], "name": r["name"], "kecamatan": r["kecamatan"], "xp": int(r["xp"])} for r in rows]
    return _json(deps, handler, 200, {"kampung": data})

  return False


geographic_routes = {
  "GET": ("/geo/options", "/geo/stats", "/kodepos/{code}", "/kampung", "/kampung/{id}/pillars"),
}
