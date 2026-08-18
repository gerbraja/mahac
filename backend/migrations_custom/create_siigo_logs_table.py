"""
Migración: Crea la tabla 'siigo_logs' para auditoría de facturación electrónica.

Cada fila = una llamada a la API de Siigo, con el JSON enviado y la respuesta.
Idempotente.
"""
import os, sys

SQLITE_DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "dev.db")

CREATE_TABLE_SQL = """
CREATE TABLE IF NOT EXISTS siigo_logs (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id         INTEGER REFERENCES orders(id),
    action           VARCHAR(50)  NOT NULL DEFAULT 'emit_invoice',
    status           VARCHAR(20)  NOT NULL DEFAULT 'pending',
    http_status      INTEGER,
    request_body     TEXT,
    response_body    TEXT,
    error_message    VARCHAR(500),
    siigo_invoice_id VARCHAR(100),
    cufe             VARCHAR(255),
    created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
"""

CREATE_TABLE_SQL_PG = """
CREATE TABLE IF NOT EXISTS siigo_logs (
    id               SERIAL PRIMARY KEY,
    order_id         INTEGER REFERENCES orders(id),
    action           VARCHAR(50)  NOT NULL DEFAULT 'emit_invoice',
    status           VARCHAR(20)  NOT NULL DEFAULT 'pending',
    http_status      INTEGER,
    request_body     TEXT,
    response_body    TEXT,
    error_message    VARCHAR(500),
    siigo_invoice_id VARCHAR(100),
    cufe             VARCHAR(255),
    created_at       TIMESTAMPTZ DEFAULT NOW()
);
"""


def run_sqlite():
    import sqlite3
    print(f"🔗 SQLite: {SQLITE_DB_PATH}")
    conn = sqlite3.connect(SQLITE_DB_PATH)
    try:
        conn.execute(CREATE_TABLE_SQL)
        conn.commit()
        print("  ✅ Tabla 'siigo_logs' lista.")
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
        cursor.execute(CREATE_TABLE_SQL_PG)
        conn.commit()
        print("  ✅ Tabla 'siigo_logs' lista en PostgreSQL.")
    except Exception as e:
        conn.rollback(); print(f"❌ Error PostgreSQL: {e}"); sys.exit(1)
    finally:
        cursor.close(); conn.close()


if __name__ == "__main__":
    if os.path.exists(SQLITE_DB_PATH):
        run_sqlite()
    run_postgres()
    print("\n🎉 create_siigo_logs_table completada.")
