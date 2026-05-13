"""Lista reportes de la celula 6 / 2026 en Turso (payload_json)."""
import json, ssl, urllib.request, sys

TOKEN = sys.argv[1]
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
    return res["response"]["result"]["rows"]


sql = """
SELECT id, device_model, payload_json
FROM reports
WHERE (json_extract(payload_json, '$.cellNumber') = '6' OR device_model = '6')
  AND substr(json_extract(payload_json, '$.reportDate'), 1, 4) = '2026'
ORDER BY json_extract(payload_json, '$.reportDate')
"""

rows = run(sql)
print(f"Reportes celula 6 / 2026: {len(rows)}\n")
for row in rows:
    rid = row[0].get("value")
    dm = row[1].get("value")
    pj = row[2].get("value", "{}")
    try:
        p = json.loads(pj)
    except Exception:
        p = {}
    bap = p.get("baptisms", []) or []
    nombres = [f"{b.get('name','?')} ({b.get('baptismDate','?')})" for b in bap]
    print(f"  id={rid}  cell={p.get('cellNumber') or dm}  week={p.get('week')}  date={p.get('reportDate')}  bautismos={nombres}")
