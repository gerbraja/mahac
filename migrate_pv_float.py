"""
Migrates pv and direct_bonus_pv columns from INTEGER to FLOAT (DOUBLE PRECISION)
in the products table so decimal PV values like 1.7, 0.5 can be stored.
"""
import os
import sqlalchemy
from sqlalchemy import create_engine, text

DB_URL = os.environ.get("DATABASE_URL")
if not DB_URL:
    raise RuntimeError("DATABASE_URL not set")

engine = create_engine(DB_URL)

with engine.connect() as conn:
    print("Altering column pv to DOUBLE PRECISION...")
    conn.execute(text("ALTER TABLE products ALTER COLUMN pv TYPE DOUBLE PRECISION USING pv::DOUBLE PRECISION"))
    print("Altering column direct_bonus_pv to DOUBLE PRECISION...")
    conn.execute(text("ALTER TABLE products ALTER COLUMN direct_bonus_pv TYPE DOUBLE PRECISION USING direct_bonus_pv::DOUBLE PRECISION"))
    conn.commit()
    print("✅ Columns migrated successfully!")
