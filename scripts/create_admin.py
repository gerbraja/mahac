import sys
import os
from sqlalchemy.orm import Session

# Add parent directory to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.database.connection import SessionLocal
from backend.database.connection import SessionLocal
from backend.database.models.user import User
from passlib.context import CryptContext
from datetime import datetime

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password):
    return pwd_context.hash(password)

def create_admin_user(username, email, password):
    db: Session = SessionLocal()
    try:
        # Check if exists
        existing = db.query(User).filter((User.username == username) | (User.email == email)).first()
        if existing:
            print(f"User {username} or {email} already exists.")
            # Update to admin if possible
            # We need to check if is_admin column exists first.
            # Based on previous view_file of user.py, I didn't see is_admin.
            # I will need to add it if it's missing.
            return

        # We need to hash password. 
        # I'll check auth.py for hashing function or use passlib directly if I can import it.
        from passlib.context import CryptContext
        pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        hashed_password = pwd_context.hash(password)

        admin_user = User(
            username=username,
            email=email,
            password=hashed_password,
            name="Administrator",
            status="active",
            is_admin=True,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        db.add(admin_user)
        db.commit()
        print(f"Admin user {username} created successfully.")
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"Error creating admin user: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    create_admin_user("admin", "admin@tei.com", "admin123")
