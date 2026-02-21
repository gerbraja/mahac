from backend.database.connection import engine
from sqlalchemy import text

def add_crypto_wallet_column():
    print("Migrating: Adding crypto_wallet column to users table...")
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE users ADD COLUMN crypto_wallet VARCHAR(255)"))
            conn.commit()
            print("Successfully added crypto_wallet column.")
        except Exception as e:
            print(f"Column might already exist or error: {e}")

if __name__ == "__main__":
    add_crypto_wallet_column()
