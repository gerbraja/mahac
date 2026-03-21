"""
Migration: Create withholding_tax_configs and withholding_records tables.
Seeds default Colombian tax rates (ReteFuente + ReteICA by city).
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

    # Create withholding_tax_configs
    c.execute("""
        CREATE TABLE IF NOT EXISTS withholding_tax_configs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            country VARCHAR(100) NOT NULL,
            city VARCHAR(100),
            tax_type VARCHAR(20) NOT NULL,
            percentage FLOAT NOT NULL,
            active BOOLEAN DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)
    print("  ✅ Table withholding_tax_configs ready.")

    # Create withholding_records
    c.execute("""
        CREATE TABLE IF NOT EXISTS withholding_records (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            country VARCHAR(100),
            city VARCHAR(100),
            fiscal_year INTEGER NOT NULL,
            release_type VARCHAR(30) NOT NULL,
            gross_amount FLOAT NOT NULL,
            retefuente_pct FLOAT DEFAULT 0.0,
            retefuente_amount FLOAT DEFAULT 0.0,
            reteica_pct FLOAT DEFAULT 0.0,
            reteica_amount FLOAT DEFAULT 0.0,
            total_withheld FLOAT DEFAULT 0.0,
            net_amount FLOAT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)
    print("  ✅ Table withholding_records ready.")

    # Seed default rates
    _seed_defaults(c, "sqlite")
    conn.commit()
    conn.close()
    print("Migration completed successfully.")


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
        CREATE TABLE IF NOT EXISTS withholding_tax_configs (
            id SERIAL PRIMARY KEY,
            country VARCHAR(100) NOT NULL,
            city VARCHAR(100),
            tax_type VARCHAR(20) NOT NULL,
            percentage FLOAT NOT NULL,
            active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT NOW()
        )
    """)
    print("  ✅ Table withholding_tax_configs ready.")

    c.execute("""
        CREATE TABLE IF NOT EXISTS withholding_records (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL,
            country VARCHAR(100),
            city VARCHAR(100),
            fiscal_year INTEGER NOT NULL,
            release_type VARCHAR(30) NOT NULL,
            gross_amount FLOAT NOT NULL,
            retefuente_pct FLOAT DEFAULT 0.0,
            retefuente_amount FLOAT DEFAULT 0.0,
            reteica_pct FLOAT DEFAULT 0.0,
            reteica_amount FLOAT DEFAULT 0.0,
            total_withheld FLOAT DEFAULT 0.0,
            net_amount FLOAT NOT NULL,
            created_at TIMESTAMP DEFAULT NOW()
        )
    """)
    print("  ✅ Table withholding_records ready.")

    _seed_defaults(c, "postgres")
    conn.close()
    print("Migration completed successfully.")


def _seed_defaults(cursor, db_type):
    """Insert default Colombian tax rates if not already present."""
    if db_type == "sqlite":
        cursor.execute("SELECT COUNT(*) FROM withholding_tax_configs WHERE country = 'Colombia'")
    else:
        cursor.execute("SELECT COUNT(*) FROM withholding_tax_configs WHERE country = 'Colombia'")

    count = cursor.fetchone()[0]
    if count > 0:
        print("  ℹ️  Default rates already seeded. Skipping.")
        return

    defaults = [
        # ReteFuente Nacional (aplica a toda Colombia)
        ("Colombia", None,          "retefuente", 6.0),
        # ReteICA por ciudad (tasas aproximadas vigentes 2025)
        ("Colombia", "Bogotá",      "reteica", 0.966),
        ("Colombia", "Medellín",    "reteica", 0.7),
        ("Colombia", "Cali",        "reteica", 1.0),
        ("Colombia", "Barranquilla","reteica", 0.7),
        ("Colombia", "Neiva",       "reteica", 0.7),
        ("Colombia", "Pereira",     "reteica", 0.7),
        ("Colombia", "Bucaramanga", "reteica", 0.7),
        ("Colombia", "Cartagena",   "reteica", 1.0),
        ("Colombia", "Manizales",   "reteica", 0.7),
        ("Colombia", "Armenia",     "reteica", 0.7),
    ]

    for country, city, tax_type, pct in defaults:
        if db_type == "sqlite":
            cursor.execute(
                "INSERT INTO withholding_tax_configs (country, city, tax_type, percentage) VALUES (?, ?, ?, ?)",
                (country, city, tax_type, pct)
            )
        else:
            cursor.execute(
                "INSERT INTO withholding_tax_configs (country, city, tax_type, percentage) VALUES (%s, %s, %s, %s)",
                (country, city, tax_type, pct)
            )
    print(f"  ✅ Seeded {len(defaults)} default tax rates.")


if __name__ == "__main__":
    mode = sys.argv[1] if len(sys.argv) > 1 else "sqlite"
    if mode == "postgres":
        migrate_postgres()
    else:
        migrate_sqlite()
