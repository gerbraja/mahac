"""
Migración: Agrega columna verification_digit a la tabla users.
Este campo guarda el Dígito de Verificación (DV) calculado según el
algoritmo oficial de la DIAN, requerido para facturación electrónica
con Siigo y la DIAN.

Aplica tanto en dev.db (SQLite local) como en producción (Cloud SQL/PostgreSQL).
"""
import os
import sys

# --- SQLite (desarrollo local) ---
SQLITE_DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "dev.db")


def run_sqlite_migration():
    import sqlite3
    print(f"🔗 Conectando a SQLite: {SQLITE_DB_PATH}")
    conn = sqlite3.connect(SQLITE_DB_PATH)
    cursor = conn.cursor()

    try:
        cursor.execute("PRAGMA table_info(users)")
        existing_columns = [row[1] for row in cursor.fetchall()]

        col = "verification_digit"
        if col not in existing_columns:
            cursor.execute(f"ALTER TABLE users ADD COLUMN {col} VARCHAR(2)")
            print(f"✅ Columna '{col}' agregada a la tabla 'users'.")
        else:
            print(f"ℹ️  Columna '{col}' ya existe en 'users'. No se requiere cambio.")

        conn.commit()
        print("✅ Migración SQLite completada.")

    except Exception as e:
        conn.rollback()
        print(f"❌ Error durante la migración SQLite: {e}")
        sys.exit(1)
    finally:
        conn.close()


# --- PostgreSQL (producción Cloud SQL) ---
def run_postgres_migration():
    DATABASE_URL = os.getenv("DATABASE_URL")
    if not DATABASE_URL:
        print("⚠️  DATABASE_URL no definida. Solo se ejecuta migración SQLite.")
        return

    import psycopg2
    print(f"🔗 Conectando a PostgreSQL...")
    conn = psycopg2.connect(DATABASE_URL)
    conn.autocommit = False
    cursor = conn.cursor()

    try:
        cursor.execute("""
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name = 'users' AND column_name = 'verification_digit'
        """)
        exists = cursor.fetchone()

        if not exists:
            cursor.execute("ALTER TABLE users ADD COLUMN verification_digit VARCHAR(2)")
            conn.commit()
            print("✅ Columna 'verification_digit' agregada en PostgreSQL.")
        else:
            print("ℹ️  Columna 'verification_digit' ya existe en PostgreSQL.")

    except Exception as e:
        conn.rollback()
        print(f"❌ Error durante la migración PostgreSQL: {e}")
        sys.exit(1)
    finally:
        cursor.close()
        conn.close()


if __name__ == "__main__":
    # Ejecutar migración SQLite (desarrollo)
    if os.path.exists(SQLITE_DB_PATH):
        run_sqlite_migration()
    else:
        print(f"ℹ️  No se encontró dev.db en {SQLITE_DB_PATH}. Se omite SQLite.")

    # Ejecutar migración PostgreSQL (producción, si aplica)
    run_postgres_migration()
    print("\n🎉 Migración add_verification_digit completada.")
