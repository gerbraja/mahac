import sqlite3

db_path = "c:/Users/mahac/multinivel/tiendavirtual/miweb/CentroComercialTEI/dev.db"

columns_to_add = [
    ("crypto_wallet", "VARCHAR(255)"),
    ("is_founder", "BOOLEAN DEFAULT 0"),
    ("bank_balance", "FLOAT DEFAULT 0.0"),
    ("released_matrix", "FLOAT DEFAULT 0.0"),
    ("released_millionaire", "FLOAT DEFAULT 0.0"),
    ("released_general", "FLOAT DEFAULT 0.0"),
    ("verified_balance", "FLOAT DEFAULT 0.0"),
    ("is_kyc_verified", "BOOLEAN DEFAULT 0"),
    ("package_level", "INTEGER DEFAULT 0"),
    ("admin_role", "VARCHAR(50) DEFAULT 'user'"),
    ("admin_country", "VARCHAR(100)"),
    ("transaction_pin", "VARCHAR(255)"),
    ("active_until", "DATETIME"),
    ("has_package", "BOOLEAN DEFAULT 0"),
    ("commission_margin", "FLOAT DEFAULT 20.0")
]

conn = sqlite3.connect(db_path)

for col_name, col_type in columns_to_add:
    try:
        conn.execute(f"ALTER TABLE users ADD COLUMN {col_name} {col_type}")
        print(f"Added column {col_name}")
    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e):
            print(f"Column {col_name} already exists.")
        else:
            print(f"Error adding {col_name}: {e}")

conn.commit()
conn.close()
print("Done.")
