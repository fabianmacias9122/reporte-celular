"""Genera el hash PBKDF2-SHA256 para usar como MASTER_PASSWORD_HASH.

Uso:
    python scripts/generate_master_password_hash.py

Te pedirá la contraseña en texto plano (sin echo) y devolverá el hash a
guardar en la variable de entorno MASTER_PASSWORD_HASH (.env, Render,
Railway, etc.). El plaintext NO se guarda en ningún lado.
"""
from __future__ import annotations

import getpass
import sys
from pathlib import Path

# Importa _hash_password desde server/app.py sin cargar Flask.
ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from server.app import _hash_password  # noqa: E402


def main() -> int:
    pw1 = getpass.getpass("Master password: ")
    if len(pw1) < 8:
        print("ERROR: usa al menos 8 caracteres.", file=sys.stderr)
        return 1
    pw2 = getpass.getpass("Confirma: ")
    if pw1 != pw2:
        print("ERROR: no coinciden.", file=sys.stderr)
        return 1
    print()
    print("Copia esto y guárdalo en la variable de entorno MASTER_PASSWORD_HASH:")
    print()
    print(_hash_password(pw1))
    print()
    print("Ejemplo en .env:")
    print(f'MASTER_PASSWORD_HASH="{_hash_password(pw1)}"')
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
