import os
os.environ["DATABASE_URL"] = "postgresql://postgres:AdminPostgres2025@127.0.0.1:5432/tiendavirtual"
from sqlalchemy import text
from backend.database.connection import engine, Base
# Import all models to ensure they are registered with Base.metadata
from backend.database.models.user import User
from backend.database.models.merchant import Merchant
from backend.database.models.physical_transaction import PhysicalTransaction

print("Creating missing tables...")
Base.metadata.create_all(bind=engine)
print("Tables created.")

columns_to_add = [
    ("crypto_wallet", "VARCHAR(255)"),
    ("is_founder", "BOOLEAN DEFAULT FALSE"),
    ("bank_balance", "FLOAT DEFAULT 0.0"),
    ("released_matrix", "FLOAT DEFAULT 0.0"),
    ("released_millionaire", "FLOAT DEFAULT 0.0"),
    ("released_general", "FLOAT DEFAULT 0.0"),
    ("verified_balance", "FLOAT DEFAULT 0.0"),
    ("is_kyc_verified", "BOOLEAN DEFAULT FALSE"),
    ("package_level", "INTEGER DEFAULT 0"),
    ("admin_role", "VARCHAR(50) DEFAULT 'user'"),
    ("admin_country", "VARCHAR(100)"),
    ("transaction_pin", "VARCHAR(255)"),
    ("active_until", "TIMESTAMP"),
    ("has_package", "BOOLEAN DEFAULT FALSE"),
    ("commission_margin", "FLOAT DEFAULT 20.0")
]

print("Adding missing columns to 'users' table...")
with engine.begin() as conn:
    for col_name, col_type in columns_to_add:
        query = text(f"ALTER TABLE users ADD COLUMN IF NOT EXISTS {col_name} {col_type};")
        try:
            conn.execute(query)
            print(f"Added/verified column {col_name}")
        except Exception as e:
            print(f"Error adding {col_name}: {e}")

    # Set admin role for TeiAdmin just in case
    print("Setting TeiAdmin to superadmin...")
    try:
        conn.execute(text("UPDATE users SET admin_role = 'superadmin' WHERE is_admin = true;"))
    except Exception as e:
        print(f"Could not update superadmin role: {e}")

print("Production database schema update complete.")
