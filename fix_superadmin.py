import sys
import os

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from backend.database.connection import SessionLocal
from backend.database.models.user import User

def fix_admins():
    db = SessionLocal()
    try:
        admins = db.query(User).filter(User.is_admin == True).all()
        for admin in admins:
            if admin.admin_role != 'superadmin':
                admin.admin_role = 'superadmin'
                print(f"Updated {admin.username} to superadmin")
        db.commit()
        print("Done fixing admins.")
    finally:
        db.close()

if __name__ == "__main__":
    fix_admins()
