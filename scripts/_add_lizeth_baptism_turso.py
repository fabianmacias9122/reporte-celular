"""Agrega Lizeth Vargas como bautismo en un reporte existente de Turso, sin tocar el resto del payload."""
import json, ssl, urllib.request, sys

TOKEN = sys.argv[1]
REPORT_ID = int(sys.argv[2]) if len(sys.argv) > 2 else 286
BAPTISM = {
    "name": "Lizeth Vargas",
    "baptismDate": "2026-04-30",
    "source": "fuera-cierre",
    "note": "",
    "promoteToMember": False,
}

URL = "https://reporte-celular-fabianmacias9122.aws-us-west-2.turso.io/v2/pipeline"
ctx = ssl.create_default_context()


def run(sql, args=None):
    body = json.dumps({"requests": [
        {"type": "execute", "stmt": {"sql": sql, "args": args or []}},
        {"type": "close"},
    ]}).encode()
    req = urllib.request.Request(URL, data=body,
        headers={"Authorization": "Bearer " + TOKEN, "Content-Type": "application/json"}, method="POST")
    r = json.loads(urllib.request.urlopen(req, context=ctx, timeout=30).read())
    res = r["results"][0]
    if res.get("type") == "error":
        raise RuntimeError(res["error"])
    return res["response"]["result"]


# 1) leer payload actual
rows = run("SELECT id, payload_json FROM reports WHERE id = ?",
           [{"type": "integer", "value": str(REPORT_ID)}])["rows"]
if not rows:
    print(f"No existe reporte id={REPORT_ID}")
    sys.exit(1)

payload = json.loads(rows[0][1].get("value", "{}"))
print(f"Reporte {REPORT_ID}  cell={payload.get('cellNumber')}  date={payload.get('reportDate')}")
print(f"  bautismos antes: {payload.get('baptisms', [])}")

# 2) idempotencia: si ya esta Lizeth con esa fecha, no duplicar
existing = payload.get("baptisms") or []
already = any(
    str(b.get("name", "")).strip().lower() == BAPTISM["name"].lower()
    and str(b.get("baptismDate", "")) == BAPTISM["baptismDate"]
    for b in existing
)
if already:
    print("  Lizeth Vargas ya esta registrada con esa fecha. Nada que hacer.")
    sys.exit(0)

existing.append(BAPTISM)
payload["baptisms"] = existing
new_json = json.dumps(payload, ensure_ascii=False)

# 3) actualizar SOLO payload_json + updated_at
from datetime import datetime, timezone
now = datetime.now(timezone.utc).isoformat(timespec="seconds")
res = run(
    "UPDATE reports SET payload_json = ?, updated_at = ? WHERE id = ?",
    [
        {"type": "text", "value": new_json},
        {"type": "text", "value": now},
        {"type": "integer", "value": str(REPORT_ID)},
    ],
)
print(f"  filas afectadas: {res.get('affected_row_count')}")
print(f"  bautismos despues: {payload['baptisms']}")
