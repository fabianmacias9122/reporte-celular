from __future__ import annotations

import hashlib
import hmac
import json
import math
import os
import secrets
import sqlite3
from datetime import datetime, date, timezone
from pathlib import Path

import requests as _requests
import certifi as _certifi
import os as _os
_os.environ.setdefault("REQUESTS_CA_BUNDLE", _certifi.where())
_http = _requests.Session()
_http.verify = _certifi.where()
from flask import Flask, Response, jsonify, request, send_from_directory


# ── Turso HTTP adapter (sqlite3-compatible interface) ──────────────────────────

class _TursoRow:
    """Emulates sqlite3.Row: supports dict-style and index access."""
    __slots__ = ("_data", "_keys")
    def __init__(self, keys, values):
        self._keys = [k.lower() for k in keys]
        self._data = dict(zip(self._keys, values))
    def __getitem__(self, key):
        if isinstance(key, int):
            return list(self._data.values())[key]
        return self._data[key.lower()]
    def __iter__(self):
        return iter(self._data.values())
    def keys(self):
        return self._keys


class _TursoCursor:
    def __init__(self, conn):
        self._conn = conn
        self.lastrowid = None
        self.rowcount = 0
        self._rows = []
        self._columns = []

    def _exec(self, sql: str, params=()):
        args = []
        for p in params:
            if p is None:
                args.append({"type": "null"})
            elif isinstance(p, bool):
                args.append({"type": "integer", "value": str(int(p))})
            elif isinstance(p, int):
                args.append({"type": "integer", "value": str(p)})
            elif isinstance(p, float):
                args.append({"type": "float", "value": str(p)})
            else:
                args.append({"type": "text", "value": str(p)})

        body = {
            "requests": [
                {"type": "execute", "stmt": {"sql": sql, "args": args}},
                {"type": "close"},
            ]
        }
        resp = _http.post(
            f"{self._conn._url}/v2/pipeline",
            json=body,
            headers={"Authorization": f"Bearer {self._conn._token}"},
            timeout=15,
        )
        resp.raise_for_status()
        result = resp.json()["results"][0]
        if result.get("type") == "error":
            msg = result.get("error", {}).get("message", "Turso error")
            if "UNIQUE constraint" in msg or "SQLITE_CONSTRAINT_UNIQUE" in msg:
                raise sqlite3.IntegrityError(msg)
            raise Exception(msg)

        cols = [c["name"] for c in result.get("response", {}).get("result", {}).get("cols", [])]
        rows_raw = result.get("response", {}).get("result", {}).get("rows", [])
        self._columns = cols
        self._rows = [_TursoRow(cols, [v.get("value") if v.get("type") != "null" else None for v in row]) for row in rows_raw]

        # last insert rowid
        af = result.get("response", {}).get("result", {}).get("affected_row_count", 0)
        self.rowcount = af
        lr = result.get("response", {}).get("result", {}).get("last_insert_rowid")
        if lr is not None:
            self.lastrowid = int(lr)
        return self

    def fetchone(self):
        return self._rows[0] if self._rows else None

    def fetchall(self):
        return self._rows


class _TursoConnection:
    def __init__(self, url: str, token: str):
        self._url = url.rstrip("/")
        self._token = token
        self.row_factory = None
        self._pending: list[tuple] = []

    def execute(self, sql: str, params=()):
        cur = _TursoCursor(self)
        self._pending.append((sql, params))
        cur._exec(sql, params)
        return cur

    def executemany(self, sql: str, seq):
        for params in seq:
            self.execute(sql, params)
        return self

    def commit(self):
        self._pending.clear()

    def sync(self):
        pass  # no-op for HTTP API

    def __enter__(self):
        return self

    def __exit__(self, *_):
        self.commit()

PROJECT_ROOT = Path(__file__).resolve().parent.parent
PUBLIC_DIR = PROJECT_ROOT / "public"
DATA_DIR = PROJECT_ROOT / "data"
DB_PATH = DATA_DIR / "reporte-celular.db"
TURSO_URL = os.environ.get("TURSO_DATABASE_URL", "")
TURSO_TOKEN = os.environ.get("TURSO_AUTH_TOKEN", "")
DEFAULT_PORT = int(os.environ.get("PORT", "8090"))
REQUIRED_FIELDS = ("week", "cellNumber", "sector", "leaderName", "reportDate")
VALID_PERSON_ROLES = ("leader", "assistant", "host", "member", "kid", "all")


# ── Password hashing (PBKDF2-SHA256, 200k iters) ─────────────────────────────
PBKDF2_ITERS = 200_000

def _hash_password(plain: str) -> str:
    salt = secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac("sha256", plain.encode("utf-8"), salt, PBKDF2_ITERS)
    return f"pbkdf2_sha256${PBKDF2_ITERS}${salt.hex()}${digest.hex()}"

def _verify_password(plain: str, stored: str) -> bool:
    try:
        algo, iters_str, salt_hex, digest_hex = stored.split("$")
        if algo != "pbkdf2_sha256":
            return False
        iters = int(iters_str)
        salt = bytes.fromhex(salt_hex)
        expected = bytes.fromhex(digest_hex)
        actual = hashlib.pbkdf2_hmac("sha256", plain.encode("utf-8"), salt, iters)
        return hmac.compare_digest(expected, actual)
    except Exception:
        return False


# ── Username helpers ─────────────────────────────────────────────────────────
import re
import unicodedata

def _normalize_username(raw: str) -> str:
    """Username canonico: minusculas, ASCII, solo [a-z0-9._-]."""
    if not raw:
        return ""
    s = unicodedata.normalize("NFKD", str(raw)).encode("ascii", "ignore").decode("ascii")
    s = s.lower().strip()
    s = re.sub(r"[^a-z0-9._-]+", "", s)
    return s

def _is_valid_username(u: str) -> bool:
    return bool(u) and 2 <= len(u) <= 40 and bool(re.fullmatch(r"[a-z0-9](?:[a-z0-9._-]*[a-z0-9])?", u))


def create_app() -> Flask:
    app = Flask(__name__, static_folder=str(PUBLIC_DIR), static_url_path="")
    initialize_database()

    @app.get("/")
    def index() -> Response:
        return send_from_directory(PUBLIC_DIR, "index.html")

    @app.get("/api/health")
    def health() -> Response:
        db_label = TURSO_URL.split("@")[-1] if TURSO_URL else str(DB_PATH)
        return jsonify({"ok": True, "title": "Reporte Celular", "database": db_label})

    # ── AUTH ────────────────────────────────────────────────────────────────
    @app.get("/api/auth/lookup/<string:username>")
    def auth_lookup(username: str) -> Response:
        """Resuelve username -> { personId, name, hasPassword, mustChange }.
        Devuelve 404 si el username no existe.
        """
        u = _normalize_username(username)
        if not u:
            return jsonify({"message": "Usuario inválido"}), 400
        with get_connection() as connection:
            person = connection.execute(
                "SELECT id, name FROM people_catalog WHERE lower(username) = ?",
                (u,),
            ).fetchone()
            if not person:
                return jsonify({"message": "Usuario no encontrado"}), 404
            cred = connection.execute(
                "SELECT password_hash, must_change FROM user_credentials WHERE person_id = ?",
                (person["id"],),
            ).fetchone()
        has_pw = bool(cred and cred["password_hash"])
        return jsonify({
            "personId": person["id"],
            "name": person["name"],
            "hasPassword": has_pw,
            "mustChange": bool(int(cred["must_change"] or 0)) if cred else False,
        })

    @app.get("/api/auth/status/<int:person_id>")
    def auth_status(person_id: int) -> Response:
        """Devuelve si la persona ya tiene password registrado y si debe cambiarla."""
        with get_connection() as connection:
            row = connection.execute(
                "SELECT password_hash, must_change FROM user_credentials WHERE person_id = ?",
                (person_id,),
            ).fetchone()
        if not row or not row["password_hash"]:
            return jsonify({"hasPassword": False, "mustChange": False})
        return jsonify({"hasPassword": True, "mustChange": bool(int(row["must_change"] or 0))})

    @app.post("/api/auth/login")
    def auth_login() -> Response:
        payload = read_payload() or {}
        person_id = normalize_nullable_int(payload.get("personId"))
        username  = _normalize_username(payload.get("username") or "")
        password  = str(payload.get("password") or "")
        with get_connection() as connection:
            person_row = None
            if person_id:
                person_row = connection.execute(
                    "SELECT * FROM people_catalog WHERE id = ?", (person_id,)
                ).fetchone()
            elif username:
                person_row = connection.execute(
                    "SELECT * FROM people_catalog WHERE lower(username) = ?", (username,)
                ).fetchone()
            else:
                return jsonify({"message": "username o personId requerido"}), 400
            if not person_row:
                return jsonify({"message": "Usuario no encontrado"}), 404
            person_id = person_row["id"]
            cred_row = connection.execute(
                "SELECT password_hash, must_change FROM user_credentials WHERE person_id = ?",
                (person_id,),
            ).fetchone()
            # Sin password registrado: login pasa (compatibilidad), pero indicamos al cliente.
            if not cred_row or not cred_row["password_hash"]:
                return jsonify({"ok": True, "personId": person_id, "hasPassword": False, "mustChange": False})
            if not _verify_password(password, cred_row["password_hash"]):
                return jsonify({"message": "Contraseña incorrecta"}), 401
            return jsonify({
                "ok": True,
                "personId": person_id,
                "hasPassword": True,
                "mustChange": bool(int(cred_row["must_change"] or 0)),
            })

    @app.post("/api/auth/set-password")
    def auth_set_password() -> Response:
        """Crea password por primera vez o cuando must_change=true.
        Requiere personId + newPassword. Si ya tiene password y NO está marcada
        must_change, se debe usar /api/auth/change-password (que pide currentPassword).
        """
        payload = read_payload() or {}
        person_id = normalize_nullable_int(payload.get("personId"))
        new_pw    = str(payload.get("newPassword") or "")
        if not person_id:
            return jsonify({"message": "personId requerido"}), 400
        if len(new_pw) < 6:
            return jsonify({"message": "La contraseña debe tener al menos 6 caracteres"}), 400
        with get_connection() as connection:
            cred = connection.execute(
                "SELECT password_hash, must_change FROM user_credentials WHERE person_id = ?",
                (person_id,),
            ).fetchone()
            if cred and cred["password_hash"] and not int(cred["must_change"] or 0):
                return jsonify({"message": "Ya tienes una contraseña. Usa cambiar contraseña."}), 409
            now = utc_now_iso()
            new_hash = _hash_password(new_pw)
            if cred:
                connection.execute(
                    "UPDATE user_credentials SET password_hash = ?, must_change = 0, updated_at = ? WHERE person_id = ?",
                    (new_hash, now, person_id),
                )
            else:
                connection.execute(
                    "INSERT INTO user_credentials (person_id, password_hash, must_change, created_at, updated_at) VALUES (?, ?, 0, ?, ?)",
                    (person_id, new_hash, now, now),
                )
            connection.commit()
        return jsonify({"ok": True})

    @app.post("/api/auth/change-password")
    def auth_change_password() -> Response:
        payload = read_payload() or {}
        person_id    = normalize_nullable_int(payload.get("personId"))
        current_pw   = str(payload.get("currentPassword") or "")
        new_pw       = str(payload.get("newPassword") or "")
        if not person_id:
            return jsonify({"message": "personId requerido"}), 400
        if len(new_pw) < 6:
            return jsonify({"message": "La nueva contraseña debe tener al menos 6 caracteres"}), 400
        with get_connection() as connection:
            cred = connection.execute(
                "SELECT password_hash FROM user_credentials WHERE person_id = ?",
                (person_id,),
            ).fetchone()
            if not cred or not cred["password_hash"]:
                return jsonify({"message": "Aún no tienes contraseña; crea una primero."}), 400
            if not _verify_password(current_pw, cred["password_hash"]):
                return jsonify({"message": "Contraseña actual incorrecta"}), 401
            connection.execute(
                "UPDATE user_credentials SET password_hash = ?, must_change = 0, updated_at = ? WHERE person_id = ?",
                (_hash_password(new_pw), utc_now_iso(), person_id),
            )
            connection.commit()
        return jsonify({"ok": True})

    @app.post("/api/auth/admin-reset/<int:person_id>")
    def auth_admin_reset(person_id: int) -> Response:
        """Super-admin marca a un usuario para que capture nueva password al entrar.
        Requiere header X-Acting-Person-Id con el id del super-admin que ejecuta.
        """
        actor_id = normalize_nullable_int(request.headers.get("X-Acting-Person-Id"))
        if not actor_id:
            return jsonify({"message": "Falta identificación del solicitante"}), 401
        with get_connection() as connection:
            actor = connection.execute(
                "SELECT is_super_admin FROM people_catalog WHERE id = ?", (actor_id,)
            ).fetchone()
            if not actor or not int(actor["is_super_admin"] or 0):
                return jsonify({"message": "Solo super-admin puede resetear contraseñas"}), 403
            target = connection.execute(
                "SELECT id FROM people_catalog WHERE id = ?", (person_id,)
            ).fetchone()
            if not target:
                return jsonify({"message": "Persona no encontrada"}), 404
            cred = connection.execute(
                "SELECT person_id FROM user_credentials WHERE person_id = ?", (person_id,)
            ).fetchone()
            now = utc_now_iso()
            if cred:
                connection.execute(
                    "UPDATE user_credentials SET password_hash = '', must_change = 1, updated_at = ? WHERE person_id = ?",
                    (now, person_id),
                )
            else:
                connection.execute(
                    "INSERT INTO user_credentials (person_id, password_hash, must_change, created_at, updated_at) VALUES (?, '', 1, ?, ?)",
                    (person_id, now, now),
                )
            connection.commit()
        return jsonify({"ok": True})

    @app.get("/api/catalogs")
    def get_catalogs() -> Response:
        with get_connection() as connection:
            return jsonify(load_catalogs_payload(connection))

    @app.post("/api/catalogs/people")
    def create_person() -> Response:
        payload = normalize_payload(read_payload())
        validation_error = validate_person_payload(payload)
        if validation_error:
            return jsonify({"message": validation_error}), 400

        # username es opcional; si viene, se valida y solo super-admin puede asignarlo
        username_value = None
        if payload.get("username") not in (None, ""):
            actor_id = normalize_nullable_int(request.headers.get("X-Acting-Person-Id"))
            if actor_id:
                with get_connection() as _c:
                    actor = _c.execute("SELECT is_super_admin FROM people_catalog WHERE id = ?", (actor_id,)).fetchone()
            else:
                actor = None
            if not actor or not int(actor["is_super_admin"] or 0):
                return jsonify({"message": "Solo super-admin puede asignar username"}), 403
            u = _normalize_username(payload.get("username"))
            if not _is_valid_username(u):
                return jsonify({"message": "Username inválido (usa letras, números, '.', '_' o '-')"}), 400
            username_value = u

        now = utc_now_iso()
        try:
            with get_connection() as connection:
                cursor = connection.execute(
                    """
                    INSERT INTO people_catalog (name, role, phone, email, guardian_person_id, guardian_name, supervisor_sector, is_coordinator, username, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        payload["name"],
                        payload["role"],
                        payload.get("phone", ""),
                        payload.get("email", ""),
                        normalize_nullable_int(payload.get("guardianPersonId")),
                        payload.get("guardianName", ""),
                        payload.get("supervisorSector", ""),
                        1 if payload.get("isCoordinator") else 0,
                        username_value,
                        now,
                        now,
                    ),
                )
                connection.commit()
        except sqlite3.IntegrityError as e:
            if "username" in str(e).lower():
                return jsonify({"message": "Ese username ya está en uso."}), 409
            return jsonify({"message": "La persona ya existe en el catálogo."}), 409

        return jsonify({"ok": True, "id": cursor.lastrowid}), 201

    @app.put("/api/catalogs/people/<int:person_id>")
    def update_person(person_id: int) -> Response:
        payload = normalize_payload(read_payload())
        validation_error = validate_person_payload(payload)
        if validation_error:
            return jsonify({"message": validation_error}), 400

        # Si el payload incluye 'username' (incluyendo cadena vacía para borrarlo),
        # solo super-admin puede modificarlo. Si no viene la clave, no se toca.
        update_username = "username" in payload
        username_value = None
        if update_username:
            actor_id = normalize_nullable_int(request.headers.get("X-Acting-Person-Id"))
            if actor_id:
                with get_connection() as _c:
                    actor = _c.execute("SELECT is_super_admin FROM people_catalog WHERE id = ?", (actor_id,)).fetchone()
            else:
                actor = None
            if not actor or not int(actor["is_super_admin"] or 0):
                return jsonify({"message": "Solo super-admin puede asignar username"}), 403
            raw = payload.get("username") or ""
            if raw == "":
                username_value = None
            else:
                u = _normalize_username(raw)
                if not _is_valid_username(u):
                    return jsonify({"message": "Username inválido (usa letras, números, '.', '_' o '-')"}), 400
                username_value = u

        try:
            with get_connection() as connection:
                if update_username:
                    cursor = connection.execute(
                        """
                        UPDATE people_catalog
                        SET name = ?, role = ?, phone = ?, email = ?, guardian_person_id = ?, guardian_name = ?, supervisor_sector = ?, is_coordinator = ?, username = ?, updated_at = ?
                        WHERE id = ?
                        """,
                        (
                            payload["name"],
                            payload["role"],
                            payload.get("phone", ""),
                            payload.get("email", ""),
                            normalize_nullable_int(payload.get("guardianPersonId")),
                            payload.get("guardianName", ""),
                            payload.get("supervisorSector", ""),
                            1 if payload.get("isCoordinator") else 0,
                            username_value,
                            utc_now_iso(),
                            person_id,
                        ),
                    )
                else:
                    cursor = connection.execute(
                        """
                        UPDATE people_catalog
                        SET name = ?, role = ?, phone = ?, email = ?, guardian_person_id = ?, guardian_name = ?, supervisor_sector = ?, is_coordinator = ?, updated_at = ?
                        WHERE id = ?
                        """,
                        (
                            payload["name"],
                            payload["role"],
                            payload.get("phone", ""),
                            payload.get("email", ""),
                            normalize_nullable_int(payload.get("guardianPersonId")),
                            payload.get("guardianName", ""),
                            payload.get("supervisorSector", ""),
                            1 if payload.get("isCoordinator") else 0,
                            utc_now_iso(),
                            person_id,
                        ),
                    )
                connection.commit()
        except sqlite3.IntegrityError as e:
            if "username" in str(e).lower():
                return jsonify({"message": "Ese username ya está en uso."}), 409
            return jsonify({"message": "Ya existe otra persona con ese nombre."}), 409

        if cursor.rowcount == 0:
            return jsonify({"message": "Persona no encontrada."}), 404
        return jsonify({"ok": True})

    @app.patch("/api/catalogs/people/<int:person_id>/rcm")
    def patch_person_rcm(person_id: int) -> Response:
        payload = read_payload()
        if not isinstance(payload, dict):
            return jsonify({"message": "Datos inválidos."}), 400

        valid_keys = {
            "levantate", "restauracion", "reencuentro", "cielosAbiertos",
            "e1Maduracion", "e2Integracion", "e3Ubicacion",
            "eventoUnete", "eventoReencuentro", "eventoMinisterios",
            "e1Vision", "e2Caracter", "e3Perfil", "lanzamiento",
            "escFormativa", "escPadresEsp", "escLideres", "escSupervisores",
        }
        with get_connection() as connection:
            row = connection.execute(
                "SELECT rcm_progress FROM people_catalog WHERE id = ?", (person_id,)
            ).fetchone()
            if row is None:
                return jsonify({"message": "Persona no encontrada."}), 404

            current = parse_json_field(row["rcm_progress"])
            import re as _re
            _valid_value = _re.compile(r'^\d{4}-\d{2}-\d{2}$|^en_curso:\d{4}-\d{2}-\d{2}$')
            for key, value in payload.items():
                if key in valid_keys:
                    if value is None:
                        current[key] = None
                    else:
                        val_str = str(value).strip()
                        if not _valid_value.match(val_str):
                            return jsonify({"message": f"Valor inválido para '{key}'."}), 400
                        current[key] = val_str
            connection.execute(
                "UPDATE people_catalog SET rcm_progress = ?, updated_at = ? WHERE id = ?",
                (json.dumps(current, ensure_ascii=False), utc_now_iso(), person_id),
            )
            connection.commit()
        return jsonify({"ok": True, "rcmProgress": current})

    @app.delete("/api/catalogs/people/<int:person_id>")
    def delete_person(person_id: int) -> Response:
        with get_connection() as connection:
            existing_person = connection.execute(
                "SELECT name FROM people_catalog WHERE id = ?",
                (person_id,),
            ).fetchone()
            deleted_name = existing_person["name"] if existing_person else ""
            connection.execute(
                """
                UPDATE people_catalog
                SET guardian_name = CASE
                        WHEN guardian_person_id = ? AND trim(COALESCE(guardian_name, '')) = '' THEN ?
                        ELSE guardian_name
                    END,
                    guardian_person_id = CASE WHEN guardian_person_id = ? THEN NULL ELSE guardian_person_id END,
                    updated_at = CASE WHEN guardian_person_id = ? THEN ? ELSE updated_at END
                WHERE guardian_person_id = ?
                """,
                (person_id, deleted_name, person_id, person_id, utc_now_iso(), person_id),
            )
            connection.execute(
                """
                UPDATE cell_catalog
                SET leader_person_id = CASE WHEN leader_person_id = ? THEN NULL ELSE leader_person_id END,
                    assistant_person_id = CASE WHEN assistant_person_id = ? THEN NULL ELSE assistant_person_id END,
                    host_person_id = CASE WHEN host_person_id = ? THEN NULL ELSE host_person_id END,
                    updated_at = ?
                WHERE leader_person_id = ? OR assistant_person_id = ? OR host_person_id = ?
                """,
                (person_id, person_id, person_id, utc_now_iso(), person_id, person_id, person_id),
            )
            connection.execute("DELETE FROM cell_membership WHERE person_id = ?", (person_id,))
            cursor = connection.execute("DELETE FROM people_catalog WHERE id = ?", (person_id,))
            connection.commit()

        if cursor.rowcount == 0:
            return jsonify({"message": "Persona no encontrada."}), 404
        return Response(status=204)

    @app.post("/api/catalogs/cells")
    def create_cell() -> Response:
        payload = normalize_payload(read_payload())
        validation_error = validate_cell_payload(payload)
        if validation_error:
            return jsonify({"message": validation_error}), 400

        try:
            with get_connection() as connection:
                cursor = connection.execute(
                    """
                    INSERT INTO cell_catalog (
                        cell_number,
                        network_name,
                        sector,
                        zone_name,
                        district_name,
                        address,
                        leader_person_id,
                        assistant_person_id,
                        host_person_id,
                        created_at,
                        updated_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        payload["cellNumber"],
                        payload.get("networkName", ""),
                        payload["sector"],
                        payload.get("zoneName", ""),
                        payload.get("districtName", ""),
                        payload.get("address", ""),
                        normalize_nullable_int(payload.get("leaderPersonId")),
                        normalize_nullable_int(payload.get("assistantPersonId")),
                        normalize_nullable_int(payload.get("hostPersonId")),
                        utc_now_iso(),
                        utc_now_iso(),
                    ),
                )
                connection.commit()
        except sqlite3.IntegrityError:
            return jsonify({"message": "La célula ya existe en el catálogo."}), 409

        return jsonify({"ok": True, "id": cursor.lastrowid}), 201

    @app.put("/api/catalogs/cells/<int:cell_id>")
    def update_cell(cell_id: int) -> Response:
        payload = normalize_payload(read_payload())
        validation_error = validate_cell_payload(payload)
        if validation_error:
            return jsonify({"message": validation_error}), 400

        try:
            with get_connection() as connection:
                cursor = connection.execute(
                    """
                    UPDATE cell_catalog
                    SET cell_number = ?,
                        network_name = ?,
                        sector = ?,
                        zone_name = ?,
                        district_name = ?,
                        address = ?,
                        leader_person_id = ?,
                        assistant_person_id = ?,
                        host_person_id = ?,
                        updated_at = ?
                    WHERE id = ?
                    """,
                    (
                        payload["cellNumber"],
                        payload.get("networkName", ""),
                        payload["sector"],
                        payload.get("zoneName", ""),
                        payload.get("districtName", ""),
                        payload.get("address", ""),
                        normalize_nullable_int(payload.get("leaderPersonId")),
                        normalize_nullable_int(payload.get("assistantPersonId")),
                        normalize_nullable_int(payload.get("hostPersonId")),
                        utc_now_iso(),
                        cell_id,
                    ),
                )
                connection.commit()
        except sqlite3.IntegrityError:
            return jsonify({"message": "Ya existe otra célula con ese número."}), 409

        if cursor.rowcount == 0:
            return jsonify({"message": "Célula no encontrada."}), 404
        return jsonify({"ok": True})

    @app.delete("/api/catalogs/cells/<int:cell_id>")
    def delete_cell(cell_id: int) -> Response:
        with get_connection() as connection:
            connection.execute("DELETE FROM cell_membership WHERE cell_id = ?", (cell_id,))
            cursor = connection.execute("DELETE FROM cell_catalog WHERE id = ?", (cell_id,))
            connection.commit()

        if cursor.rowcount == 0:
            return jsonify({"message": "Célula no encontrada."}), 404
        return Response(status=204)

    @app.post("/api/catalogs/cells/renumber")
    def renumber_cells() -> Response:
        """Renumbers all cells sequentially (1, 2, 3…) sorted by their current cell_number."""
        with get_connection() as connection:
            rows = connection.execute(
                "SELECT id, cell_number FROM cell_catalog ORDER BY CAST(cell_number AS INTEGER), cell_number"
            ).fetchall()
            for index, row in enumerate(rows, start=1):
                connection.execute(
                    "UPDATE cell_catalog SET cell_number = ? WHERE id = ?",
                    (str(index), row["id"]),
                )
            connection.commit()
        return jsonify({"ok": True, "total": len(rows)})

    @app.post("/api/catalogs/cells/<int:cell_id>/members")
    def assign_cell_member(cell_id: int) -> Response:
        payload = normalize_payload(read_payload())
        person_id = normalize_nullable_int(payload.get("personId"))
        if person_id is None:
            return jsonify({"message": "Selecciona una persona válida."}), 400

        with get_connection() as connection:
            if connection.execute("SELECT 1 FROM cell_catalog WHERE id = ?", (cell_id,)).fetchone() is None:
                return jsonify({"message": "Célula no encontrada."}), 404
            person_row = connection.execute("SELECT id FROM people_catalog WHERE id = ?", (person_id,)).fetchone()
            if person_row is None:
                return jsonify({"message": "Persona no encontrada."}), 404

            assigned_row = connection.execute(
                """
                SELECT membership.cell_id, cell.cell_number
                FROM cell_membership membership
                INNER JOIN cell_catalog cell ON cell.id = membership.cell_id
                WHERE membership.person_id = ?
                """,
                (person_id,),
            ).fetchone()
            if assigned_row is not None:
                if int(assigned_row["cell_id"]) == cell_id:
                    return jsonify({"message": "La persona ya pertenece a esta célula."}), 409
                return jsonify({"message": f"La persona ya está asignada a la célula {assigned_row['cell_number']}. Remuévela antes de reasignarla."}), 409

            try:
                connection.execute(
                    "INSERT INTO cell_membership (cell_id, person_id, created_at) VALUES (?, ?, ?)",
                    (cell_id, person_id, utc_now_iso()),
                )
                connection.commit()
            except sqlite3.IntegrityError:
                return jsonify({"message": "La persona ya pertenece a la célula."}), 409

        return jsonify({"ok": True}), 201

    @app.delete("/api/catalogs/cells/<int:cell_id>/members/<int:person_id>")
    def remove_cell_member(cell_id: int, person_id: int) -> Response:
        with get_connection() as connection:
            cursor = connection.execute(
                "DELETE FROM cell_membership WHERE cell_id = ? AND person_id = ?",
                (cell_id, person_id),
            )
            connection.commit()

        if cursor.rowcount == 0:
            return jsonify({"message": "Miembro no encontrado en la célula."}), 404
        return Response(status=204)

    @app.get("/api/reports")
    def list_reports() -> Response:
        with get_connection() as connection:
            rows = connection.execute(
                """
                SELECT id, employee_name, area, device_model, imei, phone_number, status, notes, payload_json, created_at, updated_at
                FROM reports
                ORDER BY id DESC
                """
            ).fetchall()
        return jsonify({"reports": [serialize_report(row) for row in rows]})

    @app.get("/api/reports/<int:report_id>")
    def get_report(report_id: int) -> Response:
        with get_connection() as connection:
            row = connection.execute(
                """
                SELECT id, employee_name, area, device_model, imei, phone_number, status, notes, payload_json, created_at, updated_at
                FROM reports
                WHERE id = ?
                """,
                (report_id,),
            ).fetchone()
        if row is None:
            return jsonify({"message": "Reporte no encontrado."}), 404
        return jsonify({"report": serialize_report(row)})

    @app.post("/api/reports")
    def create_report() -> Response:
        payload = normalize_payload(read_payload())
        validation_error = validate_report_payload(payload)
        if validation_error:
            return jsonify({"message": validation_error}), 400

        summary = build_report_summary(payload)
        now = utc_now_iso()
        with get_connection() as connection:
            existing_report = find_existing_weekly_report(connection, summary)
            if existing_report is None:
                cursor = connection.execute(
                    """
                    INSERT INTO reports (
                        employee_name,
                        area,
                        device_model,
                        imei,
                        phone_number,
                        status,
                        notes,
                        payload_json,
                        created_at,
                        updated_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        summary["leaderName"],
                        summary["assistantName"],
                        summary["cellNumber"],
                        summary["reportDate"],
                        summary["week"],
                        summary["sector"],
                        payload.get("notes", ""),
                        json.dumps(payload, ensure_ascii=False),
                        now,
                        now,
                    ),
                )
                report_id = cursor.lastrowid
                was_updated = False
            else:
                connection.execute(
                    """
                    UPDATE reports
                    SET employee_name = ?,
                        area = ?,
                        device_model = ?,
                        imei = ?,
                        phone_number = ?,
                        status = ?,
                        notes = ?,
                        payload_json = ?,
                        updated_at = ?
                    WHERE id = ?
                    """,
                    (
                        summary["leaderName"],
                        summary["assistantName"],
                        summary["cellNumber"],
                        summary["reportDate"],
                        summary["week"],
                        summary["sector"],
                        payload.get("notes", ""),
                        json.dumps(payload, ensure_ascii=False),
                        now,
                        existing_report["id"],
                    ),
                )
                report_id = existing_report["id"]
                was_updated = True
            promote_baptized_people(connection, payload)
            promote_visitors_to_members(connection, payload)
            connection.commit()

        status_code = 200 if was_updated else 201
        return jsonify({"ok": True, "id": report_id, "updatedExisting": was_updated}), status_code

    @app.put("/api/reports/<int:report_id>")
    def update_report(report_id: int) -> Response:
        payload = normalize_payload(read_payload())
        validation_error = validate_report_payload(payload)
        if validation_error:
            return jsonify({"message": validation_error}), 400

        summary = build_report_summary(payload)
        with get_connection() as connection:
            cursor = connection.execute(
                """
                UPDATE reports
                SET employee_name = ?,
                    area = ?,
                    device_model = ?,
                    imei = ?,
                    phone_number = ?,
                    status = ?,
                    notes = ?,
                    payload_json = ?,
                    updated_at = ?
                WHERE id = ?
                """,
                (
                    summary["leaderName"],
                    summary["assistantName"],
                    summary["cellNumber"],
                    summary["reportDate"],
                    summary["week"],
                    summary["sector"],
                    payload.get("notes", ""),
                    json.dumps(payload, ensure_ascii=False),
                    utc_now_iso(),
                    report_id,
                ),
            )
            promote_baptized_people(connection, payload)
            promote_visitors_to_members(connection, payload)
            connection.commit()

        if cursor.rowcount == 0:
            return jsonify({"message": "Reporte no encontrado."}), 404
        return jsonify({"ok": True})

    @app.delete("/api/reports/<int:report_id>")
    def delete_report(report_id: int) -> Response:
        with get_connection() as connection:
            cursor = connection.execute("DELETE FROM reports WHERE id = ?", (report_id,))
            connection.commit()

        if cursor.rowcount == 0:
            return jsonify({"message": "Reporte no encontrado."}), 404
        return Response(status=204)

    @app.get("/api/settings")
    def get_settings() -> Response:
        with get_connection() as connection:
            rows = connection.execute("SELECT key, value FROM app_settings").fetchall()
        return jsonify({row["key"]: row["value"] for row in rows})

    @app.post("/api/settings")
    def update_settings() -> Response:
        payload = read_payload()
        if not isinstance(payload, dict):
            return jsonify({"message": "Payload inválido."}), 400
        now = utc_now_iso()
        with get_connection() as connection:
            for key, value in payload.items():
                connection.execute(
                    """
                    INSERT INTO app_settings (key, value, updated_at)
                    VALUES (?, ?, ?)
                    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
                    """,
                    (str(key), str(value), now),
                )
            connection.commit()
        return jsonify({"ok": True})

    @app.errorhandler(404)
    def not_found(_error) -> Response:
        return send_from_directory(PUBLIC_DIR, "index.html")

    return app


def initialize_database() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    with get_connection() as connection:
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS reports (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                employee_name TEXT NOT NULL,
                area TEXT NOT NULL,
                device_model TEXT NOT NULL,
                imei TEXT NOT NULL,
                phone_number TEXT NOT NULL DEFAULT '',
                status TEXT NOT NULL DEFAULT 'activo',
                notes TEXT NOT NULL DEFAULT '',
                payload_json TEXT NOT NULL DEFAULT '{}',
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
            """
        )
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS people_catalog (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE,
                role TEXT NOT NULL,
                phone TEXT NOT NULL DEFAULT '',
                email TEXT NOT NULL DEFAULT '',
                guardian_person_id INTEGER,
                guardian_name TEXT NOT NULL DEFAULT '',
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
            """
        )
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS cell_catalog (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                cell_number TEXT NOT NULL UNIQUE,
                network_name TEXT NOT NULL DEFAULT '',
                sector TEXT NOT NULL,
                zone_name TEXT NOT NULL DEFAULT '',
                district_name TEXT NOT NULL DEFAULT '',
                address TEXT NOT NULL DEFAULT '',
                leader_person_id INTEGER,
                assistant_person_id INTEGER,
                host_person_id INTEGER,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
            """
        )
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS cell_membership (
                cell_id INTEGER NOT NULL,
                person_id INTEGER NOT NULL,
                created_at TEXT NOT NULL,
                PRIMARY KEY (cell_id, person_id)
            )
            """
        )
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS app_settings (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL DEFAULT '',
                updated_at TEXT NOT NULL
            )
            """
        )
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS user_credentials (
                person_id INTEGER PRIMARY KEY,
                password_hash TEXT NOT NULL DEFAULT '',
                must_change INTEGER NOT NULL DEFAULT 0,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
            """
        )
        ensure_schema(connection)
        seed_catalogs(connection)
        connection.commit()


def ensure_schema(connection) -> None:
    report_columns = get_table_columns(connection, "reports")
    if "payload_json" not in report_columns:
        connection.execute("ALTER TABLE reports ADD COLUMN payload_json TEXT NOT NULL DEFAULT '{}' ")

    people_columns = get_table_columns(connection, "people_catalog")
    if people_columns:
        if "phone" not in people_columns:
            connection.execute("ALTER TABLE people_catalog ADD COLUMN phone TEXT NOT NULL DEFAULT ''")
            people_columns = get_table_columns(connection, "people_catalog")
        if "email" not in people_columns:
            connection.execute("ALTER TABLE people_catalog ADD COLUMN email TEXT NOT NULL DEFAULT ''")
            people_columns = get_table_columns(connection, "people_catalog")
        if "guardian_person_id" not in people_columns:
            connection.execute("ALTER TABLE people_catalog ADD COLUMN guardian_person_id INTEGER")
            people_columns = get_table_columns(connection, "people_catalog")
        if "guardian_name" not in people_columns:
            connection.execute("ALTER TABLE people_catalog ADD COLUMN guardian_name TEXT NOT NULL DEFAULT ''")
            people_columns = get_table_columns(connection, "people_catalog")
        if "rcm_progress" not in people_columns:
            connection.execute("ALTER TABLE people_catalog ADD COLUMN rcm_progress TEXT NOT NULL DEFAULT '{}'")
        if "supervisor_sector" not in people_columns:
            connection.execute("ALTER TABLE people_catalog ADD COLUMN supervisor_sector TEXT NOT NULL DEFAULT ''")
        if "is_coordinator" not in people_columns:
            connection.execute("ALTER TABLE people_catalog ADD COLUMN is_coordinator INTEGER NOT NULL DEFAULT 0")
            people_columns = get_table_columns(connection, "people_catalog")
        if "is_super_admin" not in people_columns:
            connection.execute("ALTER TABLE people_catalog ADD COLUMN is_super_admin INTEGER NOT NULL DEFAULT 0")
            people_columns = get_table_columns(connection, "people_catalog")
        if "username" not in people_columns:
            connection.execute("ALTER TABLE people_catalog ADD COLUMN username TEXT")
            try:
                connection.execute(
                    "CREATE UNIQUE INDEX IF NOT EXISTS idx_people_username "
                    "ON people_catalog(lower(username)) WHERE username IS NOT NULL AND username <> ''"
                )
            except Exception:
                pass

    cell_columns = get_table_columns(connection, "cell_catalog")
    if cell_columns:
        if "address" not in cell_columns:
            connection.execute("ALTER TABLE cell_catalog ADD COLUMN address TEXT NOT NULL DEFAULT ''")
            cell_columns = get_table_columns(connection, "cell_catalog")
        if "leader_person_id" not in cell_columns:
            connection.execute("ALTER TABLE cell_catalog ADD COLUMN leader_person_id INTEGER")
            cell_columns = get_table_columns(connection, "cell_catalog")
        if "assistant_person_id" not in cell_columns:
            connection.execute("ALTER TABLE cell_catalog ADD COLUMN assistant_person_id INTEGER")
            cell_columns = get_table_columns(connection, "cell_catalog")
        if "host_person_id" not in cell_columns:
            connection.execute("ALTER TABLE cell_catalog ADD COLUMN host_person_id INTEGER")

    ensure_single_cell_membership(connection)


def ensure_single_cell_membership(connection) -> None:
    membership_rows = connection.execute(
        "SELECT rowid, person_id FROM cell_membership ORDER BY person_id ASC, created_at DESC, rowid DESC"
    ).fetchall()
    seen_people: set[int] = set()
    duplicated_rowids: list[tuple[int]] = []
    for row in membership_rows:
        person_id = int(row["person_id"])
        if person_id in seen_people:
            duplicated_rowids.append((int(row["rowid"]),))
            continue
        seen_people.add(person_id)

    if duplicated_rowids:
        connection.executemany("DELETE FROM cell_membership WHERE rowid = ?", duplicated_rowids)

    connection.execute(
        "CREATE UNIQUE INDEX IF NOT EXISTS idx_cell_membership_person_unique ON cell_membership (person_id)"
    )


def get_table_columns(connection, table_name: str) -> set[str]:
    return {row[1] for row in connection.execute(f"PRAGMA table_info({table_name})").fetchall()}


def seed_catalogs(connection) -> None:
    people_count = connection.execute("SELECT COUNT(*) FROM people_catalog").fetchone()[0]
    if people_count == 0:
        now = utc_now_iso()
        connection.executemany(
            """
            INSERT INTO people_catalog (name, role, phone, email, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            [
                ("Eloísa Vargas", "leader", "", "", now, now),
                ("Blanca Vargas", "assistant", "", "", now, now),
                ("Martha López", "host", "", "", now, now),
                ("Samuel Torres", "member", "", "", now, now),
                ("Andrea Ruiz", "member", "", "", now, now),
            ],
        )

    cell_count = connection.execute("SELECT COUNT(*) FROM cell_catalog").fetchone()[0]
    if cell_count == 0:
        now = utc_now_iso()
        people = {
            row["name"]: row["id"]
            for row in connection.execute("SELECT id, name FROM people_catalog").fetchall()
        }
        connection.executemany(
            """
            INSERT INTO cell_catalog (
                cell_number,
                network_name,
                sector,
                zone_name,
                district_name,
                address,
                leader_person_id,
                assistant_person_id,
                host_person_id,
                created_at,
                updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            [
                ("1", "Red Principal", "A", "Zona Norte", "Distrito 1", "Calle Primera 120", people.get("Eloísa Vargas"), people.get("Blanca Vargas"), people.get("Martha López"), now, now),
                ("2", "Red Vida", "B", "Zona Centro", "Distrito 2", "Calle Segunda 430", None, None, None, now, now),
            ],
        )

    membership_count = connection.execute("SELECT COUNT(*) FROM cell_membership").fetchone()[0]
    if membership_count == 0:
        cell_map = {
            row["cell_number"]: row["id"]
            for row in connection.execute("SELECT id, cell_number FROM cell_catalog").fetchall()
        }
        person_map = {
            row["name"]: row["id"]
            for row in connection.execute("SELECT id, name FROM people_catalog").fetchall()
        }
        connection.executemany(
            "INSERT OR IGNORE INTO cell_membership (cell_id, person_id, created_at) VALUES (?, ?, ?)",
            [
                (cell_map.get("1"), person_map.get("Samuel Torres"), utc_now_iso()),
                (cell_map.get("1"), person_map.get("Andrea Ruiz"), utc_now_iso()),
            ],
        )


def get_connection():
    if TURSO_URL and TURSO_TOKEN:
        return _TursoConnection(TURSO_URL, TURSO_TOKEN)
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    return conn


def read_payload() -> dict:
    try:
        payload = request.get_json(force=True, silent=False)
    except Exception:
        return {}
    return payload if isinstance(payload, dict) else {}


def normalize_payload(payload: dict) -> dict:
    normalized = {}
    for key, value in payload.items():
        if isinstance(value, str):
            normalized[key] = value.strip()
        else:
            normalized[key] = value
    return normalized


def normalize_person_role(value) -> str:
    role = str(value or "").strip().lower()
    return role if role in VALID_PERSON_ROLES else ""


def normalize_nullable_int(value) -> int | None:
    raw_value = str(value or "").strip()
    if not raw_value:
        return None
    try:
        return int(raw_value)
    except ValueError:
        return None


def validate_person_payload(payload: dict) -> str | None:
    if not str(payload.get("name", "")).strip():
        return "El nombre es obligatorio."
    if not normalize_person_role(payload.get("role")):
        return "El perfil no es válido."
    payload["role"] = normalize_person_role(payload.get("role"))
    payload["guardianPersonId"] = normalize_nullable_int(payload.get("guardianPersonId"))
    payload["guardianName"] = str(payload.get("guardianName", "")).strip()
    if payload["role"] == "kid" and payload["guardianPersonId"] is None and not payload["guardianName"]:
        return "Los niños deben tener un responsable o referencia."
    if payload["role"] != "kid":
        payload["guardianPersonId"] = None
        payload["guardianName"] = ""
    return None


def validate_cell_payload(payload: dict) -> str | None:
    if not str(payload.get("cellNumber", "")).strip():
        return "La célula es obligatoria."
    if not str(payload.get("sector", "")).strip():
        return "El sector es obligatorio."
    return None


def validate_report_payload(payload: dict) -> str | None:
    for field_name in REQUIRED_FIELDS:
        if not str(payload.get(field_name, "")).strip():
            return f"El campo {field_name} es obligatorio."

    # Validate week does not exceed current cycle week
    try:
        with get_connection() as conn:
            row_start = conn.execute(
                "SELECT value FROM app_settings WHERE key = 'cycle_start_date'"
            ).fetchone()
            row_day = conn.execute(
                "SELECT value FROM app_settings WHERE key = 'week_start_day'"
            ).fetchone()
            # Total de semanas del ciclo — derivado de rcm_weeks_config si trae
            # un array completo (con phase+verb por entrada). Si no, default 16.
            row_cfg = conn.execute(
                "SELECT value FROM app_settings WHERE key = 'rcm_weeks_config'"
            ).fetchone()
            cycle_total_weeks = 16
            if row_cfg and row_cfg["value"]:
                try:
                    cfg = json.loads(row_cfg["value"])
                    if isinstance(cfg, list) and cfg:
                        full = all(
                            isinstance(e, dict)
                            and isinstance(e.get("phase"), str)
                            and isinstance(e.get("verb"), str)
                            and isinstance(e.get("week"), int)
                            for e in cfg
                        )
                        if full:
                            cycle_total_weeks = max(1, len(cfg))
                except Exception:
                    pass
        if row_start and row_start["value"]:
            cycle_start = date.fromisoformat(row_start["value"])
            today = date.today()
            diff_days = (today - cycle_start).days
            if diff_days >= 0:
                # week_start_day: 0=Dom..6=Sab (JS getDay convention)
                # Python weekday(): 0=Lun..6=Dom  →  py_dow = (js_dow + 6) % 7
                if row_day and row_day["value"] != "":
                    js_dow = int(row_day["value"])
                    target_py = (js_dow + 6) % 7
                    start_py = cycle_start.weekday()
                    days_to_first = (target_py - start_py) % 7
                    if days_to_first == 0:
                        days_to_first = 7
                    if diff_days < days_to_first:
                        max_week = 1
                    else:
                        max_week = min(cycle_total_weeks, (diff_days - days_to_first) // 7 + 2)
                else:
                    max_week = max(1, min(cycle_total_weeks, math.floor(diff_days / 7) + 1))
                submitted_week = int(str(payload.get("week", "1")).strip())
                if submitted_week > max_week:
                    return (
                        f"No puedes reportar la semana {submitted_week} — "
                        f"actualmente estamos en la semana {max_week}."
                    )
    except Exception:
        pass  # If settings unavailable, skip this validation

    return None


def normalize_baptism_entries(payload: dict) -> list[dict]:
    raw_entries = payload.get("baptisms")
    if not isinstance(raw_entries, list):
        return []

    normalized_entries: list[dict] = []
    for entry in raw_entries:
        if not isinstance(entry, dict):
            continue
        name = str(entry.get("name", "")).strip()
        if not name:
            continue
        normalized_entries.append(
            {
                "name": name,
                "baptismDate": str(entry.get("baptismDate", "")).strip(),
                "promoteToMember": entry.get("promoteToMember") is not False,
            }
        )
    return normalized_entries


def find_cell_id_by_number(connection, cell_number: str) -> int | None:
    row = connection.execute(
        "SELECT id FROM cell_catalog WHERE cell_number = ?",
        (str(cell_number or "").strip(),),
    ).fetchone()
    return int(row["id"]) if row else None


def find_person_by_name(connection, name: str):
    return connection.execute(
        "SELECT id, role FROM people_catalog WHERE lower(name) = lower(?)",
        (str(name or "").strip(),),
    ).fetchone()


def promote_baptized_people(connection, payload: dict) -> None:
    cell_id = find_cell_id_by_number(connection, str(payload.get("cellNumber", "")).strip())
    if cell_id is None:
        return

    now = utc_now_iso()
    seen_names: set[str] = set()
    for baptism in normalize_baptism_entries(payload):
        if not baptism["promoteToMember"]:
            continue
        normalized_name = baptism["name"].casefold()
        if normalized_name in seen_names:
            continue
        seen_names.add(normalized_name)

        person_row = find_person_by_name(connection, baptism["name"])
        if person_row is None:
            cursor = connection.execute(
                """
                INSERT INTO people_catalog (name, role, phone, email, guardian_person_id, guardian_name, created_at, updated_at)
                VALUES (?, 'member', '', '', NULL, '', ?, ?)
                """,
                (baptism["name"], now, now),
            )
            person_id = int(cursor.lastrowid)
        else:
            person_id = int(person_row["id"])
            if person_row["role"] not in {"leader", "assistant", "host", "member"}:
                connection.execute(
                    """
                    UPDATE people_catalog
                    SET role = 'member', guardian_person_id = NULL, guardian_name = '', updated_at = ?
                    WHERE id = ?
                    """,
                    (now, person_id),
                )

        connection.execute(
            "INSERT OR IGNORE INTO cell_membership (cell_id, person_id, created_at) VALUES (?, ?, ?)",
            (cell_id, person_id, now),
        )


def promote_visitors_to_members(connection, payload: dict) -> None:
    """Visitas (kind='visita') ya bautizadas que el usuario marcó para promover
    a miembros de la célula. No crea registro de bautismo."""
    raw_visitors = payload.get("visitors")
    if not isinstance(raw_visitors, list):
        return
    cell_id = find_cell_id_by_number(connection, str(payload.get("cellNumber", "")).strip())
    if cell_id is None:
        return

    now = utc_now_iso()
    seen_names: set[str] = set()
    for visitor in raw_visitors:
        if not isinstance(visitor, dict):
            continue
        kind = str(visitor.get("kind", "")).strip().lower()
        if kind != "visita":
            continue
        if not visitor.get("promoteToMember"):
            continue
        name = str(visitor.get("name", "")).strip()
        if not name:
            continue
        normalized_name = name.casefold()
        if normalized_name in seen_names:
            continue
        seen_names.add(normalized_name)

        person_row = find_person_by_name(connection, name)
        if person_row is None:
            cursor = connection.execute(
                """
                INSERT INTO people_catalog (name, role, phone, email, guardian_person_id, guardian_name, created_at, updated_at)
                VALUES (?, 'member', ?, '', NULL, '', ?, ?)
                """,
                (name, str(visitor.get("phone", "") or ""), now, now),
            )
            person_id = int(cursor.lastrowid)
        else:
            person_id = int(person_row["id"])
            if person_row["role"] not in {"leader", "assistant", "host", "member"}:
                connection.execute(
                    """
                    UPDATE people_catalog
                    SET role = 'member', guardian_person_id = NULL, guardian_name = '', updated_at = ?
                    WHERE id = ?
                    """,
                    (now, person_id),
                )

        connection.execute(
            "INSERT OR IGNORE INTO cell_membership (cell_id, person_id, created_at) VALUES (?, ?, ?)",
            (cell_id, person_id, now),
        )


def build_report_summary(payload: dict) -> dict:
    return {
        "week": str(payload.get("week", "")).strip(),
        "cellNumber": str(payload.get("cellNumber", "")).strip(),
        "sector": str(payload.get("sector", "")).strip(),
        "leaderName": str(payload.get("leaderName", "")).strip(),
        "assistantName": str(payload.get("assistantName", "")).strip(),
        "reportDate": str(payload.get("reportDate", "")).strip(),
        "reportYear": extract_report_year(payload),
        "reportQuarter": extract_report_quarter(payload),
    }


def extract_report_year(payload: dict) -> str:
    report_date = str(payload.get("reportDate", "")).strip()
    if len(report_date) >= 4:
        return report_date[:4]
    return ""


def extract_report_quarter(payload: dict) -> str:
    report_date = str(payload.get("reportDate", "")).strip()
    if len(report_date) >= 7:
        month = int(report_date[5:7])
        if month <= 4:
            return "1"
        elif month <= 8:
            return "2"
        else:
            return "3"
    return ""


def find_existing_weekly_report(connection, summary: dict):
    report_year = summary.get("reportYear", "")
    report_quarter = summary.get("reportQuarter", "")
    if report_year and report_quarter:
        return connection.execute(
            """
            SELECT id
            FROM reports
            WHERE device_model = ?
              AND phone_number = ?
              AND substr(imei, 1, 4) = ?
              AND json_extract(payload_json, '$.reportDate') IS NOT NULL
              AND (CASE
                WHEN CAST(substr(json_extract(payload_json, '$.reportDate'), 6, 2) AS INTEGER) <= 4 THEN '1'
                WHEN CAST(substr(json_extract(payload_json, '$.reportDate'), 6, 2) AS INTEGER) <= 8 THEN '2'
                ELSE '3'
              END) = ?
            ORDER BY id DESC
            LIMIT 1
            """,
            (summary["cellNumber"], summary["week"], report_year, report_quarter),
        ).fetchone()

    if report_year:
        return connection.execute(
            """
            SELECT id
            FROM reports
            WHERE device_model = ?
              AND phone_number = ?
              AND substr(imei, 1, 4) = ?
            ORDER BY id DESC
            LIMIT 1
            """,
            (summary["cellNumber"], summary["week"], report_year),
        ).fetchone()

    return connection.execute(
        """
        SELECT id
        FROM reports
        WHERE device_model = ?
          AND phone_number = ?
        ORDER BY id DESC
        LIMIT 1
        """,
        (summary["cellNumber"], summary["week"]),
    ).fetchone()


def parse_payload_json(value: str | None) -> dict:
    if not value:
        return {}
    try:
        payload = json.loads(value)
    except json.JSONDecodeError:
        return {}
    return payload if isinstance(payload, dict) else {}


def parse_json_field(value: str | None) -> dict:
    if not value:
        return {}
    try:
        parsed = json.loads(value)
        return parsed if isinstance(parsed, dict) else {}
    except (json.JSONDecodeError, TypeError):
        return {}


def load_catalogs_payload(connection) -> dict:
    people_rows = connection.execute(
        """
        SELECT
            person.id,
            person.name,
            person.role,
            person.phone,
            person.email,
            person.guardian_person_id,
            person.guardian_name,
            person.rcm_progress,
            person.supervisor_sector,
            person.is_coordinator,
            person.is_super_admin,
            guardian.name AS guardian_person_name,
            person.created_at,
            person.updated_at
        FROM people_catalog person
        LEFT JOIN people_catalog guardian ON guardian.id = person.guardian_person_id
        ORDER BY person.name COLLATE NOCASE ASC
        """
    ).fetchall()
    cell_rows = connection.execute(
        """
        SELECT
            cell.id,
            cell.cell_number,
            cell.network_name,
            cell.sector,
            cell.zone_name,
            cell.district_name,
            cell.address,
            cell.leader_person_id,
            cell.assistant_person_id,
            cell.host_person_id,
            leader.name AS leader_name,
            assistant.name AS assistant_name,
            host.name AS host_name,
            cell.created_at,
            cell.updated_at
        FROM cell_catalog cell
        LEFT JOIN people_catalog leader ON leader.id = cell.leader_person_id
        LEFT JOIN people_catalog assistant ON assistant.id = cell.assistant_person_id
        LEFT JOIN people_catalog host ON host.id = cell.host_person_id
        ORDER BY CAST(cell.cell_number AS INTEGER) ASC, cell.cell_number ASC
        """
    ).fetchall()
    membership_rows = connection.execute(
        """
        SELECT membership.cell_id, cell.cell_number, person.id AS person_id, person.name, person.role, person.guardian_name, person.rcm_progress, guardian.name AS guardian_person_name
        FROM cell_membership membership
        INNER JOIN cell_catalog cell ON cell.id = membership.cell_id
        INNER JOIN people_catalog person ON person.id = membership.person_id
        LEFT JOIN people_catalog guardian ON guardian.id = person.guardian_person_id
        ORDER BY person.name COLLATE NOCASE ASC
        """
    ).fetchall()

    members_by_cell: dict[int, list[dict]] = {}
    assignments_by_person: dict[int, list[dict]] = {}
    for row in membership_rows:
        members_by_cell.setdefault(row["cell_id"], []).append(
            {
                "id": row["person_id"],
                "name": row["name"],
                "role": row["role"],
                "guardianName": row["guardian_person_name"] or row["guardian_name"] or "",
                "rcmProgress": parse_json_field(row["rcm_progress"]),
            }
        )
        assignments_by_person.setdefault(row["person_id"], []).append(
            {
                "cellId": row["cell_id"],
                "cellNumber": row["cell_number"],
            }
        )

    return {
        "people": [serialize_person(row, assignments_by_person.get(row["id"], [])) for row in people_rows],
        "cells": [serialize_cell(row, members_by_cell.get(row["id"], [])) for row in cell_rows],
    }


def serialize_person(row: sqlite3.Row, assignments: list[dict] | None = None) -> dict:
    assignments = assignments or []
    primary_assignment = assignments[0] if assignments else None
    return {
        "id": row["id"],
        "name": row["name"],
        "role": row["role"],
        "phone": row["phone"],
        "email": row["email"],
        "guardianPersonId": row["guardian_person_id"],
        "guardianName": row["guardian_person_name"] or row["guardian_name"] or "",
        "rcmProgress": parse_json_field(row["rcm_progress"]),
        "supervisorSector": row["supervisor_sector"] or "",
        "isCoordinator": bool(int(row["is_coordinator"] or 0)),
        "isSuperAdmin": bool(int(row["is_super_admin"] or 0)) if "is_super_admin" in row.keys() else False,
        "username": (row["username"] or "") if "username" in row.keys() else "",
        "assignedCellId": primary_assignment["cellId"] if primary_assignment else None,
        "assignedCellNumber": primary_assignment["cellNumber"] if primary_assignment else "",
        "assignedCellCount": len(assignments),
        "createdAt": row["created_at"],
        "updatedAt": row["updated_at"],
    }


def serialize_cell(row: sqlite3.Row, members: list[dict]) -> dict:
    return {
        "id": row["id"],
        "cellNumber": row["cell_number"],
        "networkName": row["network_name"],
        "sector": row["sector"],
        "zoneName": row["zone_name"],
        "districtName": row["district_name"],
        "address": row["address"],
        "leaderPersonId": row["leader_person_id"],
        "assistantPersonId": row["assistant_person_id"],
        "hostPersonId": row["host_person_id"],
        "leaderName": row["leader_name"] or "",
        "assistantName": row["assistant_name"] or "",
        "hostName": row["host_name"] or "",
        "members": members,
        "createdAt": row["created_at"],
        "updatedAt": row["updated_at"],
    }


def serialize_report(row: sqlite3.Row) -> dict:
    payload = parse_payload_json(row["payload_json"])
    summary = build_report_summary(payload)

    if not summary["leaderName"]:
        summary["leaderName"] = row["employee_name"]
    if not summary["assistantName"]:
        summary["assistantName"] = row["area"]
    if not summary["cellNumber"]:
        summary["cellNumber"] = row["device_model"]
    if not summary["reportDate"]:
        summary["reportDate"] = row["imei"]
    if not summary["week"]:
        summary["week"] = row["phone_number"]
    if not summary["sector"]:
        summary["sector"] = row["status"]

    return {
        "id": row["id"],
        "week": summary["week"],
        "cellNumber": summary["cellNumber"],
        "sector": summary["sector"],
        "leaderName": summary["leaderName"],
        "assistantName": summary["assistantName"],
        "reportDate": summary["reportDate"],
        "notes": payload.get("notes", row["notes"]),
        "formData": payload,
        "createdAt": row["created_at"],
        "updatedAt": row["updated_at"],
    }


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).astimezone().isoformat()


app = create_app()


if __name__ == "__main__":
    debug = os.environ.get("FLASK_ENV") != "production"
    host = "0.0.0.0" if not debug else "127.0.0.1"
    app.run(host=host, port=DEFAULT_PORT, debug=debug)
