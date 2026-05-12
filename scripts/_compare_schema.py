"""Compara el esquema local (SQLite) vs Turso (HTTP).

Uso:
    python scripts/_compare_schema.py
"""
import os, sys, sqlite3, json
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

LOCAL_DB = Path(__file__).resolve().parents[1] / "data" / "reporte-celular.db"

def local_schema():
    conn = sqlite3.connect(LOCAL_DB)
    cur = conn.cursor()
    rows = cur.execute(
        "SELECT name, sql FROM sqlite_master "
        "WHERE type IN ('table','index') AND name NOT LIKE 'sqlite_%' "
        "ORDER BY type, name"
    ).fetchall()
    out = {}
    for name, sql in rows:
        cols = cur.execute(f"PRAGMA table_info({name})").fetchall() if sql and sql.lower().startswith("create table") else []
        out[name] = {"sql": sql, "columns": [{"name": c[1], "type": c[2], "notnull": c[3], "pk": c[5]} for c in cols]}
    conn.close()
    return out

def turso_schema():
    url = os.environ.get("TURSO_DATABASE_URL")
    token = os.environ.get("TURSO_AUTH_TOKEN")
    if not url or not token:
        print("ERROR: TURSO_DATABASE_URL / TURSO_AUTH_TOKEN no configurados")
        sys.exit(1)
    import requests, certifi, urllib3
    urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
    api = url.rstrip("/") + "/v2/pipeline"
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    verify = False  # entorno corp con MITM SSL; este script es solo diagn\u00f3stico

    def q(sql):
        body = {"requests": [{"type": "execute", "stmt": {"sql": sql}}, {"type": "close"}]}
        r = requests.post(api, json=body, headers=headers, timeout=30, verify=verify)
        r.raise_for_status()
        data = r.json()["results"][0]
        if data.get("type") != "ok":
            raise RuntimeError(data)
        res = data["response"]["result"]
        cols = [c["name"] for c in res["cols"]]
        rows = []
        for row in res["rows"]:
            rows.append({cols[i]: (cell.get("value") if isinstance(cell, dict) else cell) for i, cell in enumerate(row)})
        return rows

    schema = {}
    rows = q("SELECT name, sql FROM sqlite_master WHERE type IN ('table','index') AND name NOT LIKE 'sqlite_%' ORDER BY type, name")
    for r in rows:
        name = r["name"]
        sql = r["sql"]
        cols = []
        if sql and sql.lower().startswith("create table"):
            crows = q(f"PRAGMA table_info({name})")
            for c in crows:
                cols.append({"name": c.get("name"), "type": c.get("type"), "notnull": c.get("notnull"), "pk": c.get("pk")})
        schema[name] = {"sql": sql, "columns": cols}
    return schema

if __name__ == "__main__":
    local = local_schema()
    turso = turso_schema()
    all_keys = sorted(set(local.keys()) | set(turso.keys()))
    diffs = 0
    for k in all_keys:
        l = local.get(k)
        t = turso.get(k)
        if l is None:
            print(f"[SOLO TURSO] {k}")
            diffs += 1
            continue
        if t is None:
            print(f"[SOLO LOCAL] {k}")
            diffs += 1
            continue
        lcols = {c["name"]: c for c in l["columns"]}
        tcols = {c["name"]: c for c in t["columns"]}
        missing_in_turso = set(lcols) - set(tcols)
        missing_in_local = set(tcols) - set(lcols)
        type_mismatch = [n for n in (set(lcols) & set(tcols)) if str(lcols[n]["type"]).upper() != str(tcols[n]["type"]).upper()]
        if missing_in_turso or missing_in_local or type_mismatch:
            print(f"[DIFF] {k}")
            if missing_in_turso: print(f"  faltan en Turso: {sorted(missing_in_turso)}")
            if missing_in_local: print(f"  faltan en Local: {sorted(missing_in_local)}")
            if type_mismatch:    print(f"  tipos distintos: {type_mismatch}")
            diffs += 1
        else:
            print(f"[OK] {k} ({len(lcols)} cols)")
    print(f"\n=== {diffs} diferencias ===")
