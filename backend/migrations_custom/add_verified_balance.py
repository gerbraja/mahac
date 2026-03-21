"""
Migration: Add verified_balance column to users table.
This is the new "Banco" balance that requires KYC + $50 minimum.
"""
import os
import sys

def migrate_sqlite():
    import sqlite3
    db_path = os.path.join(os.path.dirname(__file__), '..', 'dev.db')
    db_path = os.path.abspath(db_path)
    print(f"Connecting to SQLite: {db_path}")
    conn = sqlite3.connect(db_path)
    c = conn.cursor()
    c.execute("PRAGMA table_info(users)")
    existing = [row[1] for row in c.fetchall()]
    if 'verified_balance' not in existing:
        c.execute("ALTER TABLE users ADD COLUMN verified_balance FLOAT DEFAULT 0.0")
        print("  ✅ Columna 'verified_balance' agregada.")
    else:
        print("  ℹ️  Columna 'verified_balance' ya existía.")
    conn.commit()
    conn.close()
    print("Migration completed.")

def migrate_postgres():
    import psycopg2
    DATABASE_URL = os.getenv("DATABASE_URL")
    if not DATABASE_URL:
        print("❌ DATABASE_URL not set.")
        sys.exit(1)
    url = DATABASE_URL.replace("postgresql+psycopg2://", "postgresql://")
    print("Connecting to PostgreSQL...")
    conn = psycopg2.connect(url)
    conn.autocommit = True
    c = conn.cursor()
    c.execute("""
        SELECT column_name FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'verified_balance'
    """)
    if not c.fetchone():
        c.execute("ALTER TABLE users ADD COLUMN verified_balance FLOAT DEFAULT 0.0")
        print("  ✅ Columna 'verified_balance' agregada.")
    else:
        print("  ℹ️  Columna 'verified_balance' ya existía.")
    conn.close()
    print("Migration completed.")

if __name__ == "__main__":
    mode = sys.argv[1] if len(sys.argv) > 1 else "sqlite"
    if mode == "postgres":
        migrate_postgres()
    else:
        migrate_sqlite()
