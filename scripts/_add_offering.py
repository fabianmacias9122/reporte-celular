import json, random, urllib.request

random.seed(1)
API = "http://127.0.0.1:8090/api"
reports = json.loads(urllib.request.urlopen(f"{API}/reports").read())["reports"]
for r in reports:
    fd = r["formData"]
    amount = random.randint(350, 1500)
    fd["reachOffering"] = amount
    if "attendanceSummary" in fd:
        fd["attendanceSummary"]["reachOffering"] = amount
    body = json.dumps(fd).encode()
    rid = r["id"]
    req = urllib.request.Request(
        f"{API}/reports/{rid}",
        data=body,
        headers={"Content-Type": "application/json"},
        method="PUT",
    )
    urllib.request.urlopen(req).read()
    print(f"celula {r['cellNumber']} (id={rid}) -> ofrenda ${amount}")
