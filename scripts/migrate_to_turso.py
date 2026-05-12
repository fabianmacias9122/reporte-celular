"""Migra datos de SQLite local a Turso via HTTP API.

SEGURIDAD: usa INSERT OR IGNORE, NO borra ni sobreescribe filas existentes en Turso.

Uso:
  python migrate_to_turso.py                # migra todo (catalogos + reportes + settings)
  python migrate_to_turso.py --solo-tablas  # solo catalogos y dependencias (sin reports)
  python migrate_to_turso.py --insecure-ssl # ultimo recurso si SSL corporativo bloquea
"""
import sqlite3
import json
import urllib.request
import urllib.error
import ssl
import sys
from pathlib import Path

TURSO_URL   = "https://reporte-celular-fabianmacias9122.aws-us-west-2.turso.io"
TURSO_TOKEN = "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3Nzg1MjQ4OTAsImlkIjoiMDE5ZTE4NTYtMTYwMS03NDljLTg4ZDYtNDg0YTJhZjc0YzA3IiwicmlkIjoiMzJmZDY0NmYtMWNhYy00ZDcxLThmNTMtNmM1MzRmNDk4ODIxIn0.rVwGj_A9qN6QJ7gbj5ipbqoSM6sG90bf96hQmslHAa2M0dgQxmUEA0CIlTJxldil_-9o0B1ZuKKXj_R8dtkIDg"
DB_PATH     = Path(__file__).parent.parent / "data" / "reporte-celular.db"

ARGS = set(sys.argv[1:])
SOLO_TABLAS  = "--solo-tablas"  in ARGS
INSECURE_SSL = "--insecure-ssl" in ARGS

# Build SSL context with multiple fallbacks for corporate / Windows envs
def _build_ssl_ctx():
    if INSECURE_SSL:
        print("AVISO: --insecure-ssl activo, no se verificara el certificado del servidor.")
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE
        return ctx
    # 1) truststore (lee el almacen de certificados de Windows / OS)
    try:
        import truststore  # type: ignore
        return truststore.SSLContext(ssl.PROTOCOL_TLS_CLIENT)
    except Exception:
        pass
    # 2) certifi (CA bundle de Mozilla)
    try:
        import certifi
        return ssl.create_default_context(cafile=certifi.where())
    except Exception:
        pass
    # 3) sistema por defecto
    return ssl.create_default_context()

ssl_ctx = _build_ssl_ctx()


def turso_exec(sql: str, args: list):
    def to_arg(v):
        if v is None:
            return {"type": "null"}
        if isinstance(v, bool):
            return {"type": "integer", "value": str(int(v))}
        if isinstance(v, int):
            return {"type": "integer", "value": str(v)}
        if isinstance(v, float):
            return {"type": "float", "value": str(v)}
        return {"type": "text", "value": str(v)}

    body = json.dumps({
        "requests": [
            {"type": "execute", "stmt": {"sql": sql, "args": [to_arg(a) for a in args]}},
            {"type": "close"},
        ]
    }, ensure_ascii=False).encode("utf-8")

    req = urllib.request.Request(
        f"{TURSO_URL}/v2/pipeline",
        data=body,
        headers={
            "Authorization": f"Bearer {TURSO_TOKEN}",
            "Content-Type": "application/json; charset=utf-8",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, context=ssl_ctx, timeout=20) as resp:
            result = json.loads(resp.read())["results"][0]
    except urllib.error.HTTPError as e:
        msg = e.read().decode()
        if "UNIQUE" in msg:
            return "SKIP"
        print(f"  HTTP ERROR: {msg[:120]}")
        return "ERROR"

    if result.get("type") == "error":
        msg = result.get("error", {}).get("message", "")
        if "UNIQUE" in msg or "SQLITE_CONSTRAINT" in msg:
            return "SKIP"
        print(f"  ERROR: {msg[:120]}")
        return "ERROR"
    return "OK"


def main():
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row

    tables = {
        "people_catalog": (
            "INSERT OR IGNORE INTO people_catalog "
            "(id,name,role,phone,email,guardian_person_id,guardian_name,supervisor_sector,is_coordinator,rcm_progress,created_at,updated_at) "
            "VALUES (?,?,?,?,?,?,?,?,?,?,?,?)",
            lambda r: [r["id"],r["name"],r["role"],r["phone"],r["email"],r["guardian_person_id"],r["guardian_name"],r["supervisor_sector"],r["is_coordinator"],r["rcm_progress"],r["created_at"],r["updated_at"]]
        ),
        "cell_catalog": (
            "INSERT OR IGNORE INTO cell_catalog "
            "(id,cell_number,network_name,sector,zone_name,district_name,address,leader_person_id,assistant_person_id,host_person_id,created_at,updated_at) "
            "VALUES (?,?,?,?,?,?,?,?,?,?,?,?)",
            lambda r: [r["id"],r["cell_number"],r["network_name"],r["sector"],r["zone_name"],r["district_name"],r["address"],r["leader_person_id"],r["assistant_person_id"],r["host_person_id"],r["created_at"],r["updated_at"]]
        ),
        "cell_membership": (
            "INSERT OR IGNORE INTO cell_membership (cell_id,person_id,created_at) VALUES (?,?,?)",
            lambda r: [r["cell_id"],r["person_id"],r["created_at"]]
        ),
        "reports": (
            "INSERT OR IGNORE INTO reports "
            "(id,employee_name,area,device_model,imei,phone_number,status,notes,payload_json,created_at,updated_at) "
            "VALUES (?,?,?,?,?,?,?,?,?,?,?)",
            lambda r: [r["id"],r["employee_name"],r["area"],r["device_model"],r["imei"],r["phone_number"],r["status"],r["notes"],r["payload_json"],r["created_at"],r["updated_at"]]
        ),
        "app_settings": (
            "INSERT OR IGNORE INTO app_settings (key,value,updated_at) VALUES (?,?,?)",
            lambda r: [r["key"],r["value"],r["updated_at"]]
        ),
    }

    for table, (sql, row_fn) in tables.items():
        if SOLO_TABLAS and table == "reports":
            print(f"\nSaltando {table} (--solo-tablas)")
            continue
        rows = conn.execute(f"SELECT * FROM {table}").fetchall()
        print(f"\nMigrando {table} ({len(rows)} registros)...")
        ok = skip = err = 0
        for row in rows:
            res = turso_exec(sql, row_fn(row))
            if res == "OK":   ok   += 1
            elif res == "SKIP": skip += 1
            else:             err  += 1
        print(f"  OK={ok}  SKIP(ya existian)={skip}  ERROR={err}")

    conn.close()
    print("\nMigracion completada!")


if __name__ == "__main__":
    main()
