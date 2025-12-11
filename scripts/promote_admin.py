from backend.database.connection import SessionLocal
from backend.database.models.user import User
import sys

def promote_to_admin(email):
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email).first()
        if not user:
            print(f"User with email {email} not found.")
            return
        
        user.is_admin = True
        db.commit()
        print(f"Successfully promoted {user.username} ({user.email}) to admin.")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    if len(sys.argv) > 1:
        promote_to_admin(sys.argv[1])
    else:
        print("Please provide an email address.")
