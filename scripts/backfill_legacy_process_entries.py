"""Backfill legacy friend process entries in old reports.

Rules applied only when a visitor row does not already carry an explicit
`processEntry` value:

- `kind != amigo` is ignored.
- Legacy `lateRegistration=True` becomes `processEntry='late'`.
- For each `(cell, year, quarter, normalized_name)` cycle, the first
  process-eligible row is inferred as:
  - week 2  -> `processEntry='noted'`
  - week >=3 -> `processEntry='late'`
- Week 1 rows remain untouched.

For local SQLite it creates a DB backup automatically before applying changes.
For Turso/remote usage it requires an explicit backup confirmation flag and
rebuilds friend tracking using the same backend helpers.

Usage:
    python scripts/backfill_legacy_process_entries.py --dry-run
    python scripts/backfill_legacy_process_entries.py
    python scripts/backfill_legacy_process_entries.py --dry-run         # with TURSO_* env vars
    python scripts/backfill_legacy_process_entries.py --confirmed-backup # with TURSO_* env vars
"""

from __future__ import annotations

import argparse
import json
import shutil
import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parent.parent
DB_PATH = ROOT / "data" / "reporte-celular.db"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Backfill legacy process entries for local SQLite or Turso.")
    parser.add_argument("--dry-run", action="store_true", help="Preview changes without writing them.")
    parser.add_argument(
        "--confirmed-backup",
        action="store_true",
        help="Required before applying writes against Turso/remote targets.",
    )
    return parser.parse_args()


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).astimezone().isoformat()


def normalize_name(value: str) -> str:
    return " ".join(str(value or "").strip().lower().split())


def normalize_kind(value: str) -> str:
    return "visita" if str(value or "").strip().lower() == "visita" else "amigo"


def parse_payload_json(value: str | None) -> dict[str, Any]:
    if not value:
        return {}
    try:
        payload = json.loads(value)
    except json.JSONDecodeError:
        return {}
    return payload if isinstance(payload, dict) else {}


def extract_year_quarter(report_date: str) -> tuple[str, str]:
    raw = str(report_date or "").strip()
    if len(raw) < 7:
        return "", ""
    year = raw[:4]
    try:
        month = int(raw[5:7])
    except ValueError:
        return year, ""
    quarter = "1" if month <= 4 else "2" if month <= 8 else "3"
    return year, quarter


def get_sort_key(row, payload_parser) -> tuple[str, str, int]:
    payload = payload_parser(row["payload_json"])
    report_date = str(payload.get("reportDate") or "")
    try:
        week = int(str(payload.get("week") or "0").strip() or "0")
    except ValueError:
        week = 0
    return report_date, str(week).zfill(2), int(row["id"])


def load_backend_helpers():
    app_path = ROOT / "server" / "app.py"
    code = app_path.read_text(encoding="utf-8")
    marker = '\napp = create_app()\n\n\nif __name__ == "__main__":\n'
    if marker not in code:
        raise RuntimeError("No se pudo neutralizar create_app() para el backfill local.")
    code = code.replace(marker, '\napp = None\n\n\nif __name__ == "__main__":\n')
    namespace = {
        "__name__": "legacy_process_backfill",
        "__file__": str(app_path),
    }
    exec(compile(code, str(app_path), "exec"), namespace)
    return {
        "get_connection": namespace["get_connection"],
        "parse_payload_json": namespace["parse_payload_json"],
        "rebuild_friend_tracking": namespace["rebuild_friend_tracking"],
        "turso_url": namespace.get("TURSO_URL", ""),
    }


def build_updates(connection, payload_parser) -> tuple[list[tuple[str, str, int]], dict[str, int]]:
    report_rows = connection.execute("SELECT id, payload_json FROM reports ORDER BY id ASC").fetchall()
    ordered_rows = sorted(report_rows, key=lambda row: get_sort_key(row, payload_parser))
    process_started: set[tuple[str, str, str, str]] = set()
    updates: list[tuple[str, str, int]] = []
    stats = {
        "reports_changed": 0,
        "visitors_changed": 0,
        "inferred_noted": 0,
        "inferred_late": 0,
        "legacy_late_promoted": 0,
    }

    for row in ordered_rows:
        payload = payload_parser(row["payload_json"])
        visitors = payload.get("visitors")
        if not isinstance(visitors, list) or not visitors:
            continue

        cell_number = str(payload.get("cellNumber") or "").strip()
        year, quarter = extract_year_quarter(str(payload.get("reportDate") or ""))
        try:
            week_number = int(str(payload.get("week") or "0").strip() or "0")
        except ValueError:
            week_number = 0

        changed = False
        for visitor in visitors:
            if not isinstance(visitor, dict):
                continue
            if normalize_kind(visitor.get("kind")) != "amigo":
                continue

            raw_process = str(visitor.get("processEntry") or "").strip().lower()
            normalized_name = normalize_name(visitor.get("name"))
            if not normalized_name:
                continue
            cycle_key = (cell_number, year, quarter, normalized_name)

            if raw_process in {"noted", "late"}:
                process_started.add(cycle_key)
                continue
            if raw_process == "none":
                continue

            if bool(visitor.get("lateRegistration")):
                visitor["processEntry"] = "late"
                process_started.add(cycle_key)
                changed = True
                stats["visitors_changed"] += 1
                stats["legacy_late_promoted"] += 1
                continue

            if cycle_key in process_started:
                continue
            if week_number == 2:
                visitor["processEntry"] = "noted"
                visitor["lateRegistration"] = False
                process_started.add(cycle_key)
                changed = True
                stats["visitors_changed"] += 1
                stats["inferred_noted"] += 1
            elif week_number >= 3:
                visitor["processEntry"] = "late"
                visitor["lateRegistration"] = True
                process_started.add(cycle_key)
                changed = True
                stats["visitors_changed"] += 1
                stats["inferred_late"] += 1

        if changed:
            updates.append((json.dumps(payload, ensure_ascii=False), utc_now_iso(), int(row["id"])))
            stats["reports_changed"] += 1

    return updates, stats


def make_backup() -> Path:
    stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    backup_path = DB_PATH.with_name(f"{DB_PATH.name}.bak-RCM-BACKFILL-{stamp}")
    shutil.copy2(DB_PATH, backup_path)
    return backup_path


def main() -> int:
    args = parse_args()
    helpers = load_backend_helpers()
    get_connection = helpers["get_connection"]
    parse_payload_json = helpers["parse_payload_json"]
    rebuild_friend_tracking = helpers["rebuild_friend_tracking"]
    turso_url = str(helpers.get("turso_url") or "").strip()
    is_remote = bool(turso_url)

    if not is_remote and not DB_PATH.exists():
        print(f"ERROR: no existe la base local: {DB_PATH}")
        return 1

    target_label = turso_url or str(DB_PATH)
    print(f"Objetivo: {target_label}")

    if is_remote and not args.dry_run and not args.confirmed_backup:
        print("ERROR: para escribir en Turso/produccion debes confirmar que ya existe backup usando --confirmed-backup")
        return 1

    with get_connection() as connection:
        updates, stats = build_updates(connection, parse_payload_json)
        print("Resumen de backfill legado RCM:")
        print(json.dumps(stats, ensure_ascii=False, indent=2))

        if args.dry_run:
            print("\nDry-run: no se escribieron cambios.")
            return 0

        if not updates:
            print("\nNo hubo cambios por aplicar.")
            return 0

        if not is_remote:
            backup_path = make_backup()
            print(f"\nBackup creado: {backup_path}")
        else:
            print("\nBackup remoto confirmado manualmente.")

        connection.executemany(
            "UPDATE reports SET payload_json = ?, updated_at = ? WHERE id = ?",
            updates,
        )

        rebuild_friend_tracking(connection)
        connection.commit()

    print("Backfill aplicado y tracking reconstruido.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())