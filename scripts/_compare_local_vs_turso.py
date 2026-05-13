"""Compara contenido relevante entre local SQLite y Turso (solo lectura)."""
import sqlite3
import json
import urllib.request
import ssl
from pathlib import Path

TURSO_URL = "https://reporte-celular-fabianmacias9122.aws-us-west-2.turso.io"
TURSO_TOKEN = "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3Nzg1MjQ4OTAsImlkIjoiMDE5ZTE4NTYtMTYwMS03NDljLTg4ZDYtNDg0YTJhZjc0YzA3IiwicmlkIjoiMzJmZDY0NmYtMWNhYy00ZDcxLThmNTMtNmM1MzRmNDk4ODIxIn0.rVwGj_A9qN6QJ7gbj5ipbqoSM6sG90bf96hQmslHAa2M0dgQxmUEA0CIlTJxldil_-9o0B1ZuKKXj_R8dtkIDg"
DB = Path(__file__).parent.parent / "data" / "reporte-celular.db"

def _ctx():
    try:
        import truststore
        return truststore.SSLContext(ssl.PROTOCOL_TLS_CLIENT)
    except Exception:
        try:
            import certifi
            return ssl.create_default_context(cafile=certifi.where())
        except Exception:
            return ssl.create_default_context()

CTX = _ctx()

def turso_query(sql):
    body = json.dumps({"requests":[{"type":"execute","stmt":{"sql":sql}},{"type":"close"}]}).encode()
    req = urllib.request.Request(f"{TURSO_URL}/v2/pipeline", data=body,
        headers={"Authorization":f"Bearer {TURSO_TOKEN}","Content-Type":"application/json"}, method="POST")
    with urllib.request.urlopen(req, context=CTX, timeout=20) as r:
        data = json.loads(r.read())
    res = data["results"][0]["response"]["result"]
    cols = [c["name"] for c in res["cols"]]
    rows = []
    for raw in res["rows"]:
        rows.append({cols[i]: (None if v["type"]=="null" else v.get("value")) for i,v in enumerate(raw)})
    return rows

print("================ TURSO (remoto) ================\n")

print("--- counts ---")
for t in ["people_catalog","cell_catalog","cell_membership","reports","app_settings"]:
    n = turso_query(f"SELECT COUNT(*) AS n FROM {t}")[0]["n"]
    print(f"  {t}: {n}")

print("\n--- app_settings remoto ---")
for r in turso_query("SELECT key, value FROM app_settings ORDER BY key"):
    val = r["value"] or ""
    preview = val if len(val) <= 100 else val[:100] + "..."
    print(f"  [{r['key']}] {preview}")

print("\n--- cell_catalog remoto ---")
for r in turso_query("SELECT id, cell_number, sector, network_name FROM cell_catalog ORDER BY CAST(id AS INTEGER)"):
    print(f"  #{r['id']}  cell={r['cell_number']}  sector={r['sector']}  red={r['network_name']}")

print("\n================ LOCAL ================\n")
c = sqlite3.connect(str(DB)); c.row_factory = sqlite3.Row
print("--- counts ---")
for t in ["people_catalog","cell_catalog","cell_membership","reports","app_settings"]:
    print(f"  {t}: {c.execute(f'SELECT COUNT(*) FROM {t}').fetchone()[0]}")

print("\n--- app_settings local ---")
for r in c.execute("SELECT key, value FROM app_settings ORDER BY key"):
    val = (r["value"] or "")
    preview = val if len(val) <= 100 else val[:100] + "..."
    print(f"  [{r['key']}] {preview}")

print("\n--- cell_catalog local ---")
for r in c.execute("SELECT id, cell_number, sector, network_name FROM cell_catalog ORDER BY id"):
    print(f"  #{r['id']}  cell={r['cell_number']}  sector={r['sector']}  red={r['network_name']}")

print("\n================ DIFERENCIAS ================\n")

# settings diff
local_settings = {r["key"]: r["value"] for r in c.execute("SELECT key, value FROM app_settings")}
remote_settings = {r["key"]: r["value"] for r in turso_query("SELECT key, value FROM app_settings")}

only_local_keys  = sorted(set(local_settings) - set(remote_settings))
only_remote_keys = sorted(set(remote_settings) - set(local_settings))
diff_keys        = sorted(k for k in set(local_settings) & set(remote_settings) if local_settings[k] != remote_settings[k])

print("app_settings — solo en LOCAL (faltan en Turso):")
for k in only_local_keys:
    print(f"  + {k}")

print("\napp_settings — solo en TURSO (no estan en local):")
for k in only_remote_keys:
    print(f"  - {k}")

print("\napp_settings — valores DISTINTOS:")
for k in diff_keys:
    lv = (local_settings[k] or "")[:80]
    rv = (remote_settings[k] or "")[:80]
    print(f"  ~ {k}\n      local : {lv}\n      turso : {rv}")

# cell_catalog diff (por cell_number+sector)
local_cells  = {(r["cell_number"], r["sector"]) for r in c.execute("SELECT cell_number, sector FROM cell_catalog")}
remote_cells = {(r["cell_number"], r["sector"]) for r in turso_query("SELECT cell_number, sector FROM cell_catalog")}

print("\ncell_catalog — solo en LOCAL (faltan en Turso):")
for cn, sec in sorted(local_cells - remote_cells):
    print(f"  + cell {cn} sector {sec}")
print("\ncell_catalog — solo en TURSO (no estan en local):")
for cn, sec in sorted(remote_cells - local_cells):
    print(f"  - cell {cn} sector {sec}")
