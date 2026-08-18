import os
import sys
import json

# Rutas para SQLite si aplica
SQLITE_DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "dev.db")

NEW_COLUMNS = [
    ("shipping_type",          "VARCHAR(50) DEFAULT 'delivery'"),
    ("siigo_invoice_pdf_url",   "VARCHAR(512)"),
    ("shipping_label_pdf_url",  "VARCHAR(512)"),
    ("payment_confirmed_at",    "TIMESTAMP WITH TIME ZONE"),
]

def run_sqlite():
    import sqlite3
    print(f"🔗 Conectando a SQLite: {SQLITE_DB_PATH}")
    if not os.path.exists(SQLITE_DB_PATH):
        print("  ℹ️  SQLite no encontrado. Saltando.")
        return
    conn = sqlite3.connect(SQLITE_DB_PATH)
    cursor = conn.cursor()
    try:
        # 1. Agregar columnas a orders
        cursor.execute("PRAGMA table_info(orders)")
        existing = {row[1] for row in cursor.fetchall()}
        for col, col_type in NEW_COLUMNS:
            if col not in existing:
                # SQLite doesn't support 'WITH TIME ZONE' naturally, but 'TIMESTAMP' works
                clean_type = col_type.replace("WITH TIME ZONE", "")
                cursor.execute(f"ALTER TABLE orders ADD COLUMN {col} {clean_type}")
                print(f"  ✅ '{col}' añadida a orders (SQLite).")
        
        # 2. Crear tabla payment_logs
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS payment_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                order_id INTEGER REFERENCES orders(id),
                provider TEXT DEFAULT 'bancolombia',
                event_type TEXT,
                raw_payload TEXT,
                status TEXT DEFAULT 'received',
                error_message TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        print("  ✅ Tabla 'payment_logs' creada (SQLite).")
        conn.commit()
    except Exception as e:
        print(f"❌ Error SQLite: {e}")
    finally:
        conn.close()

def run_postgres():
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        print("⚠️  DATABASE_URL no definida. Saltando Postgres."); return
    
    import psycopg2
    print(f"🔗 Conectando a PostgreSQL...")
    conn = psycopg2.connect(database_url)
    cursor = conn.cursor()
    try:
        # 1. Agregar columnas a orders
        for col, col_type in NEW_COLUMNS:
            cursor.execute(
                "SELECT column_name FROM information_schema.columns WHERE table_name='orders' AND column_name=%s",
                (col,)
            )
            if not cursor.fetchone():
                cursor.execute(f"ALTER TABLE orders ADD COLUMN {col} {col_type}")
                print(f"  ✅ '{col}' añadida en Postgres.")
        
        # 2. Crear tabla payment_logs
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS payment_logs (
                id SERIAL PRIMARY KEY,
                order_id INTEGER REFERENCES orders(id),
                provider VARCHAR(50) DEFAULT 'bancolombia',
                event_type VARCHAR(100),
                raw_payload JSONB,
                status VARCHAR(50) DEFAULT 'received',
                error_message TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        """)
        print("  ✅ Tabla 'payment_logs' creada en Postgres.")
        conn.commit()
    except Exception as e:
        conn.rollback()
        print(f"❌ Error Postgres: {e}")
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    run_sqlite()
    run_postgres()
    print("\n🎉 Migración de automatización completada.")
