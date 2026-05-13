import json, urllib.request, urllib.error

API = "http://127.0.0.1:8090/api"

def call(method, path, body=None, headers=None):
    data = json.dumps(body).encode() if body else None
    h = {"Content-Type": "application/json"}
    if headers: h.update(headers)
    req = urllib.request.Request(f"{API}{path}", data=data, headers=h, method=method)
    try:
        with urllib.request.urlopen(req, timeout=10) as r:
            return r.status, json.loads(r.read())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read())

PID = 50
print("clear cred"); import sqlite3
c = sqlite3.connect("data/reporte-celular.db"); c.execute("DELETE FROM user_credentials"); c.commit()

print("status:", call("GET", f"/auth/status/{PID}"))
print("login compat:", call("POST", "/auth/login", {"personId": PID, "password": ""}))
print("set-password:", call("POST", "/auth/set-password", {"personId": PID, "newPassword": "prueba123"}))
print("login good:", call("POST", "/auth/login", {"personId": PID, "password": "prueba123"}))
print("login bad (esperar 401):", call("POST", "/auth/login", {"personId": PID, "password": "mala"}))
print("set 2a sin reset (esperar 409):", call("POST", "/auth/set-password", {"personId": PID, "newPassword": "otra"}))
print("change OK:", call("POST", "/auth/change-password", {"personId": PID, "currentPassword": "prueba123", "newPassword": "nueva456"}))
print("login con nueva:", call("POST", "/auth/login", {"personId": PID, "password": "nueva456"}))
print("admin-reset por NO super-admin (esperar 403):", call("POST", f"/auth/admin-reset/{PID}", None, {"X-Acting-Person-Id": str(PID)}))
print("status final:", call("GET", f"/auth/status/{PID}"))
