"""
Backfill: Asigna document_type='CC' y calcula verification_digit
para todos los usuarios existentes que tienen document_id pero no tienen document_type.

Condición: Solo aplica a usuarios con document_id numérico (CC colombianas).
Idempotente: Si el campo ya tiene valor, NO lo sobreescribe.

Uso:
  python migrations_custom/backfill_document_type_dv.py
"""
import os
import sys

# ——————————————————————————————————————————————
# Algoritmo DV oficial DIAN (serie de primos, mod 11)
# ——————————————————————————————————————————————
PRIME_SERIES = [3, 7, 13, 17, 19, 23, 29, 37, 41, 43, 47, 53, 59, 67, 71]

def calculate_dv(doc_number: str) -> str | None:
    digits = "".join(c for c in str(doc_number) if c.isdigit())
    if len(digits) < 6:
        return None
    total = 0
    for i, d in enumerate(reversed(digits)):
        total += int(d) * PRIME_SERIES[i % len(PRIME_SERIES)]
    remainder = total % 11
    dv = 0 if remainder == 0 else (1 if remainder == 1 else 11 - remainder)
    return str(dv)


# ——————————————————————————————————————————————
# SQLite (desarrollo)
# ——————————————————————————————————————————————
SQLITE_DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "dev.db")

def run_sqlite():
    import sqlite3
    print(f"🔗 Conectando a SQLite: {SQLITE_DB_PATH}")
    conn = sqlite3.connect(SQLITE_DB_PATH)
    cursor = conn.cursor()

    # Usuarios con document_id pero sin document_type aún
    cursor.execute("""
        SELECT id, document_id
        FROM users
        WHERE document_id IS NOT NULL
          AND document_id != ''
          AND (document_type IS NULL OR document_type = '')
    """)
    users = cursor.fetchall()
    print(f"📋 Usuarios a actualizar: {len(users)}")

    updated = 0
    skipped_non_numeric = 0

    for user_id, doc_id in users:
        # Solo asignar CC si el documento es numérico
        digits = "".join(c for c in str(doc_id) if c.isdigit())
        if len(digits) < 6:
            print(f"  ⚠️  Usuario {user_id}: doc '{doc_id}' no es numérico válido. Se omite.")
            skipped_non_numeric += 1
            continue

        dv = calculate_dv(doc_id)
        cursor.execute("""
            UPDATE users
            SET document_type = 'CC',
                verification_digit = ?
            WHERE id = ?
        """, (dv, user_id))
        print(f"  ✅ Usuario {user_id}: CC | DV={dv}")
        updated += 1

    conn.commit()
    conn.close()
    print(f"\n📊 Resumen SQLite:")
    print(f"   Actualizados : {updated}")
    print(f"   Omitidos     : {skipped_non_numeric}")
    return updated


# ——————————————————————————————————————————————
# PostgreSQL (producción)
# ——————————————————————————————————————————————
def run_postgres():
    DATABASE_URL = os.getenv("DATABASE_URL")
    if not DATABASE_URL:
        print("⚠️  DATABASE_URL no definida. Solo se ejecuta en SQLite.")
        return

    import psycopg2
    print(f"🔗 Conectando a PostgreSQL...")
    conn = psycopg2.connect(DATABASE_URL)
    cursor = conn.cursor()

    cursor.execute("""
        SELECT id, document_id
        FROM users
        WHERE document_id IS NOT NULL
          AND document_id != ''
          AND (document_type IS NULL OR document_type = '')
    """)
    users = cursor.fetchall()
    print(f"📋 Usuarios a actualizar en producción: {len(users)}")

    updated = 0
    skipped = 0

    for user_id, doc_id in users:
        digits = "".join(c for c in str(doc_id) if c.isdigit())
        if len(digits) < 6:
            print(f"  ⚠️  Usuario {user_id}: doc '{doc_id}' no es numérico válido. Se omite.")
            skipped += 1
            continue

        dv = calculate_dv(doc_id)
        cursor.execute("""
            UPDATE users
            SET document_type = 'CC',
                verification_digit = %s
            WHERE id = %s
        """, (dv, user_id))
        print(f"  ✅ Usuario {user_id}: CC | DV={dv}")
        updated += 1

    conn.commit()
    cursor.close()
    conn.close()
    print(f"\n📊 Resumen PostgreSQL:")
    print(f"   Actualizados : {updated}")
    print(f"   Omitidos     : {skipped}")


if __name__ == "__main__":
    if os.path.exists(SQLITE_DB_PATH):
        n = run_sqlite()
        if n == 0:
            print("\nℹ️  No había usuarios pendientes de actualizar en SQLite.")
    else:
        print(f"ℹ️  No se encontró dev.db. Se omite SQLite.")

    run_postgres()
    print("\n🎉 Backfill completado.")
