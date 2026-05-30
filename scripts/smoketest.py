"""
SIMRP smoke test for the modular API.

Prerequisites:
- Start the API separately, or set SIMRP_SMOKE_BASE to another running API URL.
- For seeded demo accounts, set SIMRP_SMOKE_DEMO_PASSWORD or SIMRP_DEMO_PASSWORD.
  If neither is set, this script tries database/runtime/dev_credentials.txt.
"""
import json
import os
import sys
import urllib.error
import urllib.request
from pathlib import Path


API_PREFIX = "/make-server-32aa5c5c"
BASE = os.environ.get("SIMRP_SMOKE_BASE", f"http://127.0.0.1:8099{API_PREFIX}").rstrip("/")
ROOT_DIR = Path(__file__).resolve().parents[1]
PASS = 0
FAIL = 0
SKIP = 0


def read_generated_demo_password():
    credential_path = Path(
        os.environ.get("SIMRP_SMOKE_CREDENTIALS_FILE", ROOT_DIR / "database" / "runtime" / "dev_credentials.txt")
    )
    if not credential_path.exists():
        return ""
    try:
        for line in credential_path.read_text(encoding="utf-8").splitlines():
            if line.startswith("SIMRP_DEMO_PASSWORD="):
                return line.split("=", 1)[1].strip()
    except OSError:
        return ""
    return ""


DEMO_PASSWORD = (
    os.environ.get("SIMRP_SMOKE_DEMO_PASSWORD")
    or os.environ.get("SIMRP_DEMO_PASSWORD")
    or read_generated_demo_password()
)


def req(method, path, body=None, token=None, expect=None, label=None, raw=False):
    global PASS, FAIL
    url = f"{BASE}{path}"
    data = json.dumps(body).encode("utf-8") if body is not None else None
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    request = urllib.request.Request(url, data=data, headers=headers, method=method)

    try:
        with urllib.request.urlopen(request, timeout=10) as resp:
            status = resp.status
            if raw:
                content = resp.read()
                result = {"_raw": True, "_len": len(content), "_ct": resp.headers.get("Content-Type", "")}
            else:
                content = resp.read().decode("utf-8")
                result = json.loads(content) if content else {}
    except urllib.error.HTTPError as exc:
        status = exc.code
        try:
            result = json.loads(exc.read().decode("utf-8"))
        except Exception:
            result = {}
    except Exception as exc:
        status = 0
        result = {"_exception": str(exc)}

    ok = True
    if expect is not None:
        if isinstance(expect, int):
            ok = status == expect
        elif isinstance(expect, (tuple, list, set)):
            ok = status in expect
        elif isinstance(expect, dict):
            ok = status == expect.get("_status", status) and all(
                result.get(key) == value for key, value in expect.items() if key != "_status"
            )

    tag = "PASS" if ok else "FAIL"
    if ok:
        PASS += 1
    else:
        FAIL += 1
    name = label or f"{method} {path}"
    print(f"  {tag:<4} [{status}] {name}")
    if not ok:
        print(f"       Expected: {expect}")
        print(f"       Got:      status={status}, body={str(result)[:300]}")
    return status, result


def sep(title):
    print("\n" + "-" * 60)
    print(f"  {title}")
    print("-" * 60)


def skip(message, count=1):
    global SKIP
    SKIP += count
    print(f"  SKIP {message}")


def find_kelurahan(options, preferred_name="Keputih"):
    kecamatan = options.get("kecamatan", [])
    for kec in kecamatan:
        for kel in kec.get("kelurahan", []):
            if kel.get("name") == preferred_name:
                return int(kec["id"]), int(kel["id"])
    for kec in kecamatan:
        for kel in kec.get("kelurahan", []):
            return int(kec["id"]), int(kel["id"])
    raise RuntimeError("No kelurahan found in /geo/options")


def require_demo_password():
    if DEMO_PASSWORD:
        return
    print("ERROR: demo password is not configured for smoke test.")
    print("Set SIMRP_SMOKE_DEMO_PASSWORD or SIMRP_DEMO_PASSWORD,")
    print("or run the server once so database/runtime/dev_credentials.txt is generated.")
    sys.exit(2)


session_token = None
ksh_token = None
mod_token = None
mod2_token = None
event_id = None
collab_id = None
target_kecamatan_id = None
target_kelurahan_id = None
current_user_id = None


sep("1. HEALTH CHECK")
req("GET", "/health", expect=200, label="GET /health")

sep("2. PUBLIC LOOKUPS")
req("GET", "/landing/leaderboard", expect=200, label="GET /landing/leaderboard")
status, geo_options = req("GET", "/geo/options", expect=200, label="GET /geo/options")
req("GET", "/geo/stats", expect=200, label="GET /geo/stats")
if status == 200:
    target_kecamatan_id, target_kelurahan_id = find_kelurahan(geo_options)
    print(f"       using kecamatanId={target_kecamatan_id}, kelurahanId={target_kelurahan_id}")

sep("3. AUTH - LOGIN")
require_demo_password()
status, result = req(
    "POST",
    "/auth/login",
    {"email": "relawan2.demo@simrp.app", "password": DEMO_PASSWORD},
    expect=200,
    label="POST /auth/login (relawan Keputih)",
)
if "token" in result:
    session_token = result["token"]
    current_user_id = result.get("user", {}).get("id")
    print(f"       token: {session_token[:20]}...")

status, result = req(
    "POST",
    "/auth/login",
    {"email": "ksh.demo@simrp.app", "password": DEMO_PASSWORD},
    expect=200,
    label="POST /auth/login (ksh)",
)
if "token" in result:
    ksh_token = result["token"]

status, result = req(
    "POST",
    "/auth/login",
    {"email": "moderator1.demo@simrp.app", "password": DEMO_PASSWORD},
    expect=200,
    label="POST /auth/login (mod t1)",
)
if "token" in result:
    mod_token = result["token"]

status, result = req(
    "POST",
    "/auth/login",
    {"email": "moderator2.demo@simrp.app", "password": DEMO_PASSWORD},
    expect=200,
    label="POST /auth/login (mod t2 lurah)",
)
if "token" in result:
    mod2_token = result["token"]

sep("4. AUTH - CURRENT USER")
req("GET", "/auth/me", token=session_token, expect=200, label="GET /auth/me (relawan)")
req("GET", "/auth/me", expect=401, label="GET /auth/me (no token)")

sep("5. USERS")
req("GET", "/users", token=session_token, expect=200, label="GET /users (own user scope)")
req("GET", "/users", expect=401, label="GET /users (no auth)")
req("GET", "/users/me/participations", token=session_token, expect=200, label="GET /users/me/participations")
req("GET", "/users/me/participations", expect=401, label="GET /users/me/participations (no auth)")
req("GET", "/users?role=user", token=session_token, expect=200, label="GET /users?role=user")

sep("6. EVENTS")
req("GET", "/events", token=session_token, expect=200, label="GET /events")
req("GET", "/events", expect=401, label="GET /events (no auth)")
req("GET", "/events?status=published", token=session_token, expect=200, label="GET /events?status=published")

if target_kecamatan_id and target_kelurahan_id:
    status, result = req(
        "POST",
        "/events",
        {
            "title": "Smoketest Event",
            "description": "Test event dari smoke test",
            "pillar": 1,
            "date": "2027-01-15",
            "time": "09:00",
            "location": "Balai RW",
            "quota": 30,
            "scopeType": "kelurahan",
            "kecamatanId": target_kecamatan_id,
            "kelurahanId": target_kelurahan_id,
        },
        token=mod_token,
        expect=200,
        label="POST /events (create, mod t1)",
    )
    if result.get("success") and result.get("event", {}).get("id"):
        event_id = result["event"]["id"]
        print(f"       event_id: {event_id}")
else:
    skip("event create requires geo options", 1)

req("POST", "/events", {"title": "Unauthorized"}, token=session_token, expect=403, label="POST /events (relawan)")

sep("7. PUBLISH GATE")
if event_id:
    req("POST", f"/events/{event_id}/approval", {"approved": True}, token=mod2_token, expect={"_status": 200, "success": True, "status": "approved"}, label="POST /events/:id/approval")
    req("POST", f"/events/{event_id}/publish", {}, token=mod2_token, expect={"_status": 200, "success": True, "status": "published"}, label="POST /events/:id/publish")
    req("POST", f"/events/{event_id}/publish", {}, token=mod2_token, expect=400, label="POST /events/:id/publish (already published)")
    req("POST", f"/events/{event_id}/join", {}, token=session_token, expect=200, label="POST /events/:id/join (relawan)")
    req("POST", f"/events/{event_id}/join", {}, token=session_token, expect=200, label="POST /events/:id/join (duplicate)")
else:
    skip("event_id not available", 5)

sep("8. RECOMMENDATIONS")
req("GET", "/recommendations", token=session_token, expect=410, label="GET /recommendations")
req("POST", "/recommendations", {}, token=session_token, expect=410, label="POST /recommendations")

sep("9. GEOGRAPHIC")
req("GET", "/kampung", token=session_token, expect=200, label="GET /kampung")
if target_kelurahan_id:
    req("GET", f"/kampung/{target_kelurahan_id}/pillars", token=session_token, expect=200, label="GET /kampung/:id/pillars")

sep("10. NOTIFICATIONS")
req("GET", "/notifications", token=session_token, expect=200, label="GET /notifications")
req("GET", "/notifications/count", token=session_token, expect=200, label="GET /notifications/count")
req("GET", "/notifications", expect=401, label="GET /notifications (no auth)")

sep("11. REWARDS")
req("GET", "/rewards/catalog", token=session_token, expect=200, label="GET /rewards/catalog")
req("GET", "/rewards/catalog", expect=401, label="GET /rewards/catalog (no auth)")
req("POST", "/rewards/redeem", {}, token=session_token, expect=400, label="POST /rewards/redeem (missing voucherId)")

sep("12. COLLABORATION REQUESTS")
status, result = req(
    "POST",
    "/collaboration-requests",
    {
        "organizationName": "PT Smoketest",
        "picName": "Andi Tester",
        "email": "andi@smoketest.co.id",
        "supportType": "dana",
        "supportDescription": "Dukungan dana untuk kegiatan kampung",
        "contributionScope": "kelurahan",
        "kecamatanId": target_kecamatan_id,
        "kelurahanId": target_kelurahan_id,
    },
    expect=200,
    label="POST /collaboration-requests (public)",
)
if result.get("success") and result.get("request", {}).get("id"):
    collab_id = result["request"]["id"]
    print(f"       collab_id: {collab_id}")

req("GET", "/collaboration-requests", token=mod2_token, expect=200, label="GET /collaboration-requests (mod t2)")
req("GET", "/collaboration-requests", token=session_token, expect=403, label="GET /collaboration-requests (relawan)")

sep("13. EMAIL MITRA STUB")
if collab_id:
    req("POST", f"/collaboration-requests/{collab_id}/approval", {"approved": True}, token=mod2_token, expect=200, label="POST /collaboration-requests/:id/approval")
else:
    skip("collab_id not available", 1)

sep("14. REPORTS")
req("GET", "/reports", token=mod2_token, expect=200, label="GET /reports (mod t2)")
req("GET", "/reports", token=session_token, expect=200, label="GET /reports (relawan own scope)")
req("GET", "/reports", expect=401, label="GET /reports (no auth)")
if event_id:
    req(
        "POST",
        "/reports",
        {"eventId": event_id, "participants": 10, "outcomeTags": ["lingkungan", "kebersihan"]},
        token=session_token,
        expect=400,
        label="POST /reports on non-completed event",
    )

sep("15. CERTIFICATES")
req("GET", "/certificates", token=session_token, expect=200, label="GET /certificates")
req("GET", "/certificates", expect=401, label="GET /certificates (no auth)")
req("GET", "/certificates/nonexistent-cert/verify", expect=404, label="GET /certificates/:id/verify (bad id)")
req("GET", "/certificates/nonexistent-cert/download", expect=401, label="GET /certificates/:id/download (no auth)")
req("GET", "/certificates/nonexistent-cert/download", token=session_token, expect=404, label="GET /certificates/:id/download (bad id)")

sep("16. ADMIN ENDPOINTS")
req("GET", "/admin/temporary-adjustments", token=session_token, expect=403, label="GET /admin/temporary-adjustments (relawan)")
req("GET", "/admin/temporary-adjustments", expect=403, label="GET /admin/temporary-adjustments (no auth)")
req("POST", "/admin/assign-role", {}, expect=401, label="POST /admin/assign-role (no auth)")
req("POST", "/admin/assign-role", {}, token=session_token, expect=403, label="POST /admin/assign-role (relawan)")

sep("17. SECURITY BOUNDARY TESTS")
req("POST", "/auth/login", {"email": "' OR 1=1 --", "password": "anything"}, expect=400, label="POST /auth/login (SQL-like email)")
req("POST", "/auth/login", {"email": "a" * 10000 + "@test.com", "password": "test"}, expect=(400, 401), label="POST /auth/login (long email)")
req("POST", "/events", {"title": "X", "pillar": 99, "date": "2027-01-01", "scopeType": "kelurahan", "kecamatanId": target_kecamatan_id, "kelurahanId": target_kelurahan_id}, token=mod_token, expect=400, label="POST /events (pillar=99)")
req("POST", "/events", {"title": "X", "pillar": 1, "date": "2027-01-01", "quota": -5, "scopeType": "kelurahan", "kecamatanId": target_kecamatan_id, "kelurahanId": target_kelurahan_id}, token=mod_token, expect=400, label="POST /events (quota=-5)")
if current_user_id:
    req("PUT", "/users/fake-uuid-not-mine", {"name": "Hacker"}, token=session_token, expect=403, label="PUT /users/:id (not own)")

sep("18. LOGOUT")
req("DELETE", "/auth/logout", token=session_token, expect=200, label="DELETE /auth/logout")
req("GET", "/auth/me", token=session_token, expect=401, label="GET /auth/me (after logout)")

sep("SMOKE TEST RESULT")
total = PASS + FAIL
print(f"\n  Total: {total}")
print(f"  PASS : {PASS}")
print(f"  FAIL : {FAIL}")
if SKIP:
    print(f"  SKIP : {SKIP}")
print()
if FAIL == 0:
    print("  SMOKE TEST PASSED")
else:
    print("  SMOKE TEST FAILED")
    sys.exit(1)
