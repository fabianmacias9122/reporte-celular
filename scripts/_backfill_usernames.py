"""Genera username 'nombre.apellido' para todos los que pueden iniciar sesion.

SEGURIDAD:
- NO toca usuarios sin login (miembros, ninos, anfitriones).
- NO sobreescribe usernames ya asignados.
- Garantiza unicidad agregando sufijo numerico si hay colision.
- Idempotente.
"""
import re
import sqlite3
import unicodedata
from datetime import datetime, timezone

DB = 'data/reporte-celular.db'
NOW = datetime.now(timezone.utc).isoformat(timespec='seconds')


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
    return any(c['leader_person_id'] == pid or c['assistant_person_id'] == pid for c in cells)


def generate_base(name: str) -> str:
    parts = [normalize(p) for p in (name or '').split() if normalize(p)]
    if not parts:
        return ''
    if len(parts) == 1:
        return parts[0]
    # nombre + primer apellido
    return f"{parts[0]}.{parts[1]}"


def main():
    c = sqlite3.connect(DB)
    c.row_factory = sqlite3.Row

    people = [dict(r) for r in c.execute(
        "SELECT id, name, role, is_coordinator, supervisor_sector, username FROM people_catalog"
    ).fetchall()]
    cells = [dict(r) for r in c.execute(
        "SELECT leader_person_id, assistant_person_id FROM cell_catalog"
    ).fetchall()]
    used = {(p['username'] or '').lower() for p in people if p['username']}

    created = []
    skipped_existing = []
    skipped_no_login = []

    for p in people:
        if p['username']:
            skipped_existing.append((p['id'], p['name'], p['username']))
            continue
        if not can_login(p, cells):
            skipped_no_login.append((p['id'], p['name']))
            continue
        base = generate_base(p['name'])
        if not base:
            print(f"WARN id={p['id']} '{p['name']}' no se pudo generar username (nombre vacio)")
            continue
        candidate = base
        n = 2
        while candidate in used:
            candidate = f"{base}{n}"
            n += 1
        used.add(candidate)
        c.execute("UPDATE people_catalog SET username=?, updated_at=? WHERE id=?",
                  (candidate, NOW, p['id']))
        created.append((p['id'], p['name'], candidate))

    c.commit()

    print(f"\n=== Usernames creados: {len(created)} ===")
    for pid, name, u in created:
        print(f"  id={pid:>3}  {u:<25}  ({name})")
    print(f"\n=== Ya tenian username: {len(skipped_existing)} ===")
    for pid, name, u in skipped_existing:
        print(f"  id={pid:>3}  {u:<25}  ({name})")
    print(f"\n=== Sin acceso a login (no se les genero): {len(skipped_no_login)} ===")


if __name__ == '__main__':
    main()
