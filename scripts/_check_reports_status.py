"""Check draft status and baptisms of reports 285/286."""
import json, ssl, urllib.request, sys
TOKEN = sys.argv[1]
URL = "https://reporte-celular-fabianmacias9122.aws-us-west-2.turso.io/v2/pipeline"
ctx = ssl.create_default_context()
sql = ("SELECT id, json_extract(payload_json,'$.cellNumber') AS cell, "
       "json_extract(payload_json,'$.week') AS week, "
       "json_extract(payload_json,'$.reportDate') AS date, "
       "json_extract(payload_json,'$._draft') AS draft, "
       "json_extract(payload_json,'$.baptisms') AS bap "
       "FROM reports WHERE id IN (285, 286)")
body = json.dumps({"requests":[{"type":"execute","stmt":{"sql":sql,"args":[]}},{"type":"close"}]}).encode()
req = urllib.request.Request(URL, data=body,
    headers={"Authorization":"Bearer "+TOKEN,"Content-Type":"application/json"}, method="POST")
r = json.loads(urllib.request.urlopen(req, context=ctx, timeout=30).read())
for row in r["results"][0]["response"]["result"]["rows"]:
    vals = [c.get("value") for c in row]
    print(f"id={vals[0]}  cell={vals[1]}  week={vals[2]}  date={vals[3]}  draft={vals[4]!r}  bap={vals[5]}")
