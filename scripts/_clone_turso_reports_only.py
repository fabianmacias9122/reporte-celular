"""Clona SOLO la tabla `reports` de Turso al SQLite local.

Hace un backup automatico de la DB local antes de modificarla.
NO toca ninguna otra tabla (people_catalog, cell_catalog, settings, etc).

Uso:
    python scripts/_clone_turso_reports_only.py <TURSO_TOKEN>

o, si TURSO_AUTH_TOKEN ya esta en el entorno:
    python scripts/_clone_turso_reports_only.py
"""
import json
import os
import shutil
import ssl
import sqlite3
import sys
import urllib.request
from datetime import datetime

TOKEN = sys.argv[1] if len(sys.argv) > 1 else os.environ.get("TURSO_AUTH_TOKEN", "")
if not TOKEN:
    print("ERROR: pasa el token como argv[1] o exporta TURSO_AUTH_TOKEN.")
    sys.exit(2)

LOCAL_DB = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data", "reporte-celular.db"))
URL = "https://reporte-celular-fabianmacias9122.aws-us-west-2.turso.io/v2/pipeline"
TABLE = "reports"
ctx = ssl.create_default_context()


def turso(sql, args=None):
    body = json.dumps({"requests": [
        {"type": "execute", "stmt": {"sql": sql, "args": args or []}},
        {"type": "close"},
    ]}).encode()
    req = urllib.request.Request(
        URL, data=body,
        headers={"Authorization": "Bearer " + TOKEN, "Content-Type": "application/json"},
        method="POST",
    )
    r = json.loads(urllib.request.urlopen(req, context=ctx, timeout=60).read())
    res = r["results"][0]
    if res.get("type") == "error":
        raise RuntimeError(f"{sql[:60]}... -> {res['error']}")
    return res["response"]["result"]


def cell_value(cell):
    t = cell.get("type")
    v = cell.get("value")
    if t == "null" or v is None:
        return None
    if t == "integer":
        return int(v)
    if t == "float":
        return float(v)
    return v


print(f"Local DB:  {LOCAL_DB}")
print(f"Turso URL: {URL}")
print(f"Tabla:     {TABLE}\n")

if not os.path.exists(LOCAL_DB):
    print("ERROR: la DB local no existe. Arranca el server primero (start-reporte-celular.ps1).")
    sys.exit(1)

# Backup automatico
stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
backup_path = f"{LOCAL_DB}.bak-REPORTS-{stamp}"
shutil.copy2(LOCAL_DB, backup_path)
print(f"Backup creado: {backup_path}\n")

con = sqlite3.connect(LOCAL_DB)
con.execute("PRAGMA foreign_keys = OFF")

# Verificar que existe la tabla local
local_cols = [row[1] for row in con.execute(f"PRAGMA table_info({TABLE})").fetchall()]
if not local_cols:
    print(f"ERROR: la tabla {TABLE} no existe en local.")
    sys.exit(1)

# Pull from Turso
res = turso(f"SELECT * FROM {TABLE}")
turso_cols = [c["name"] for c in res["cols"]]
rows = res["rows"]

common_cols = [c for c in turso_cols if c in local_cols]
if common_cols != turso_cols:
    print(f"  WARN: columnas distintas. Turso={turso_cols} Local={local_cols}.")
    print(f"        Usando interseccion: {common_cols}\n")

local_count = con.execute(f"SELECT COUNT(*) FROM {TABLE}").fetchone()[0]
print(f"Filas locales antes: {local_count}")
print(f"Filas en Turso:      {len(rows)}")

con.execute(f"DELETE FROM {TABLE}")

if rows:
    placeholders = ",".join(["?"] * len(common_cols))
    cols_sql = ",".join(common_cols)
    insert_sql = f"INSERT INTO {TABLE} ({cols_sql}) VALUES ({placeholders})"
    idx_by_name = {name: i for i, name in enumerate(turso_cols)}
    inserted = 0
    for row in rows:
        values = [cell_value(row[idx_by_name[c]]) for c in common_cols]
        con.execute(insert_sql, values)
        inserted += 1
    print(f"Insertadas {inserted} filas.")

# Reajustar sqlite_sequence solo para la tabla reports
try:
    con.execute("DELETE FROM sqlite_sequence WHERE name = ?", (TABLE,))
    max_row = con.execute(f"SELECT MAX(rowid) FROM {TABLE}").fetchone()
    max_id = max_row[0] if max_row else None
    if max_id:
        con.execute("INSERT INTO sqlite_sequence(name, seq) VALUES (?, ?)", (TABLE, max_id))
    print("sqlite_sequence reajustado.")
except sqlite3.OperationalError as e:
    print(f"(sqlite_sequence no aplica: {e})")

con.commit()
con.close()
print(f"\nClonado de '{TABLE}' completo. Backup en: {backup_path}")
