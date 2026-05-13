import sqlite3
from pathlib import Path

DB = Path(__file__).parent.parent / "data" / "reporte-celular.db"
c = sqlite3.connect(str(DB))
c.row_factory = sqlite3.Row

print("--- counts ---")
for t in ["people_catalog", "cell_catalog", "cell_membership", "reports", "app_settings"]:
    n = c.execute(f"SELECT COUNT(*) FROM {t}").fetchone()[0]
    print(f"  {t}: {n}")

print("\n--- app_settings (key + value preview) ---")
for r in c.execute("SELECT key, value, updated_at FROM app_settings ORDER BY key"):
    val = (r["value"] or "")
    preview = val if len(val) <= 100 else val[:100] + "..."
    print(f"  [{r['key']}] {preview}")

print("\n--- cell_catalog (todas) ---")
for r in c.execute("SELECT id, cell_number, sector, network_name FROM cell_catalog ORDER BY id"):
    print(f"  #{r['id']}  cell={r['cell_number']}  sector={r['sector']}  red={r['network_name']}")
