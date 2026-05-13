"""Actualiza la baptismDate de Lizeth Vargas en el reporte indicado."""
import json, ssl, urllib.request, sys
from datetime import datetime, timezone

TOKEN = sys.argv[1]
REPORT_ID = int(sys.argv[2]) if len(sys.argv) > 2 else 286
NEW_DATE = sys.argv[3] if len(sys.argv) > 3 else "2026-04-26"
TARGET_NAME = "lizeth vargas"

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


rows = run("SELECT id, payload_json FROM reports WHERE id = ?",
           [{"type": "integer", "value": str(REPORT_ID)}])["rows"]
if not rows:
    print(f"No existe reporte id={REPORT_ID}")
    sys.exit(1)

payload = json.loads(rows[0][1].get("value", "{}"))
existing = payload.get("baptisms") or []
changed = False
for b in existing:
    if str(b.get("name", "")).strip().lower() == TARGET_NAME:
        old = b.get("baptismDate")
        if old != NEW_DATE:
            b["baptismDate"] = NEW_DATE
            changed = True
            print(f"  Lizeth: {old} -> {NEW_DATE}")
        else:
            print(f"  Lizeth ya tenia fecha {NEW_DATE}, nada que hacer.")

if not changed:
    sys.exit(0)

payload["baptisms"] = existing
new_json = json.dumps(payload, ensure_ascii=False)
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
