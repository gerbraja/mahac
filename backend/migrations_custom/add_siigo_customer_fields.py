"""
Migración: Agrega campos requeridos por Siigo para el Cliente en la factura electrónica.
  - first_name  : Nombres (separado para Siigo, máx 60 chars)
  - last_name   : Apellidos (separado para Siigo, máx 60 chars)
  - person_type : 'Natural' o 'Juridica' (DIAN/Siigo)

Idempotente — solo agrega columnas que no existen.
"""
import os
import sys

SQLITE_DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "dev.db")

NEW_COLUMNS = [
    ("first_name",  "VARCHAR(100)"),
    ("last_name",   "VARCHAR(100)"),
    ("person_type", "VARCHAR(20)"),
]


def run_sqlite():
    import sqlite3
    print(f"🔗 Conectando a SQLite: {SQLITE_DB_PATH}")
    conn = sqlite3.connect(SQLITE_DB_PATH)
    cursor = conn.cursor()
    try:
        cursor.execute("PRAGMA table_info(users)")
        existing = {row[1] for row in cursor.fetchall()}
        for col, col_type in NEW_COLUMNS:
            if col not in existing:
                cursor.execute(f"ALTER TABLE users ADD COLUMN {col} {col_type}")
                print(f"  ✅ Columna '{col}' agregada.")
            else:
                print(f"  ℹ️  '{col}' ya existe.")
        conn.commit()
        print("✅ Migración SQLite completada.")
    except Exception as e:
        conn.rollback()
        print(f"❌ Error SQLite: {e}")
        sys.exit(1)
    finally:
        conn.close()


def run_postgres():
    DATABASE_URL = os.getenv("DATABASE_URL")
    if not DATABASE_URL:
        print("⚠️  DATABASE_URL no definida. Solo SQLite ejecutado.")
        return
    import psycopg2
    print("🔗 Conectando a PostgreSQL...")
    conn = psycopg2.connect(DATABASE_URL)
    cursor = conn.cursor()
    try:
        for col, col_type in NEW_COLUMNS:
            cursor.execute("""
                SELECT column_name FROM information_schema.columns
                WHERE table_name='users' AND column_name=%s
            """, (col,))
            if not cursor.fetchone():
                cursor.execute(f"ALTER TABLE users ADD COLUMN {col} {col_type}")
                print(f"  ✅ Columna '{col}' agregada en PostgreSQL.")
            else:
                print(f"  ℹ️  '{col}' ya existe en PostgreSQL.")
        conn.commit()
        print("✅ Migración PostgreSQL completada.")
    except Exception as e:
        conn.rollback()
        print(f"❌ Error PostgreSQL: {e}")
        sys.exit(1)
    finally:
        cursor.close()
        conn.close()


if __name__ == "__main__":
    if os.path.exists(SQLITE_DB_PATH):
        run_sqlite()
    else:
        print(f"ℹ️  dev.db no encontrado. Omitiendo SQLite.")
    run_postgres()
    print("\n🎉 add_siigo_customer_fields completada.")
