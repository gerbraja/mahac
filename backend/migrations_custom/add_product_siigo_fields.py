"""
Migración: Agrega campos de Siigo a la tabla 'products':
  - unit_measurement  : Unidad de medida (Unidad, Kg, Litro, etc.) — requerido por Siigo por ítem
  - siigo_product_code: Código único del producto en Siigo Nube

Idempotente.
"""
import os, sys

SQLITE_DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "dev.db")

NEW_COLUMNS = [
    ("unit_measurement",   "VARCHAR(50) DEFAULT 'Unidad'"),
    ("siigo_product_code", "VARCHAR(100)"),
]


def run_sqlite():
    import sqlite3
    print(f"🔗 Conectando a SQLite: {SQLITE_DB_PATH}")
    conn = sqlite3.connect(SQLITE_DB_PATH)
    cursor = conn.cursor()
    try:
        cursor.execute("PRAGMA table_info(products)")
        existing = {row[1] for row in cursor.fetchall()}
        for col, col_type in NEW_COLUMNS:
            if col not in existing:
                cursor.execute(f"ALTER TABLE products ADD COLUMN {col} {col_type}")
                print(f"  ✅ '{col}' agregada a products.")
            else:
                print(f"  ℹ️  '{col}' ya existe.")
        conn.commit()
        print("✅ Migración SQLite completada.")
    except Exception as e:
        conn.rollback(); print(f"❌ Error: {e}"); sys.exit(1)
    finally:
        conn.close()


def run_postgres():
    DATABASE_URL = os.getenv("DATABASE_URL")
    if not DATABASE_URL:
        print("⚠️  DATABASE_URL no definida. Solo SQLite ejecutado."); return
    import psycopg2
    conn = psycopg2.connect(DATABASE_URL)
    cursor = conn.cursor()
    try:
        for col, col_type in NEW_COLUMNS:
            cursor.execute(
                "SELECT column_name FROM information_schema.columns WHERE table_name='products' AND column_name=%s",
                (col,)
            )
            if not cursor.fetchone():
                cursor.execute(f"ALTER TABLE products ADD COLUMN {col} {col_type}")
                print(f"  ✅ '{col}' agregada en PostgreSQL.")
            else:
                print(f"  ℹ️  '{col}' ya existe en PostgreSQL.")
        conn.commit()
    except Exception as e:
        conn.rollback(); print(f"❌ Error PostgreSQL: {e}"); sys.exit(1)
    finally:
        cursor.close(); conn.close()


if __name__ == "__main__":
    if os.path.exists(SQLITE_DB_PATH):
        run_sqlite()
    run_postgres()
    print("\n🎉 add_product_siigo_fields completada.")
