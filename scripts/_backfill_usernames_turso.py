"""Backfill de username 'nombre.apellido' en Turso PRODUCCION.

SEGURIDAD:
- Idempotente.
- NO toca usuarios que ya tengan username.
- NO toca personas que no pueden iniciar sesion (kids, anfitriones, miembros).
- NO toca reportes ni user_credentials.
- Valida que la columna 'username' exista (la migra el backend en el deploy).
"""
import json
import re
import ssl
import sys
import unicodedata
import urllib.request
from datetime import datetime, timezone

TURSO_URL   = "https://reporte-celular-fabianmacias9122.aws-us-west-2.turso.io"
TURSO_TOKEN = "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3Nzg1MjQ4OTAsImlkIjoiMDE5ZTE4NTYtMTYwMS03NDljLTg4ZDYtNDg0YTJhZjc0YzA3IiwicmlkIjoiMzJmZDY0NmYtMWNhYy00ZDcxLThmNTMtNmM1MzRmNDk4ODIxIn0.rVwGj_A9qN6QJ7gbj5ipbqoSM6sG90bf96hQmslHAa2M0dgQxmUEA0CIlTJxldil_-9o0B1ZuKKXj_R8dtkIDg"

NOW = datetime.now(timezone.utc).isoformat(timespec="seconds")


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
    return rows


def normalize(raw: str) -> str:
    s = unicodedata.normalize("NFKD", raw or "").encode("ascii", "ignore").decode("ascii")
    s = s.lower().strip()
    s = re.sub(r"[^a-z0-9._-]+", "", s)
    return s


def can_login(person, cells):
    if person['role'] == 'kid':
        return False
    if person['is_coordinator']:
        return True
    if person['supervisor_sector']:
        return True
    pid = person['id']
    return any(
        (c.get('leader_person_id') == pid) or (c.get('assistant_person_id') == pid)
        for c in cells
    )


def generate_base(name: str) -> str:
    parts = [normalize(p) for p in (name or '').split() if normalize(p)]
    if not parts:
        return ''
    if len(parts) == 1:
        return parts[0]
    return f"{parts[0]}.{parts[1]}"


def main():
    print(f"Conectando a Turso: {TURSO_URL}")
    cols = turso_exec("PRAGMA table_info(people_catalog)")
    col_names = {c["name"] for c in cols}
    if "username" not in col_names:
        print("ERROR: la columna 'username' aun no existe en Turso.")
        print("       Despliega primero el backend (Render) para que corra ensure_schema,")
        print("       luego vuelve a correr este script.")
        sys.exit(1)
    print("OK: columna 'username' presente.")

    people_raw = turso_exec(
        "SELECT id, name, role, is_coordinator, supervisor_sector, username FROM people_catalog"
    )
    cells_raw = turso_exec(
        "SELECT leader_person_id, assistant_person_id FROM cell_catalog"
    )
    # cast tipos
    people = []
    for p in people_raw:
        people.append({
            "id": int(p["id"]),
            "name": p["name"] or "",
            "role": p["role"] or "member",
            "is_coordinator": int(p["is_coordinator"] or 0),
            "supervisor_sector": p["supervisor_sector"] or "",
            "username": p["username"] or "",
        })
    cells = [{
        "leader_person_id": int(c["leader_person_id"]) if c.get("leader_person_id") is not None else None,
        "assistant_person_id": int(c["assistant_person_id"]) if c.get("assistant_person_id") is not None else None,
    } for c in cells_raw]

    used = {p["username"].lower() for p in people if p["username"]}

    created = []
    skipped_existing = []

    for p in people:
        if p["username"]:
            skipped_existing.append((p["id"], p["name"], p["username"]))
            continue
        if not can_login(p, cells):
            continue
        base = generate_base(p["name"])
        if not base:
            continue
        candidate = base
        n = 2
        while candidate in used:
            candidate = f"{base}{n}"
            n += 1
        used.add(candidate)
        turso_exec(
            "UPDATE people_catalog SET username=?, updated_at=? WHERE id=?",
            (candidate, NOW, p["id"]),
        )
        created.append((p["id"], p["name"], candidate))

    print(f"\n=== Usernames creados en Turso: {len(created)} ===")
    for pid, name, u in created:
        print(f"  id={pid:>4}  {u:<25}  ({name})")
    print(f"\n=== Ya tenian username (sin cambios): {len(skipped_existing)} ===")
    for pid, name, u in skipped_existing:
        print(f"  id={pid:>4}  {u:<25}  ({name})")


if __name__ == "__main__":
    main()
