"""Rellena todos los reportes existentes con datos aleatorios realistas."""
import json
import random
import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).parent.parent / "data" / "reporte-celular.db"

random.seed(42)

FIRST_NAMES = ["Ana","Luis","Pedro","María","Jorge","Laura","Carlos","Sandra",
               "Miguel","Rosa","Juan","Diana","David","Claudia","Héctor","Paola"]
LAST_NAMES  = ["García","López","Martínez","Hernández","Pérez","Ramírez",
               "Torres","Flores","Morales","Jiménez","Cruz","Mendoza"]

def rname():
    return f"{random.choice(FIRST_NAMES)} {random.choice(LAST_NAMES)}"

def fake_attendance(total_members):
    """Generate member attendance rows."""
    members = []
    for i in range(total_members):
        r = random.random()
        if r < 0.70:
            status = "present"
        elif r < 0.82:
            status = "absent"
        elif r < 0.90:
            status = "justified"
        else:
            status = "service"
        members.append({
            "personId": None,
            "name": rname(),
            "role": "member",
            "status": status,
            "planningAttended": status in ("present","service") and random.random() < 0.75,
            "reachAttended":    status in ("present","service") and random.random() < 0.80,
            "reachPrivileged":  status in ("present","service") and random.random() < 0.35,
            "sundayAttended":   status in ("present","service") and random.random() < 0.70,
            "rcmProgress": {},
            "note": "",
        })
    return members

def fake_visitors(n):
    visitors = []
    for _ in range(n):
        converted = random.random() < 0.15
        visitors.append({
            "name": rname(),
            "phone": f"664-{random.randint(100,999)}-{random.randint(1000,9999)}",
            "invitedBy": rname(),
            "reachAttended": True,
            "sundayAttended": random.random() < 0.40,
            "converted": converted,
            "eventAttended": random.random() < 0.20,
            "source": "visit",
        })
    return visitors

def fake_kids(n):
    kids = []
    for _ in range(n):
        kids.append({
            "name": rname(),
            "guardianName": rname(),
            "reachAttended": True,
            "sundayAttended": random.random() < 0.50,
            "source": "visit",
        })
    return kids

def build_summary(members, visitors, kids):
    present   = [m for m in members if m["status"] in ("present","service")]
    absent    = [m for m in members if m["status"] == "absent"]
    justified = [m for m in members if m["status"] == "justified"]
    service   = [m for m in members if m["status"] == "service"]
    planning_present = sum(1 for m in members if m["planningAttended"])
    reach_members    = sum(1 for m in members if m["reachAttended"])
    reach_privileged = sum(1 for m in members if m["reachPrivileged"])
    reach_friends    = len(visitors)
    reach_kids       = len(kids)
    sunday_members   = sum(1 for m in members if m["sundayAttended"])
    sunday_friends   = sum(1 for v in visitors if v["sundayAttended"])
    sunday_kids      = sum(1 for k in kids if k["sundayAttended"])
    conversions      = sum(1 for v in visitors if v["converted"])
    spiritual_parents = len({v["invitedBy"] for v in visitors if v["invitedBy"]})

    return {
        "totalMembers": len(members),
        "planningMembersPresent": planning_present,
        "planningMembersAbsent": len(members) - planning_present,
        "reachMembersPresent": reach_members,
        "reachPrivilegedMembers": reach_privileged,
        "reachFriendsPresent": reach_friends,
        "reachConversions": conversions,
        "reachKidsPresent": reach_kids,
        "winSpiritualParents": spiritual_parents,
        "winFriendsContacted": len(visitors),
        "winRiseEventFriends": sum(1 for v in visitors if v["eventAttended"]),
        "winBaptizedFriends": 0,
        "sundayMembersPresent": sunday_members,
        "sundayFriendsPresent": sunday_friends,
        "sundayKidsPresent": sunday_kids,
        "sundayTotal": sunday_members + sunday_friends + sunday_kids,
        "multiplySundayAttendance": sunday_members + sunday_friends + sunday_kids,
        "present": len(present),
        "absent":  len(absent),
        "justified": len(justified),
        "service": len(service),
        "pending": 0,
        "visitors": reach_friends,
    }

def main():
    con = sqlite3.connect(DB_PATH)
    con.row_factory = sqlite3.Row
    rows = con.execute("SELECT id, payload_json FROM reports").fetchall()
    print(f"Updating {len(rows)} reports...")

    for row in rows:
        payload = json.loads(row["payload_json"] or "{}")
        total_members = random.randint(5, 12)
        n_visitors    = random.randint(0, 4)
        n_kids        = random.randint(0, 3)

        members  = fake_attendance(total_members)
        visitors = fake_visitors(n_visitors)
        kids     = fake_kids(n_kids)
        summary  = build_summary(members, visitors, kids)

        payload["memberAttendance"] = members
        payload["visitors"] = visitors
        payload["kids"] = kids
        payload["attendanceSummary"] = summary
        # Also add a few manual metric fields
        payload["multiplyTotalOfferings"]  = round(random.uniform(200, 1200), 2)
        payload["reachOffering"]           = round(random.uniform(50, 400), 2)

        con.execute("UPDATE reports SET payload_json=? WHERE id=?",
                    (json.dumps(payload, ensure_ascii=False), row["id"]))

    con.commit()
    con.close()
    print("Done.")

if __name__ == "__main__":
    main()
