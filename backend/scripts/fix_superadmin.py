import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from backend.database.connection import SessionLocal
from backend.database.models.user import User

def fix_admins():
    db = SessionLocal()
    try:
        admins = db.query(User).filter(User.is_admin == True).all()
        for admin in admins:
            print(f"Checking admin {admin.username} - current role: {admin.admin_role}")
            if admin.admin_role != 'superadmin':
                admin.admin_role = 'superadmin'
                print(f"Updated {admin.username} to superadmin")
        db.commit()
        print("Done fixing admins.")
    finally:
        db.close()

if __name__ == "__main__":
    fix_admins()
