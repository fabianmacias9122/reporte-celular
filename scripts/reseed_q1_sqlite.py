"""
Re-seed Q1 2026 reports directly into SQLite using real cell members.
Bypasses the week-validation in the HTTP API.
"""
import json, random, sqlite3
from datetime import date, timedelta, timezone, datetime
from collections import defaultdict
import urllib.request

API = "http://127.0.0.1:8090/api"
DB  = "data/reporte-celular.db"

Q1_START = date(2026, 1, 5)
Q1_WEEKS = {"1": 16, "2": 14, "3": 16, "4": 11, "5": 16, "7": 13, "8": 16}

random.seed(42)

# ── Load catalogs ─────────────────────────────────────────────────────────────
data = json.loads(urllib.request.urlopen(f"{API}/catalogs", timeout=10).read())
cells_by_num = {str(c["cellNumber"]): c for c in data["cells"]}
members_by_cell = defaultdict(list)
for p in data["people"]:
    cn = str(p.get("assignedCellNumber") or "")
    if cn:
        members_by_cell[cn].append({"id": p["id"], "name": p["name"]})

print("Members per cell:")
for cn in sorted(members_by_cell, key=int):
    print(f"  Célula {cn}: {[m['name'] for m in members_by_cell[cn]]}")

# ── Delete existing Q1 reports directly ──────────────────────────────────────
con = sqlite3.connect(DB)
con.row_factory = sqlite3.Row
deleted = con.execute("""
    DELETE FROM reports
    WHERE json_extract(payload_json, '$.reportDate') BETWEEN '2026-01-01' AND '2026-04-30'
""").rowcount
con.commit()
print(f"\nDeleted {deleted} existing Q1 reports from DB.")

# ── Build payloads ────────────────────────────────────────────────────────────

def week_date(week):
    return (Q1_START + timedelta(weeks=week - 1)).isoformat()

def make_attendance(cell_num):
    rows = []
    for m in members_by_cell.get(str(cell_num), []):
        planning = random.random() > 0.25
        reach    = random.random() > 0.20
        sunday   = random.random() > 0.15
        attended = planning or reach or sunday
        status = "present" if attended else random.choice(["absent", "absent", "justified"])
        rows.append({
            "personId": m["id"], "name": m["name"], "status": status,
            "planningAttended": planning, "reachAttended": reach,
            "reachPrivileged": random.random() > 0.7,
            "sundayAttended": sunday, "note": "",
        })
    return rows

def make_visitors():
    NAMES = ["Ana Flores","Luis Torres","Marta Reyes","Juan Nuñez","Sofia Castro",
             "Pablo Mora","Laura Gil","Diego Rios","Carmen Vega","Ricardo Blanco"]
    n = random.randint(0, 3)
    return [{
        "name": v, "invitedBy": "", "firstVisit": True,
        "reachAttended": random.random() > 0.3,
        "sundayAttended": random.random() > 0.5,
        "converted": False, "contacted": True, "eventAttended": False,
        "phone": "", "note": "",
    } for v in random.sample(NAMES, min(n, len(NAMES)))]

def make_report(cell_num, week):
    cell    = cells_by_num.get(str(cell_num), {})
    members = make_attendance(cell_num)
    visitors = make_visitors()
    rd = week_date(week)
    planning_p  = sum(1 for m in members if m["planningAttended"])
    reach_p     = sum(1 for m in members if m["reachAttended"])
    reach_fr    = sum(1 for v in visitors if v["reachAttended"])
    sunday_p    = sum(1 for m in members if m["sundayAttended"])
    sunday_fr   = sum(1 for v in visitors if v["sundayAttended"])
    absent      = sum(1 for m in members if m["status"] == "absent")
    justified   = sum(1 for m in members if m["status"] == "justified")
    kids_n      = random.randint(0, 3)
    payload = {
        "week": str(week), "cellNumber": str(cell_num),
        "networkName": cell.get("networkName",""), "sector": cell.get("sector",""),
        "zoneName": cell.get("zoneName",""), "districtName": cell.get("districtName",""),
        "leaderName": cell.get("leaderName",""), "assistantName": cell.get("assistantName",""),
        "hostName": cell.get("hostName",""), "address": cell.get("address",""),
        "reportDate": rd,
        "memberAttendance": members, "visitors": visitors, "kids": [], "baptisms": [],
        "attendanceSummary": {
            "totalMembers": len(members),
            "planningMembersPresent": planning_p,
            "planningMembersAbsent":  len(members) - planning_p,
            "reachMembersPresent":    reach_p,
            "reachPrivilegedMembers": sum(1 for m in members if m["reachPrivileged"]),
            "reachFriendsPresent":    reach_fr,
            "reachKidsPresent":       kids_n,
            "reachConversions":       0,
            "sundayMembersPresent":   sunday_p,
            "sundayFriendsPresent":   sunday_fr,
            "sundayKidsPresent":      kids_n,
            "present": sum(1 for m in members if m["status"] == "present"),
            "absent": absent, "justified": justified, "service": 0, "pending": 0,
            "visitors": len(visitors),
        },
        "planningNotes": f"Planeación semana {week}",
        "reachNotes": "", "cultoNotes": "", "cierreNotes": "",
        "cycleReportId": "1cuart2026",
    }
    return payload

# ── Insert directly into SQLite ───────────────────────────────────────────────
now_iso = datetime.now(timezone.utc).isoformat()
total = 0
print()
for cn, weeks in sorted(Q1_WEEKS.items(), key=lambda x: int(x[0])):
    if not members_by_cell.get(cn):
        print(f"Célula {cn}: no members, skipping")
        continue
    cell = cells_by_num.get(cn, {})
    print(f"Célula {cn} ({cell.get('leaderName','?')}) — {weeks} weeks")
    for w in range(1, weeks + 1):
        p = make_report(cn, w)
        payload_json = json.dumps(p, ensure_ascii=False)
        con.execute("""
            INSERT INTO reports (
                employee_name, area, device_model, imei, phone_number,
                status, notes, payload_json, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            p["leaderName"], p["assistantName"], p["cellNumber"],
            p["reportDate"], p["week"], p["sector"], "",
            payload_json, now_iso, now_iso,
        ))
        total += 1
    con.commit()
    print(f"  → {weeks} reports inserted")

con.close()
print(f"\nDone. Inserted {total} Q1 reports with real members.")
