import sys
import os

# Add parent directory to path to allow imports
sys.path.append(os.getcwd())

from backend.database.connection import SessionLocal
from backend.database.models.user import User

try:
    db = SessionLocal()
    print("--- START USER DUMP ---")
    for user_id in [1, 2, 3]:
        u = db.query(User).filter(User.id == user_id).first()
        if u:
            print(f"USER_DATA|{u.id}|{u.username}|{u.email}|{u.is_admin}|{u.name}")
        else:
            print(f"USER_DATA|{user_id}|NOT_FOUND")
    print("--- END USER DUMP ---")
    db.close()
except Exception as e:
    print(f"Error: {e}")
