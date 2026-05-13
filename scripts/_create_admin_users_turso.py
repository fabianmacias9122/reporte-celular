"""Crea SOLO FabianAdmin (super-admin) y Savas Pacheco (Pastor) en Turso.

SEGURIDAD:
- NO toca reportes existentes.
- NO toca usuarios existentes.
- Si el usuario ya existe (case-insensitive), NO lo modifica (te avisa).
- Idempotente: puedes correrlo varias veces.

Uso:
  python scripts\\_create_admin_users_turso.py
"""
import json
import ssl
import sys
import urllib.request
from datetime import datetime, timezone

TURSO_URL   = "https://reporte-celular-fabianmacias9122.aws-us-west-2.turso.io"
TURSO_TOKEN = "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3Nzg1MjQ4OTAsImlkIjoiMDE5ZTE4NTYtMTYwMS03NDljLTg4ZDYtNDg0YTJhZjc0YzA3IiwicmlkIjoiMzJmZDY0NmYtMWNhYy00ZDcxLThmNTMtNmM1MzRmNDk4ODIxIn0.rVwGj_A9qN6QJ7gbj5ipbqoSM6sG90bf96hQmslHAa2M0dgQxmUEA0CIlTJxldil_-9o0B1ZuKKXj_R8dtkIDg"

NOW = datetime.now(timezone.utc).isoformat(timespec="seconds")

USERS = [
    {"name": "Fabian Admin",  "is_coordinator": 1, "is_super_admin": 1},
    {"name": "Savas Pacheco", "is_coordinator": 1, "is_super_admin": 0},
]


def _ssl_ctx():
    try:
        import truststore  # type: ignore
        return truststore.SSLContext(ssl.PROTOCOL_TLS_CLIENT)
    except Exception:
        pass
    try:
        import certifi
        return ssl.create_default_context(cafile=certifi.where())
    except Exception:
        pass
    return ssl.create_default_context()


SSL_CTX = _ssl_ctx()


def _to_arg(v):
    if v is None:
        return {"type": "null"}
    if isinstance(v, bool):
        return {"type": "integer", "value": str(int(v))}
    if isinstance(v, int):
        return {"type": "integer", "value": str(v)}
    if isinstance(v, float):
        return {"type": "float", "value": str(v)}
    return {"type": "text", "value": str(v)}


def turso_exec(sql, args=()):
    body = {
        "requests": [
            {"type": "execute", "stmt": {"sql": sql, "args": [_to_arg(a) for a in args]}},
            {"type": "close"},
        ]
    }
    req = urllib.request.Request(
        f"{TURSO_URL}/v2/pipeline",
        data=json.dumps(body).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {TURSO_TOKEN}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    with urllib.request.urlopen(req, context=SSL_CTX, timeout=30) as resp:
        out = json.loads(resp.read())
    result = out["results"][0]
    if result.get("type") == "error":
        raise RuntimeError(result.get("error", {}).get("message", "Turso error"))
    res = result.get("response", {}).get("result", {})
    cols = [c["name"] for c in res.get("cols", [])]
    rows = []
    for row in res.get("rows", []):
        rows.append({cols[i]: (v.get("value") if v.get("type") != "null" else None) for i, v in enumerate(row)})
    return rows, res.get("last_insert_rowid"), res.get("affected_row_count", 0)


def main():
    print(f"Conectando a Turso: {TURSO_URL}")

    # Verificar schema (las migraciones del backend ya deberian haber corrido)
    cols, _, _ = turso_exec("PRAGMA table_info(people_catalog)")
    col_names = {c["name"] for c in cols}
    if "is_super_admin" not in col_names:
        print("ERROR: la columna 'is_super_admin' aun no existe en Turso.")
        print("       Despliega primero el backend (Render) para que corra ensure_schema,")
        print("       luego vuelve a correr este script.")
        sys.exit(1)
    print("OK: columna 'is_super_admin' presente.")

    tabs, _, _ = turso_exec("SELECT name FROM sqlite_master WHERE type='table' AND name='user_credentials'")
    if not tabs:
        print("ERROR: la tabla 'user_credentials' aun no existe en Turso.")
        print("       Despliega primero el backend (Render) y vuelve a correr este script.")
        sys.exit(1)
    print("OK: tabla 'user_credentials' presente.")
    print()

    for u in USERS:
        existing, _, _ = turso_exec(
            "SELECT id, name, is_coordinator, is_super_admin FROM people_catalog WHERE lower(name)=lower(?)",
            (u["name"],),
        )
        if existing:
            row = existing[0]
            print(f"SKIP   id={row['id']:>4}  '{row['name']}' ya existe  (coord={row['is_coordinator']} super={row['is_super_admin']})")
            print(f"        --> NO se modifica. Si necesitas ajustar privilegios, hazlo manualmente.")
            continue
        _, new_id, _ = turso_exec(
            "INSERT INTO people_catalog (name, role, is_coordinator, is_super_admin, created_at, updated_at) "
            "VALUES (?, 'member', ?, ?, ?, ?)",
            (u["name"], u["is_coordinator"], u["is_super_admin"], NOW, NOW),
        )
        print(f"CREADO id={new_id:>4}  '{u['name']}'  coord={u['is_coordinator']}  super={u['is_super_admin']}")

    print()
    print("Resumen final en Turso (coordinadores y super-admins):")
    rows, _, _ = turso_exec(
        "SELECT id, name, is_coordinator, is_super_admin FROM people_catalog "
        "WHERE is_coordinator=1 OR is_super_admin=1 ORDER BY is_super_admin DESC, name"
    )
    for r in rows:
        print(f"  id={r['id']:>4}  super={r['is_super_admin']}  coord={r['is_coordinator']}  {r['name']}")


if __name__ == "__main__":
    main()
