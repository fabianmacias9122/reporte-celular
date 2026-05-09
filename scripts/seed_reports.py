"""Seed sample reports for cells 1-5, 7, 8 across Q1 and Q2 2026."""
import json, random, urllib.request, urllib.error
from datetime import date, timedelta

API = "http://127.0.0.1:8090/api/reports"

# Q1: Jan-Apr 2026 starts around 2026-01-05 (first Monday)
# Q2: May-Aug 2026 starts around 2026-05-04
Q1_START = date(2026, 1, 5)
Q2_START = date(2026, 5, 4)

# Cell definitions
CELLS = [
    {"cellNumber": "1", "networkName": "Rosarito", "sector": "A", "zoneName": "Zona Norte", "districtName": "Distrito 1",
     "leaderName": "Eloisa Vargas", "assistantName": "Arely Zamudio", "hostName": "Carlos Perez", "address": "Calle 5 #210, Col Centro"},
    {"cellNumber": "2", "networkName": "Rosarito", "sector": "A", "zoneName": "Zona Norte", "districtName": "Distrito 1",
     "leaderName": "Ignacio Chavez", "assistantName": "", "hostName": "Maria Lopez", "address": "Av Reforma #45"},
    {"cellNumber": "3", "networkName": "Rosarito", "sector": "A", "zoneName": "Zona Centro", "districtName": "Distrito 2",
     "leaderName": "Mariano Chavez", "assistantName": "Sandra Ruiz", "hostName": "Pedro Morales", "address": "Blvd Juarez #88"},
    {"cellNumber": "4", "networkName": "Rosarito", "sector": "A", "zoneName": "Zona Sur", "districtName": "Distrito 2",
     "leaderName": "Braulio Sauceda", "assistantName": "", "hostName": "Ana Guerrero", "address": "Calle Madero #12"},
    {"cellNumber": "5", "networkName": "Rosarito", "sector": "B", "zoneName": "Zona Sur", "districtName": "Distrito 3",
     "leaderName": "Roller Clemente", "assistantName": "Luis Vega", "hostName": "Rosa Ibarra", "address": "Priv. Palmas #7"},
    {"cellNumber": "7", "networkName": "Rosarito", "sector": "B", "zoneName": "Zona Norte", "districtName": "Distrito 3",
     "leaderName": "Carlos Martinez", "assistantName": "", "hostName": "Jorge Sandoval", "address": "Calle Nogal #33"},
    {"cellNumber": "8", "networkName": "Rosarito", "sector": "B", "zoneName": "Zona Centro", "districtName": "Distrito 3",
     "leaderName": "Gabriel Becerra", "assistantName": "Patricia Luna", "hostName": "Hector Rios", "address": "Col Salvacion #99"},
]

# How many Q1 weeks each cell completed (varies for realism)
Q1_WEEKS = {"1": 16, "2": 14, "3": 16, "4": 11, "5": 16, "7": 13, "8": 16}
# How many Q2 weeks each cell completed so far (we're in week 1-2 of Q2)
Q2_WEEKS = {"1": 1, "2": 1, "3": 2, "4": 1, "5": 2, "7": 0, "8": 1}

VISITOR_NAMES = [
    "Ana Flores","Luis Torres","Marta Reyes","Juan Nunez","Sofia Castro",
    "Pablo Mora","Laura Gil","Diego Rios","Carmen Vega","Ricardo Blanco",
]
MEMBER_NAMES = [
    "Elena Cruz","Roberto Diaz","Isabel Herrera","Miguel Soto","Daniela Ortiz",
    "Fernando Lopez","Claudia Ramos","Arturo Mendez","Verónica Jimenez","Andres Perez",
]

def rand_visitors(n=None):
    if n is None:
        n = random.randint(0, 3)
    sample = random.sample(VISITOR_NAMES, min(n, len(VISITOR_NAMES)))
    return [{"name": v, "invitedBy": "", "reachAttended": random.choice([True, False]),
             "sundayAttended": random.choice([True, False]), "firstVisit": True,
             "converted": False, "contacted": True, "eventAttended": False,
             "phone": "", "note": ""} for v in sample]

def rand_members(count):
    names = random.sample(MEMBER_NAMES, min(count, len(MEMBER_NAMES)))
    return [{"personId": None, "name": n, "status": "activo",
             "planningAttended": random.choice([True, False]),
             "reachAttended": random.choice([True, True, False]),
             "reachPrivileged": False,
             "sundayAttended": random.choice([True, True, False]),
             "note": ""} for n in names]

def week_date(quarter_start: date, week: int) -> str:
    return (quarter_start + timedelta(weeks=week - 1)).isoformat()

def make_report(cell, week, report_date, cycle_n, quarter_label):
    member_count = random.randint(4, 9)
    visitors = rand_visitors()
    members = rand_members(member_count)
    attendance = sum(1 for m in members if m["reachAttended"])
    return {
        "week": str(week),
        "cellNumber": cell["cellNumber"],
        "networkName": cell["networkName"],
        "sector": cell["sector"],
        "zoneName": cell["zoneName"],
        "districtName": cell["districtName"],
        "leaderName": cell["leaderName"],
        "assistantName": cell["assistantName"],
        "hostName": cell["hostName"],
        "address": cell["address"],
        "reportDate": report_date,
        "memberAttendance": members,
        "visitors": visitors,
        "kids": [],
        "baptisms": [],
        "attendanceSummary": {
            "membersAttended": attendance,
            "visitorsAttended": len(visitors),
            "totalAttended": attendance + len(visitors),
            "kidsAttended": random.randint(0, 3),
        },
        "planningNotes": f"Planeación semana {week} — {quarter_label}",
        "reachNotes": "",
        "cultoNotes": "",
        "cierreNotes": "",
        "cycleReportId": f"{cycle_n}cuart{report_date[:4]}",
    }

def post(payload):
    data = json.dumps(payload).encode()
    req = urllib.request.Request(API, data=data, headers={"Content-Type": "application/json"}, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=5) as resp:
            return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        print(f"  HTTP {e.code}: {body[:120]}")
        return None

total = 0
for cell in CELLS:
    cn = cell["cellNumber"]
    print(f"\n=== Célula {cn} ({cell['leaderName']}) ===")

    # Q1 weeks
    q1_count = Q1_WEEKS.get(cn, 0)
    for w in range(1, q1_count + 1):
        rd = week_date(Q1_START, w)
        payload = make_report(cell, w, rd, w, "1er Cuatrimestre 2026")
        result = post(payload)
        status = f"id={result['id']}" if result and result.get("id") else "SKIP/ERR"
        print(f"  Q1 sem {w:02d} {rd} → {status}")
        total += 1

    # Q2 weeks
    q2_count = Q2_WEEKS.get(cn, 0)
    for w in range(1, q2_count + 1):
        rd = week_date(Q2_START, w)
        payload = make_report(cell, w, rd, w, "2do Cuatrimestre 2026")
        result = post(payload)
        status = f"id={result['id']}" if result and result.get("id") else "SKIP/ERR"
        print(f"  Q2 sem {w:02d} {rd} → {status}")
        total += 1

print(f"\nDone. Attempted {total} reports.")
