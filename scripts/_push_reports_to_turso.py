"""Resetea la tabla `reports` en Turso y la repuebla con los reportes locales,
con IDs auto-incrementables nuevos comenzando en 1.

Uso:
  python scripts/_push_reports_to_turso.py <token>
"""
import json, os, ssl, sqlite3, sys, urllib.request
from pathlib import Path

TOKEN = sys.argv[1]
LOCAL_DB = Path(__file__).parent.parent / "data" / "reporte-celular.db"
URL = "https://reporte-celular-fabianmacias9122.aws-us-west-2.turso.io/v2/pipeline"
ctx = ssl.create_default_context()


def turso(sql, args=None):
    body = json.dumps({"requests": [
        {"type": "execute", "stmt": {"sql": sql, "args": args or []}},
        {"type": "close"},
    ]}).encode()
    req = urllib.request.Request(URL, data=body,
        headers={"Authorization": "Bearer " + TOKEN, "Content-Type": "application/json"}, method="POST")
    r = json.loads(urllib.request.urlopen(req, context=ctx, timeout=60).read())
    res = r["results"][0]
    if res.get("type") == "error":
        raise RuntimeError(f"{sql[:80]}... -> {res['error']}")
    return res["response"]["result"]


def turso_arg(value):
    if value is None:
        return {"type": "null"}
    if isinstance(value, int):
        return {"type": "integer", "value": str(value)}
    return {"type": "text", "value": str(value)}


# 1) Leer columnas y reportes locales (ordenados por id para preservar el orden cronologico)
con = sqlite3.connect(str(LOCAL_DB))
con.row_factory = sqlite3.Row
local_cols = [r["name"] for r in con.execute("PRAGMA table_info(reports)")]
non_id_cols = [c for c in local_cols if c != "id"]
local_rows = con.execute(f"SELECT {', '.join(non_id_cols)} FROM reports ORDER BY id ASC").fetchall()
print(f"Local: {len(local_rows)} reportes con columnas {non_id_cols}")

# 2) Wipe Turso reports + reset sqlite_sequence
print("\nLimpiando tabla reports en Turso...")
turso("DELETE FROM reports")
try:
    turso("DELETE FROM sqlite_sequence WHERE name='reports'")
    print("  sqlite_sequence reseteado.")
except Exception as e:
    print(f"  (sqlite_sequence: {e})")

# 3) Insertar reportes uno por uno, dejando que Turso asigne IDs nuevos
placeholders = ",".join(["?"] * len(non_id_cols))
sql = f"INSERT INTO reports ({', '.join(non_id_cols)}) VALUES ({placeholders})"

inserted = 0
new_ids = []
for row in local_rows:
    args = [turso_arg(row[c]) for c in non_id_cols]
    res = turso(sql, args)
    rid = res.get("last_insert_rowid")
    new_ids.append(rid)
    inserted += 1
    print(f"  insertado #{inserted} (Turso id={rid})")

# 4) Verificar
res = turso("SELECT COUNT(*) FROM reports")
turso_count = int(res["rows"][0][0]["value"])
print(f"\nTurso ahora tiene {turso_count} reportes. IDs nuevos: {new_ids}")

# 5) Re-sync local IDs to match Turso (asi quedan iguales)
print("\nSincronizando IDs locales con los de Turso...")
con.execute("DELETE FROM reports")
con.execute("DELETE FROM sqlite_sequence WHERE name='reports'")
local_rows_full = list(zip(new_ids, local_rows))
for new_id, row in local_rows_full:
    cols_with_id = ["id"] + non_id_cols
    vals = [new_id] + [row[c] for c in non_id_cols]
    ph = ",".join(["?"] * len(cols_with_id))
    con.execute(f"INSERT INTO reports ({', '.join(cols_with_id)}) VALUES ({ph})", vals)
con.execute("INSERT INTO sqlite_sequence(name, seq) VALUES (?, ?)", ("reports", max(new_ids) if new_ids else 0))
con.commit()
con.close()
print("Local sincronizado.")
print("\nListo.")
