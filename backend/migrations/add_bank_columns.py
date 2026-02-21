from backend.database.connection import engine, Base
from sqlalchemy import text

def add_bank_columns():
    print("Adding bank_balance and released_* columns to users table...")
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE users ADD COLUMN bank_balance FLOAT DEFAULT 0.0"))
            print("Added bank_balance")
        except Exception as e:
            print(f"bank_balance might exist: {e}")
            
        try:
            conn.execute(text("ALTER TABLE users ADD COLUMN released_matrix FLOAT DEFAULT 0.0"))
            print("Added released_matrix")
        except Exception as e:
            print(f"released_matrix might exist: {e}")

        try:
            conn.execute(text("ALTER TABLE users ADD COLUMN released_millionaire FLOAT DEFAULT 0.0"))
            print("Added released_millionaire")
        except Exception as e:
            print(f"released_millionaire might exist: {e}")

        try:
            conn.execute(text("ALTER TABLE users ADD COLUMN released_general FLOAT DEFAULT 0.0"))
            print("Added released_general")
        except Exception as e:
            print(f"released_general might exist: {e}")
            
    print("Migration complete.")

if __name__ == "__main__":
    add_bank_columns()
