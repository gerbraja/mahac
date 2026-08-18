"""
Migración: Agrega columna municipio_id (código DIVIPOLA/DANE) a la tabla 'users'.

  - municipio_id : Código de 5 dígitos DANE — Obligatorio para factura electrónica DIAN.
                   Ejemplo: Medellín = '05001', Bogotá = '11001', Cali = '76001'
                   DISTINTO al código postal (6 dígitos, informativo).

Idempotente.
"""
import os, sys

SQLITE_DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "dev.db")

NEW_COLUMNS = [
    ("municipio_id", "VARCHAR(5)"),
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
        conn.rollback(); print(f"❌ Error: {e}"); sys.exit(1)
    finally:
        conn.close()


def run_postgres():
    DATABASE_URL = os.getenv("DATABASE_URL")
    if not DATABASE_URL:
        print("⚠️  DATABASE_URL no definida. Solo SQLite ejecutado.")
        return
    import psycopg2
    conn = psycopg2.connect(DATABASE_URL)
    cursor = conn.cursor()
    try:
        for col, col_type in NEW_COLUMNS:
            cursor.execute(
                "SELECT column_name FROM information_schema.columns WHERE table_name='users' AND column_name=%s",
                (col,)
            )
            if not cursor.fetchone():
                cursor.execute(f"ALTER TABLE users ADD COLUMN {col} {col_type}")
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
    print("\n🎉 add_municipio_id completada.")
