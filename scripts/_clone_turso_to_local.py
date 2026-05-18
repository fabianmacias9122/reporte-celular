"""Clona TODAS las tablas de Turso al SQLite local (data/reporte-celular.db).

Borra las filas locales antes de insertar para garantizar mirror exacto.
NO toca el schema (asume que initialize_database del server ya lo creo).
"""
import json, os, ssl, sqlite3, sys, urllib.request

TOKEN = sys.argv[1]
LOCAL_DB = os.path.join(os.path.dirname(__file__), "..", "data", "reporte-celular.db")
LOCAL_DB = os.path.abspath(LOCAL_DB)
URL = "https://reporte-celular-fabianmacias9122.aws-us-west-2.turso.io/v2/pipeline"
ctx = ssl.create_default_context()

# Orden importa por foreign keys / refs logicas.
TABLES = [
    "app_settings",
    "people_catalog",
    "cell_catalog",
    "cell_membership",
    "user_credentials",
    "reports",
]


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
        raise RuntimeError(f"{sql[:60]}... -> {res['error']}")
    return res["response"]["result"]


def cell_value(cell):
    """Convierte una celda Turso ({type, value} | {type:'null'}) a su valor Python."""
    t = cell.get("type")
    v = cell.get("value")
    if t == "null" or v is None:
        return None
    if t == "integer":
        return int(v)
    if t == "float":
        return float(v)
    return v  # text / blob


print(f"Local DB: {LOCAL_DB}")
print(f"Turso URL: {URL}\n")

if not os.path.exists(LOCAL_DB):
    print("ERROR: la DB local no existe. Arranca el server primero (start-reporte-celular.ps1).")
    sys.exit(1)

con = sqlite3.connect(LOCAL_DB)
con.execute("PRAGMA foreign_keys = OFF")

for table in TABLES:
    print(f"--- {table} ---")
    # Schema columns from local DB (asumimos que coinciden con Turso porque ambos los crea el server).
    local_cols = [row[1] for row in con.execute(f"PRAGMA table_info({table})").fetchall()]
    if not local_cols:
        print(f"  (tabla no existe en local, skip)")
        continue

    # Pull from Turso
    res = turso(f"SELECT * FROM {table}")
    turso_cols = [c["name"] for c in res["cols"]]
    rows = res["rows"]
    # Solo columnas que existan en ambos (defensivo).
    common_cols = [c for c in turso_cols if c in local_cols]
    if common_cols != turso_cols:
        print(f"  WARN: columnas distintas. Turso={turso_cols} Local={local_cols}. Usando interseccion: {common_cols}")

    # Wipe local
    con.execute(f"DELETE FROM {table}")
    if not rows:
        con.commit()
        print(f"  vaciada (Turso tambien tenia 0 filas)")
        continue

    # Insert
    placeholders = ",".join(["?"] * len(common_cols))
    cols_sql = ",".join(common_cols)
    insert_sql = f"INSERT INTO {table} ({cols_sql}) VALUES ({placeholders})"
    inserted = 0
    for row in rows:
        # Map by Turso col name -> value
        idx_by_name = {name: i for i, name in enumerate(turso_cols)}
        values = [cell_value(row[idx_by_name[c]]) for c in common_cols]
        con.execute(insert_sql, values)
        inserted += 1
    con.commit()
    print(f"  insertadas {inserted} filas")

# Reset sqlite_sequence para evitar IDs colisionando si es AUTOINCREMENT
try:
    con.execute("DELETE FROM sqlite_sequence")
    for table in TABLES:
        max_row = con.execute(f"SELECT MAX(rowid) FROM {table}").fetchone()
        max_id = max_row[0] if max_row else None
        if max_id:
            con.execute("INSERT INTO sqlite_sequence(name, seq) VALUES (?, ?)", (table, max_id))
    con.commit()
    print("\nsqlite_sequence reajustado.")
except sqlite3.OperationalError as e:
    print(f"\n(sqlite_sequence no aplica: {e})")

con.close()
print("\nClonado completo.")
