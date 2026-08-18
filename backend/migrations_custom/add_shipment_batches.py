import os
import sys

# Rutas para SQLite
SQLITE_DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "dev.db")

def run_sqlite():
    import sqlite3
    print(f"🔗 Conectando a SQLite: {SQLITE_DB_PATH}")
    if not os.path.exists(SQLITE_DB_PATH):
        print("  ℹ️  SQLite no encontrado. Saltando.")
        return
    conn = sqlite3.connect(SQLITE_DB_PATH)
    cursor = conn.cursor()
    try:
        # 1. Crear tabla shipment_batches
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS shipment_batches (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                master_tracking_number TEXT,
                carrier TEXT DEFAULT 'Inter Rapidisimo',
                pickup_point_id INTEGER REFERENCES pickup_points(id),
                status TEXT DEFAULT 'preparando',
                token_access TEXT UNIQUE,
                is_active INTEGER DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                shipped_at TIMESTAMP,
                received_at TIMESTAMP,
                notes TEXT
            )
        """)
        print("  ✅ Tabla 'shipment_batches' creada (SQLite).")

        # 2. Agregar columnas a orders
        cursor.execute("PRAGMA table_info(orders)")
        existing = {row[1] for row in cursor.fetchall()}
        
        if "batch_id" not in existing:
            cursor.execute("ALTER TABLE orders ADD COLUMN batch_id INTEGER REFERENCES shipment_batches(id)")
            print("  ✅ 'batch_id' añadida a orders (SQLite).")
            
        if "pickup_point_id" not in existing:
            cursor.execute("ALTER TABLE orders ADD COLUMN pickup_point_id INTEGER REFERENCES pickup_points(id)")
            print("  ✅ 'pickup_point_id' añadida a orders (SQLite).")

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
        # 1. Crear tabla shipment_batches
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS shipment_batches (
                id SERIAL PRIMARY KEY,
                master_tracking_number VARCHAR(100),
                carrier VARCHAR(100) DEFAULT 'Inter Rapidisimo',
                pickup_point_id INTEGER REFERENCES pickup_points(id),
                status VARCHAR(50) DEFAULT 'preparando',
                token_access VARCHAR(100) UNIQUE,
                is_active INTEGER DEFAULT 1,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                shipped_at TIMESTAMP WITH TIME ZONE,
                received_at TIMESTAMP WITH TIME ZONE,
                notes TEXT
            )
        """)
        print("  ✅ Tabla 'shipment_batches' creada en Postgres.")

        # 2. Agregar columnas a orders
        cursor.execute("SELECT column_name FROM information_schema.columns WHERE table_name='orders' AND column_name='batch_id'")
        if not cursor.fetchone():
            cursor.execute("ALTER TABLE orders ADD COLUMN batch_id INTEGER REFERENCES shipment_batches(id)")
            print("  ✅ 'batch_id' añadida en Postgres.")

        cursor.execute("SELECT column_name FROM information_schema.columns WHERE table_name='orders' AND column_name='pickup_point_id'")
        if not cursor.fetchone():
            cursor.execute("ALTER TABLE orders ADD COLUMN pickup_point_id INTEGER REFERENCES pickup_points(id)")
            print("  ✅ 'pickup_point_id' añadida en Postgres.")
            
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
    print("\n🎉 Migración de bultos consolidado completada.")
