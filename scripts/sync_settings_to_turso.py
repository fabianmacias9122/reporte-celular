"""Sincroniza SOLO app_settings: local SQLite -> Turso (UPSERT con sobreescritura).

NO toca: reports, people_catalog, cell_catalog, cell_membership.
"""
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

def turso_exec(sql, args=None):
    args = args or []
    def to_arg(v):
        if v is None: return {"type": "null"}
        if isinstance(v, int): return {"type": "integer", "value": str(v)}
        return {"type": "text", "value": str(v)}
    body = json.dumps({"requests":[
        {"type":"execute","stmt":{"sql":sql,"args":[to_arg(a) for a in args]}},
        {"type":"close"}
    ]}).encode()
    req = urllib.request.Request(f"{TURSO_URL}/v2/pipeline", data=body,
        headers={"Authorization":f"Bearer {TURSO_TOKEN}","Content-Type":"application/json"}, method="POST")
    with urllib.request.urlopen(req, context=CTX, timeout=20) as r:
        return json.loads(r.read())["results"][0]

c = sqlite3.connect(str(DB))
c.row_factory = sqlite3.Row

rows = list(c.execute("SELECT key, value, updated_at FROM app_settings ORDER BY key"))
print(f"Sincronizando {len(rows)} keys de app_settings hacia Turso (UPSERT)...\n")

# UPSERT: inserta o sobreescribe value+updated_at
sql = (
    "INSERT INTO app_settings (key, value, updated_at) VALUES (?, ?, ?) "
    "ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at"
)

ok = err = 0
for r in rows:
    res = turso_exec(sql, [r["key"], r["value"], r["updated_at"]])
    if res.get("type") == "error":
        print(f"  ERROR  [{r['key']}]: {res.get('error',{}).get('message','')[:120]}")
        err += 1
    else:
        preview = (r["value"] or "")[:60]
        print(f"  OK     [{r['key']}] = {preview}")
        ok += 1

print(f"\nResultado: OK={ok}  ERROR={err}")
