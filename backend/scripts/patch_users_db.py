import sqlite3

def patch_db(path):
    print(f"Patching {path}...")
    columns_to_add = [
        ("name", "VARCHAR(255)"),
        ("username", "VARCHAR(150)"),
        ("email", "VARCHAR(255)"),
        ("status", "VARCHAR(50) DEFAULT 'pre-affiliate'"),
        ("is_admin", "BOOLEAN DEFAULT FALSE"),
        ("admin_role", "VARCHAR(50) DEFAULT 'user'"),
        ("admin_country", "VARCHAR(100)"),
        ("referral_code", "VARCHAR(64)"),
        ("referred_by_id", "INTEGER"),
        ("referred_by", "VARCHAR(150)"),
        ("password", "VARCHAR(255)"),
        ("transaction_pin", "VARCHAR(255)"),
        ("reset_token", "VARCHAR(128)"),
        ("reset_token_expires", "DATETIME"),
        ("first_name", "VARCHAR(100)"),
        ("last_name", "VARCHAR(100)"),
        ("document_id", "VARCHAR(50)"),
        ("gender", "VARCHAR(1)"),
        ("birth_date", "DATE"),
        ("phone", "VARCHAR(20)"),
        ("address", "VARCHAR(500)"),
        ("city", "VARCHAR(100)"),
        ("province", "VARCHAR(100)"),
        ("postal_code", "VARCHAR(20)"),
        ("municipio_id", "VARCHAR(5)"),
        ("country", "VARCHAR(100)"),
        ("document_type", "VARCHAR(50)"),
        ("verification_digit", "VARCHAR(2)"),
        ("person_type", "VARCHAR(20)"),
        ("company_name", "VARCHAR(255)"),
        ("tax_regime", "VARCHAR(100)"),
        ("monthly_earnings", "FLOAT DEFAULT 0.0"),
        ("total_earnings", "FLOAT DEFAULT 0.0"),
        ("available_balance", "FLOAT DEFAULT 0.0"),
        ("bank_balance", "FLOAT DEFAULT 0.0"),
        ("released_matrix", "FLOAT DEFAULT 0.0"),
        ("released_millionaire", "FLOAT DEFAULT 0.0"),
        ("released_general", "FLOAT DEFAULT 0.0"),
        ("verified_balance", "FLOAT DEFAULT 0.0"),
        ("is_kyc_verified", "BOOLEAN DEFAULT FALSE"),
        ("crypto_balance", "FLOAT DEFAULT 0.0"),
        ("purchase_balance", "FLOAT DEFAULT 0.0"),
        ("membership_number", "INTEGER"),
        ("membership_code", "VARCHAR(32)"),
        ("crypto_wallet", "VARCHAR(255)"),
        ("package_level", "INTEGER DEFAULT 0"),
    ]
    
    import os
    if not os.path.exists(path):
         return
    conn = sqlite3.connect(path)
    c = conn.cursor()
    for col_name, col_def in columns_to_add:
        try:
            c.execute(f"ALTER TABLE users ADD COLUMN {col_name} {col_def}")
            print(f"  [OK] Added {col_name} to users")
        except Exception as e:
            pass
    conn.commit()
    conn.close()

if __name__ == "__main__":
    patch_db('dev.db')
    patch_db('../dev.db')
    print("Done patching.")
