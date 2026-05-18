"""Clona SOLO las tablas de membresia (people_catalog, cell_catalog,
cell_membership) de Turso al SQLite local.

NO toca: user_credentials, app_settings, reports, weekly_approvals.
Hace backup automatico antes de modificar.

Uso:
    python scripts/_clone_turso_members_only.py <TURSO_TOKEN>

o, si TURSO_AUTH_TOKEN ya esta en el entorno:
    python scripts/_clone_turso_members_only.py
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

# Orden importa por FKs:
#   - people_catalog primero (sin dependencias externas).
#   - cell_catalog despues (FKs a people_catalog: leader/assistant/host_person_id).
#   - cell_membership al final (FKs a ambas).
TABLES_PULL_ORDER  = ["people_catalog", "cell_catalog", "cell_membership"]
TABLES_DELETE_ORDER = list(reversed(TABLES_PULL_ORDER))  # borrar hijos antes que padres

# Tablas explicitamente protegidas (no se tocan).
PROTECTED = ("user_credentials", "app_settings", "reports", "weekly_approvals")

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
        raise RuntimeError(f"{sql[:80]}... -> {res['error']}")
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


print(f"Local DB:    {LOCAL_DB}")
print(f"Turso URL:   {URL}")
print(f"Tablas:      {', '.join(TABLES_PULL_ORDER)}")
print(f"Protegidas:  {', '.join(PROTECTED)}\n")

if not os.path.exists(LOCAL_DB):
    print("ERROR: la DB local no existe. Arranca el server primero (start-reporte-celular.ps1).")
    sys.exit(1)

# Backup automatico
stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
backup_path = f"{LOCAL_DB}.bak-MEMBERS-{stamp}"
shutil.copy2(LOCAL_DB, backup_path)
print(f"Backup creado: {backup_path}\n")

con = sqlite3.connect(LOCAL_DB)
con.execute("PRAGMA foreign_keys = OFF")

# Salvaguarda: registrar conteos previos de tablas protegidas para validar al final
protected_counts_before = {}
for t in PROTECTED:
    try:
        protected_counts_before[t] = con.execute(f"SELECT COUNT(*) FROM {t}").fetchone()[0]
    except sqlite3.OperationalError:
        protected_counts_before[t] = None

# Pull desde Turso primero (asi si falla la red no borramos nada)
pulled = {}
for table in TABLES_PULL_ORDER:
    local_cols = [row[1] for row in con.execute(f"PRAGMA table_info({table})").fetchall()]
    if not local_cols:
        print(f"ERROR: la tabla {table} no existe en local.")
        sys.exit(1)
    res = turso(f"SELECT * FROM {table}")
    turso_cols = [c["name"] for c in res["cols"]]
    rows = res["rows"]
    common_cols = [c for c in turso_cols if c in local_cols]
    if common_cols != turso_cols:
        print(f"  WARN [{table}]: columnas distintas. Turso={turso_cols} Local={local_cols}")
        print(f"           interseccion: {common_cols}")
    print(f"  {table:<20} Turso={len(rows):>4}   local_cols={len(local_cols)}")
    pulled[table] = (turso_cols, common_cols, rows)

# Borrar en orden inverso (hijos primero)
for table in TABLES_DELETE_ORDER:
    before = con.execute(f"SELECT COUNT(*) FROM {table}").fetchone()[0]
    con.execute(f"DELETE FROM {table}")
    print(f"  DELETE {table:<20} (antes: {before})")

# Insertar en orden directo (padres primero)
for table in TABLES_PULL_ORDER:
    turso_cols, common_cols, rows = pulled[table]
    if not rows:
        continue
    placeholders = ",".join(["?"] * len(common_cols))
    cols_sql = ",".join(common_cols)
    insert_sql = f"INSERT INTO {table} ({cols_sql}) VALUES ({placeholders})"
    idx_by_name = {name: i for i, name in enumerate(turso_cols)}
    inserted = 0
    for row in rows:
        values = [cell_value(row[idx_by_name[c]]) for c in common_cols]
        con.execute(insert_sql, values)
        inserted += 1
    print(f"  INSERT {table:<20} +{inserted}")

# Reajustar sqlite_sequence solo para las tablas tocadas
for table in TABLES_PULL_ORDER:
    try:
        con.execute("DELETE FROM sqlite_sequence WHERE name = ?", (table,))
        max_row = con.execute(f"SELECT MAX(rowid) FROM {table}").fetchone()
        max_id = max_row[0] if max_row else None
        if max_id:
            con.execute("INSERT INTO sqlite_sequence(name, seq) VALUES (?, ?)", (table, max_id))
    except sqlite3.OperationalError:
        pass

# Verificar integridad de FKs antes de commit
fk_violations = con.execute("PRAGMA foreign_key_check").fetchall()
if fk_violations:
    print("\nERROR: violaciones de FK detectadas, abortando (no se hizo commit):")
    for v in fk_violations[:10]:
        print(f"   {v}")
    con.rollback()
    con.close()
    print(f"\nRestaura el backup si lo necesitas: {backup_path}")
    sys.exit(3)

# Salvaguarda: validar que las tablas protegidas no se tocaron
print("\nValidando tablas protegidas:")
ok = True
for t, before in protected_counts_before.items():
    if before is None:
        print(f"  {t:<20} (no existe localmente, ignorada)")
        continue
    after = con.execute(f"SELECT COUNT(*) FROM {t}").fetchone()[0]
    flag = "OK" if before == after else "CAMBIO!"
    if before != after:
        ok = False
    print(f"  {t:<20} antes={before} despues={after}  [{flag}]")

if not ok:
    print("\nERROR: una tabla protegida cambio. Abortando.")
    con.rollback()
    con.close()
    sys.exit(4)

con.commit()
con.close()
print(f"\nClonado de membresia completo. Backup en: {backup_path}")
print("user_credentials NO fue tocada — tus passwords de test siguen intactas.")
