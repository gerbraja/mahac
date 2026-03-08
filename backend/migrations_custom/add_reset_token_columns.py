"""
Migration: Add password reset token columns to users table.
Run locally against dev.db (SQLite) and remotely against PostgreSQL.
"""
import os
import sys

# ── SQLite (local dev) ────────────────────────────────────────────────────────
def migrate_sqlite():
    import sqlite3
    DB_PATH = os.path.join(os.path.dirname(__file__), "..", "dev.db")
    print(f"Connecting to SQLite: {DB_PATH}")
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    try:
        cursor.execute("PRAGMA table_info(users)")
        existing_columns = [col[1] for col in cursor.fetchall()]

        if "reset_token" not in existing_columns:
            print("Adding 'reset_token' column...")
            cursor.execute("ALTER TABLE users ADD COLUMN reset_token VARCHAR(128)")
            print("  ✅ reset_token added.")
        else:
            print("  ℹ️  reset_token already exists.")

        if "reset_token_expires" not in existing_columns:
            print("Adding 'reset_token_expires' column...")
            cursor.execute("ALTER TABLE users ADD COLUMN reset_token_expires DATETIME")
            print("  ✅ reset_token_expires added.")
        else:
            print("  ℹ️  reset_token_expires already exists.")

        conn.commit()
        print("Migration completed successfully.")
    except Exception as e:
        print(f"Error: {e}")
        conn.rollback()
    finally:
        conn.close()


# ── PostgreSQL (production) ───────────────────────────────────────────────────
def migrate_postgres():
    import psycopg2

    DATABASE_URL = os.getenv("DATABASE_URL")
    if not DATABASE_URL:
        print("❌ DATABASE_URL not set. Cannot run PostgreSQL migration.")
        sys.exit(1)

    # psycopg2 doesn't accept the postgresql+psycopg2:// scheme
    url = DATABASE_URL.replace("postgresql+psycopg2://", "postgresql://")

    print(f"Connecting to PostgreSQL...")
    conn = psycopg2.connect(url)
    conn.autocommit = False
    cursor = conn.cursor()

    try:
        # Check existing columns
        cursor.execute("""
            SELECT column_name FROM information_schema.columns
            WHERE table_name = 'users'
        """)
        existing = [row[0] for row in cursor.fetchall()]

        if "reset_token" not in existing:
            print("Adding 'reset_token' column...")
            cursor.execute("ALTER TABLE users ADD COLUMN reset_token VARCHAR(128)")
            print("  ✅ reset_token added.")
        else:
            print("  ℹ️  reset_token already exists.")

        if "reset_token_expires" not in existing:
            print("Adding 'reset_token_expires' column...")
            cursor.execute("ALTER TABLE users ADD COLUMN reset_token_expires TIMESTAMP")
            print("  ✅ reset_token_expires added.")
        else:
            print("  ℹ️  reset_token_expires already exists.")

        conn.commit()
        print("Migration completed successfully.")
    except Exception as e:
        print(f"Error: {e}")
        conn.rollback()
    finally:
        cursor.close()
        conn.close()


# ── Entry point ───────────────────────────────────────────────────────────────
if __name__ == "__main__":
    mode = sys.argv[1] if len(sys.argv) > 1 else "sqlite"
    if mode == "postgres":
        migrate_postgres()
    else:
        migrate_sqlite()
