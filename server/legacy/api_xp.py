"""
Legacy XP route-dict module kept for reference only.

Runtime leaderboard handling is delegated from server/main.py to server/api/users.py.
"""
from core import execute


def get_leaderboard(handler, body, client_ip):
    """Get top 7 kelurahan by XP."""
    rows = execute("""
        SELECT kelurahan.name AS kelurahan, kecamatan.name AS kecamatan, xp_kelurahan.total_xp AS xp
        FROM xp_kelurahan
        JOIN kelurahan ON kelurahan.id = xp_kelurahan.kelurahan_id
        JOIN kecamatan ON kecamatan.id = kelurahan.kecamatan_id
        ORDER BY xp DESC LIMIT 7
    """).fetchall()
    
    leaderboard = [{"rank": i+1, "kelurahan": r["kelurahan"], "kecamatan": r["kecamatan"], "xp": int(r["xp"])} for i, r in enumerate(rows)]
    return handler.send_json(200, {"leaderboard": leaderboard})


xp_routes = {
    "GET": {"/landing/leaderboard": get_leaderboard},
}
