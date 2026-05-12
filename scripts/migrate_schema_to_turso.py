"""Migra SOLO el esquema (tablas + indices) de SQLite local a Turso.

NO migra datos. Usa CREATE TABLE/INDEX IF NOT EXISTS, asi que es seguro:
no borra ni altera tablas/datos existentes en Turso.

Uso:
  python migrate_schema_to_turso.py              # aplica el esquema
  python migrate_schema_to_turso.py --dry-run    # solo imprime el SQL
  python migrate_schema_to_turso.py --insecure-ssl
"""
import sqlite3
import json
import re
import ssl
import sys
import urllib.request
import urllib.error
from pathlib import Path

TURSO_URL   = "https://reporte-celular-fabianmacias9122.aws-us-west-2.turso.io"
TURSO_TOKEN = "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3Nzg1MjQ4OTAsImlkIjoiMDE5ZTE4NTYtMTYwMS03NDljLTg4ZDYtNDg0YTJhZjc0YzA3IiwicmlkIjoiMzJmZDY0NmYtMWNhYy00ZDcxLThmNTMtNmM1MzRmNDk4ODIxIn0.rVwGj_A9qN6QJ7gbj5ipbqoSM6sG90bf96hQmslHAa2M0dgQxmUEA0CIlTJxldil_-9o0B1ZuKKXj_R8dtkIDg"
DB_PATH     = Path(__file__).parent.parent / "data" / "reporte-celular.db"

ARGS = set(sys.argv[1:])
DRY_RUN      = "--dry-run"      in ARGS
INSECURE_SSL = "--insecure-ssl" in ARGS


def _build_ssl_ctx():
    if INSECURE_SSL:
        print("AVISO: --insecure-ssl activo, no se verificara el certificado.")
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE
        return ctx
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


ssl_ctx = _build_ssl_ctx()


def turso_exec(sql: str) -> str:
    body = json.dumps({
        "requests": [
            {"type": "execute", "stmt": {"sql": sql}},
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
        print(f"  HTTP ERROR: {msg[:200]}")
        return "ERROR"

    if result.get("type") == "error":
        msg = result.get("error", {}).get("message", "")
        # Si la tabla/indice ya existe sin IF NOT EXISTS, lo tomamos como OK
        if "already exists" in msg.lower():
            return "SKIP"
        print(f"  ERROR: {msg[:200]}")
        return "ERROR"
    return "OK"


def ensure_if_not_exists(sql: str) -> str:
    # Inserta IF NOT EXISTS si no esta presente, para CREATE TABLE / INDEX / VIEW / TRIGGER
    pattern = re.compile(
        r"^\s*CREATE\s+(UNIQUE\s+)?(TABLE|INDEX|VIEW|TRIGGER)\s+(?!IF\s+NOT\s+EXISTS)",
        re.IGNORECASE,
    )
    return pattern.sub(lambda m: m.group(0) + "IF NOT EXISTS ", sql, count=1)


def main():
    conn = sqlite3.connect(str(DB_PATH))
    rows = conn.execute(
        "SELECT type, name, sql FROM sqlite_master "
        "WHERE sql IS NOT NULL "
        "  AND name NOT LIKE 'sqlite_%' "
        "ORDER BY CASE type "
        "  WHEN 'table' THEN 1 "
        "  WHEN 'index' THEN 2 "
        "  WHEN 'view' THEN 3 "
        "  WHEN 'trigger' THEN 4 "
        "  ELSE 5 END, name"
    ).fetchall()
    conn.close()

    print(f"Encontrados {len(rows)} objetos de esquema en {DB_PATH.name}\n")
    ok = skip = err = 0
    for typ, name, sql in rows:
        sql_safe = ensure_if_not_exists(sql.strip().rstrip(";"))
        print(f"[{typ}] {name}")
        if DRY_RUN:
            print(f"  -> {sql_safe[:160]}{'...' if len(sql_safe) > 160 else ''}")
            continue
        res = turso_exec(sql_safe)
        if   res == "OK":   ok   += 1
        elif res == "SKIP": skip += 1
        else:               err  += 1

    if not DRY_RUN:
        print(f"\nTotal: OK={ok}  SKIP(ya existia)={skip}  ERROR={err}")
        print("Esquema migrado. NO se tocaron datos.")
    else:
        print("\n(dry-run) No se envio nada a Turso.")


if __name__ == "__main__":
    main()
