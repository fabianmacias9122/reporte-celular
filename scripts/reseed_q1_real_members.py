"""
Delete all Q1 2026 reports and re-seed them using real cell members from /api/catalogs.
"""
import json, random, urllib.request, urllib.error
from datetime import date, timedelta
from collections import defaultdict

API = "http://127.0.0.1:8090/api"

Q1_START = date(2026, 1, 5)   # First Monday of Q1
Q2_START = date(2026, 5, 4)   # First Monday of Q2

# Q1 weeks per cell (same distribution as original seed)
Q1_WEEKS = {"1": 16, "2": 14, "3": 16, "4": 11, "5": 16, "7": 13, "8": 16}

# ── Helpers ──────────────────────────────────────────────────────────────────

def get_json(path):
    with urllib.request.urlopen(f"{API}{path}", timeout=10) as r:
        return json.loads(r.read())

def delete_report(rid):
    req = urllib.request.Request(f"{API}/reports/{rid}", method="DELETE")
    try:
        with urllib.request.urlopen(req, timeout=5):
            pass
        return True
    except urllib.error.HTTPError as e:
        print(f"  DELETE {rid} → HTTP {e.code}")
        return False

def post_report(payload):
    data = json.dumps(payload).encode()
    req = urllib.request.Request(f"{API}/reports", data=data,
                                  headers={"Content-Type": "application/json"}, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=10) as r:
            return json.loads(r.read())
    except urllib.error.HTTPError as e:
        print(f"  POST → HTTP {e.code}: {e.read().decode()[:120]}")
        return None

def week_date(quarter_start, week):
    return (quarter_start + timedelta(weeks=week - 1)).isoformat()

# ── Step 1: Load real data ───────────────────────────────────────────────────

print("Loading catalogs...")
catalogs = get_json("/catalogs")
cells_by_num = {str(c["cellNumber"]): c for c in catalogs["cells"]}

members_by_cell = defaultdict(list)
for p in catalogs["people"]:
    cn = str(p.get("assignedCellNumber") or "")
    if cn:
        members_by_cell[cn].append({"id": p["id"], "name": p["name"]})

print("Members per cell:")
for cn in sorted(members_by_cell.keys(), key=int):
    print(f"  Célula {cn}: {[m['name'] for m in members_by_cell[cn]]}")

# ── Step 2: Delete all Q1 reports ───────────────────────────────────────────

print("\nLoading existing reports...")
all_reports = get_json("/reports")["reports"]
q1_reports = [
    r for r in all_reports
    if str(r.get("formData", {}).get("reportDate", ""))[5:7] in ("01", "02", "03", "04")
    and str(r.get("formData", {}).get("reportDate", "")).startswith("2026")
]
print(f"Found {len(q1_reports)} Q1 2026 reports to delete...")
for r in q1_reports:
    ok = delete_report(r["id"])
    print(f"  Deleted report {r['id']} (cell {r.get('cellNumber')}) → {'ok' if ok else 'FAIL'}")

# ── Step 3: Build member attendance using real members ───────────────────────

def make_member_attendance(cell_num):
    members = members_by_cell.get(str(cell_num), [])
    if not members:
        return []
    rows = []
    for m in members:
        planning = random.random() > 0.25
        reach    = random.random() > 0.20
        sunday   = random.random() > 0.15
        attended = planning or reach or sunday
        status = "present" if attended else random.choice(["absent", "absent", "justified"])
        rows.append({
            "personId": m["id"],
            "name":     m["name"],
            "status":   status,
            "planningAttended": planning,
            "reachAttended":    reach,
            "reachPrivileged":  random.random() > 0.7,
            "sundayAttended":   sunday,
            "note": "",
        })
    return rows

def make_visitors():
    n = random.randint(0, 3)
    NAMES = ["Ana Flores","Luis Torres","Marta Reyes","Juan Nuñez","Sofia Castro",
             "Pablo Mora","Laura Gil","Diego Rios","Carmen Vega","Ricardo Blanco"]
    sample = random.sample(NAMES, min(n, len(NAMES)))
    return [{
        "name": v, "invitedBy": "", "firstVisit": True,
        "reachAttended": random.random() > 0.3,
        "sundayAttended": random.random() > 0.5,
        "converted": False, "contacted": True, "eventAttended": False,
        "phone": "", "note": "",
    } for v in sample]

def make_report(cell_num, week, report_date):
    cell = cells_by_num.get(str(cell_num), {})
    members = make_member_attendance(cell_num)
    visitors = make_visitors()
    planning_count  = sum(1 for m in members if m["planningAttended"])
    reach_count     = sum(1 for m in members if m["reachAttended"])
    reach_friends   = sum(1 for v in visitors if v["reachAttended"])
    sunday_count    = sum(1 for m in members if m["sundayAttended"])
    sunday_friends  = sum(1 for v in visitors if v["sundayAttended"])
    absent_count    = sum(1 for m in members if m["status"] == "absent")
    justified_count = sum(1 for m in members if m["status"] == "justified")
    kids_n          = random.randint(0, 3)

    return {
        "week":           str(week),
        "cellNumber":     str(cell_num),
        "networkName":    cell.get("networkName", ""),
        "sector":         cell.get("sector", ""),
        "zoneName":       cell.get("zoneName", ""),
        "districtName":   cell.get("districtName", ""),
        "leaderName":     cell.get("leaderName", ""),
        "assistantName":  cell.get("assistantName", ""),
        "hostName":       cell.get("hostName", ""),
        "address":        cell.get("address", ""),
        "reportDate":     report_date,
        "memberAttendance": members,
        "visitors":       visitors,
        "kids":           [],
        "baptisms":       [],
        "attendanceSummary": {
            "totalMembers":           len(members),
            "planningMembersPresent": planning_count,
            "planningMembersAbsent":  len(members) - planning_count,
            "reachMembersPresent":    reach_count,
            "reachPrivilegedMembers": sum(1 for m in members if m["reachPrivileged"]),
            "reachFriendsPresent":    reach_friends,
            "reachKidsPresent":       kids_n,
            "reachConversions":       0,
            "sundayMembersPresent":   sunday_count,
            "sundayFriendsPresent":   sunday_friends,
            "sundayKidsPresent":      kids_n,
            "present":  sum(1 for m in members if m["status"] == "present"),
            "absent":   absent_count,
            "justified": justified_count,
            "service":  0,
            "pending":  0,
            "visitors": len(visitors),
        },
        "planningNotes": f"Planeación semana {week}",
        "reachNotes": "", "cultoNotes": "", "cierreNotes": "",
        "cycleReportId": f"1cuart2026",
    }

# ── Step 4: Seed Q1 with real members ───────────────────────────────────────

random.seed(42)   # reproducible randomness
total = 0
print("\nSeeding Q1 with real members...")
for cell_num, weeks in sorted(Q1_WEEKS.items(), key=lambda x: int(x[0])):
    if not members_by_cell.get(str(cell_num)):
        print(f"  Célula {cell_num}: no members registered, skipping")
        continue
    print(f"\n  Célula {cell_num} ({cells_by_num.get(str(cell_num), {}).get('leaderName', '?')}) — {weeks} weeks")
    for w in range(1, weeks + 1):
        rd = week_date(Q1_START, w)
        payload = make_report(cell_num, w, rd)
        result = post_report(payload)
        rid = result.get("id") if result else None
        print(f"    Sem {w:02d} {rd} → id={rid}" if rid else f"    Sem {w:02d} {rd} → ERROR")
        total += 1

print(f"\nDone. Created {total} reports with real members.")
