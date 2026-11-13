import os
import sys

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..')))

from backend.database.connection import SessionLocal
from backend.database.models.user import User
from backend.database.models.merchant import Merchant

def check():
    db = SessionLocal()
    print("--- USERS ---")
    users = db.query(User).filter(User.id.in_([3, 8])).all()
    for u in users:
        print(f"ID: {u.id}, Username: {u.username}, Role: {u.admin_role}, Created: {u.created_at}")



if __name__ == "__main__":
    check()
