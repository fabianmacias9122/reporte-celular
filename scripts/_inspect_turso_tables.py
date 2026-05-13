"""Lista tablas y columnas relevantes en Turso."""
import json, ssl, urllib.request, sys

TOKEN = sys.argv[1]
URL = "https://reporte-celular-fabianmacias9122.aws-us-west-2.turso.io/v2/pipeline"
ctx = ssl.create_default_context()

def run(sql, args=None):
    body = json.dumps({"requests": [
        {"type": "execute", "stmt": {"sql": sql, "args": args or []}},
        {"type": "close"},
    ]}).encode()
    req = urllib.request.Request(URL, data=body, headers={"Authorization": "Bearer " + TOKEN, "Content-Type": "application/json"}, method="POST")
    r = json.loads(urllib.request.urlopen(req, context=ctx, timeout=30).read())
    res = r["results"][0]
    if res.get("type") == "error":
        print("ERROR:", res["error"])
        return []
    return res["response"]["result"]["rows"]

print("=== TABLAS ===")
for row in run("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"):
    print(" -", row[0].get("value"))

# busca tablas que contengan 'cell' o 'report'
print("\n=== Posibles tablas de reportes celulares ===")
candidates = [r[0].get("value") for r in run("SELECT name FROM sqlite_master WHERE type='table' AND (name LIKE '%cell%' OR name LIKE '%report%' OR name LIKE '%baut%' OR name LIKE '%form%')")]
for t in candidates:
    print(f"\n--- {t} ---")
    for row in run(f"PRAGMA table_info({t})"):
        print(" ", [c.get("value") for c in row])
