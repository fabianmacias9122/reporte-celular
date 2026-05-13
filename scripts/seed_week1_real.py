"""
Borra TODOS los reportes y crea 1 reporte por celula para la Semana 1
usando miembros reales del catalogo.
Por defecto siembra Q2 semana 1 = 2026-05-04 (lunes).
Cambia REPORT_DATE / WEEK / CYCLE_ID si quieres otro periodo.
"""
import json, random, urllib.request, urllib.error
from collections import defaultdict

API = "http://127.0.0.1:8090/api"

REPORT_DATE = "2026-05-04"  # lunes semana 1 Q2
WEEK = "1"
CYCLE_ID = "2cuart2026"

VISITOR_NAMES = [
    "Ana Flores", "Luis Torres", "Marta Reyes", "Juan Nunez", "Sofia Castro",
    "Pablo Mora", "Laura Gil", "Diego Rios", "Carmen Vega", "Ricardo Blanco",
]
KID_NAMES = ["Mateo", "Sofia", "Lucas", "Emma", "Diego", "Camila", "Andres", "Valentina"]


def get_json(path):
    with urllib.request.urlopen(f"{API}{path}", timeout=10) as r:
        return json.loads(r.read())


def delete_report(rid):
    req = urllib.request.Request(f"{API}/reports/{rid}", method="DELETE")
    try:
        with urllib.request.urlopen(req, timeout=5):
            return True
    except urllib.error.HTTPError as e:
        print(f"  DELETE {rid} -> HTTP {e.code}")
        return False


def post_report(payload):
    data = json.dumps(payload).encode()
    req = urllib.request.Request(
        f"{API}/reports", data=data,
        headers={"Content-Type": "application/json"}, method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=10) as r:
            return json.loads(r.read())
    except urllib.error.HTTPError as e:
        print(f"  POST -> HTTP {e.code}: {e.read().decode()[:160]}")
        return None


def make_member_attendance(members):
    rows = []
    for m in members:
        planning = random.random() > 0.30
        reach = random.random() > 0.25
        sunday = random.random() > 0.20
        attended = planning or reach or sunday
        status = "present" if attended else random.choice(["absent", "absent", "justified"])
        rows.append({
            "personId": m["id"],
            "name": m["name"],
            "status": status,
            "planningAttended": planning,
            "reachAttended": reach,
            "reachPrivileged": random.random() > 0.7,
            "sundayAttended": sunday,
            "note": "",
        })
    return rows


def make_visitors():
    n = random.randint(0, 3)
    sample = random.sample(VISITOR_NAMES, min(n, len(VISITOR_NAMES)))
    out = []
    for name in sample:
        kind = random.choice(["amigo", "amigo", "amigo", "visita"])  # mas amigos que visitas
        out.append({
            "name": name,
            "invitedBy": "",
            "firstVisit": True,
            "kind": kind,
            "promoteToMember": False,
            "reachAttended": random.random() > 0.4,
            "sundayAttended": random.random() > 0.5,
            "converted": False,
            "contacted": True,
            "eventAttended": False,
            "phone": "",
            "note": "",
        })
    return out


def make_kids():
    n = random.randint(0, 3)
    sample = random.sample(KID_NAMES, min(n, len(KID_NAMES)))
    return [{
        "name": name,
        "guardianName": "",
        "source": random.choice(["cell", "cell", "visit"]),
        "reachAttended": random.random() > 0.4,
        "sundayAttended": random.random() > 0.5,
        "note": "",
    } for name in sample]


def make_report(cell, members):
    member_rows = make_member_attendance(members)
    visitors = make_visitors()
    kids = make_kids()
    planning_count = sum(1 for m in member_rows if m["planningAttended"])
    reach_count = sum(1 for m in member_rows if m["reachAttended"])
    reach_friends = sum(1 for v in visitors if v["reachAttended"])
    reach_kids = sum(1 for k in kids if k["reachAttended"])
    sunday_count = sum(1 for m in member_rows if m["sundayAttended"])
    sunday_friends = sum(1 for v in visitors if v["sundayAttended"])
    sunday_kids = sum(1 for k in kids if k["sundayAttended"])
    absent_count = sum(1 for m in member_rows if m["status"] == "absent")
    justified_count = sum(1 for m in member_rows if m["status"] == "justified")
    return {
        "week": WEEK,
        "cellNumber": str(cell["cellNumber"]),
        "networkName": cell.get("networkName", ""),
        "sector": cell.get("sector", ""),
        "zoneName": cell.get("zoneName", ""),
        "districtName": cell.get("districtName", ""),
        "leaderName": cell.get("leaderName", ""),
        "assistantName": cell.get("assistantName", ""),
        "hostName": cell.get("hostName", ""),
        "address": cell.get("address", ""),
        "reportDate": REPORT_DATE,
        "memberAttendance": member_rows,
        "visitors": visitors,
        "kids": kids,
        "baptisms": [],
        "attendanceSummary": {
            "totalMembers": len(member_rows),
            "planningMembersPresent": planning_count,
            "planningMembersAbsent": len(member_rows) - planning_count,
            "reachMembersPresent": reach_count,
            "reachPrivilegedMembers": sum(1 for m in member_rows if m["reachPrivileged"]),
            "reachFriendsPresent": reach_friends,
            "reachKidsPresent": reach_kids,
            "reachConversions": 0,
            "sundayMembersPresent": sunday_count,
            "sundayFriendsPresent": sunday_friends,
            "sundayKidsPresent": sunday_kids,
            "present": sum(1 for m in member_rows if m["status"] == "present"),
            "absent": absent_count,
            "justified": justified_count,
            "service": 0,
            "pending": 0,
            "visitors": len(visitors),
        },
        "planningNotes": f"Planeacion semana {WEEK}",
        "reachNotes": "",
        "cultoNotes": "",
        "cierreNotes": "",
        "cycleReportId": CYCLE_ID,
    }


def main():
    random.seed(7)
    print("Cargando catalogos...")
    catalogs = get_json("/catalogs")
    cells = catalogs["cells"]
    members_by_cell = defaultdict(list)
    for p in catalogs["people"]:
        cn = str(p.get("assignedCellNumber") or "")
        if cn and (p.get("role") or "").lower() != "kid":
            members_by_cell[cn].append({"id": p["id"], "name": p["name"]})

    print("\nReportes existentes...")
    all_reports = get_json("/reports")["reports"]
    print(f"  Encontrados: {len(all_reports)}. Borrando todos...")
    for r in all_reports:
        ok = delete_report(r["id"])
        print(f"    del id={r['id']} cell={r.get('cellNumber')} -> {'ok' if ok else 'FAIL'}")

    print(f"\nSembrando semana {WEEK} ({REPORT_DATE}) para {len(cells)} celulas...")
    created = 0
    for cell in sorted(cells, key=lambda c: int(c["cellNumber"])):
        cn = str(cell["cellNumber"])
        members = members_by_cell.get(cn, [])
        if not members:
            print(f"  Celula {cn}: sin miembros, omitida")
            continue
        payload = make_report(cell, members)
        result = post_report(payload)
        rid = result.get("id") if result else None
        print(f"  Celula {cn} ({cell.get('leaderName','?')}) {len(members)} miembros -> id={rid}")
        if rid:
            created += 1
    print(f"\nListo. {created} reportes creados.")


if __name__ == "__main__":
    main()
