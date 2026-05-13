"""Crea los usuarios FabianAdmin (super-admin) y Savas Pacheco (Pastor)."""
import sqlite3
from datetime import datetime, timezone

DB = 'data/reporte-celular.db'
NOW = datetime.now(timezone.utc).isoformat(timespec='seconds')

USERS = [
    {"name": "FabianAdmin",   "is_coordinator": 1, "is_super_admin": 1},
    {"name": "Savas Pacheco", "is_coordinator": 1, "is_super_admin": 0},
]

c = sqlite3.connect(DB)
c.row_factory = sqlite3.Row

for u in USERS:
    existing = c.execute(
        "SELECT id, is_coordinator, is_super_admin FROM people_catalog WHERE lower(name)=lower(?)",
        (u["name"],),
    ).fetchone()
    if existing:
        c.execute(
            "UPDATE people_catalog SET is_coordinator=?, is_super_admin=?, updated_at=? WHERE id=?",
            (u["is_coordinator"], u["is_super_admin"], NOW, existing["id"]),
        )
        print(f"UPDATED id={existing['id']:>3}  {u['name']}  coord={u['is_coordinator']}  super={u['is_super_admin']}")
    else:
        cur = c.execute(
            "INSERT INTO people_catalog (name, role, is_coordinator, is_super_admin, created_at, updated_at) "
            "VALUES (?, 'member', ?, ?, ?, ?)",
            (u["name"], u["is_coordinator"], u["is_super_admin"], NOW, NOW),
        )
        print(f"CREATED id={cur.lastrowid:>3}  {u['name']}  coord={u['is_coordinator']}  super={u['is_super_admin']}")

c.commit()

print("\nResumen final (coordinadores y super-admins):")
for r in c.execute(
    "SELECT id, name, is_coordinator, is_super_admin FROM people_catalog "
    "WHERE is_coordinator=1 OR is_super_admin=1 ORDER BY is_super_admin DESC, name"
).fetchall():
    print(f"  id={r['id']:>3}  super={r['is_super_admin']}  coord={r['is_coordinator']}  {r['name']}")
