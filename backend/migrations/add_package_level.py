from backend.database.connection import get_db, engine
from sqlalchemy import text

def add_package_level_column():
    print("Checking for 'package_level' column in 'users' table...")
    with engine.connect() as conn:
        try:
            # Check if column exists
            result = conn.execute(text("SELECT package_level FROM users LIMIT 1"))
            print("Column 'package_level' already exists.")
        except Exception:
            print("Column 'package_level' not found. Adding it...")
            try:
                # Add column defaulting to 1 (Franquicia 1) for existing records to ensure they have a valid level
                # But actually user model default is 0 for new pre-affiliates. 
                # Let's set nullable=True or default 0.
                # However, for business logic, active users are level 1.
                # Let's add it with default 0 first.
                conn.execute(text("ALTER TABLE users ADD COLUMN package_level INTEGER DEFAULT 0"))
                conn.commit()
                
                # Update existing active users to Level 1 (Franquicia 1) as baseline
                conn.execute(text("UPDATE users SET package_level = 1 WHERE status = 'active'"))
                conn.commit()
                print("Column added and active users updated to Level 1.")
            except Exception as e:
                print(f"Error adding column: {e}")

if __name__ == "__main__":
    add_package_level_column()
