import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from backend.database.connection import SessionLocal
from backend.database.models.user import User

def check_users():
    db = SessionLocal()
    try:
        users = db.query(User).filter(User.is_admin == True).all()
        for user in users:
            print(f"Admin: {user.username} | Email: {user.email} | is_admin: {user.is_admin} | admin_role: {user.admin_role}")
    finally:
        db.close()

if __name__ == "__main__":
    check_users()
