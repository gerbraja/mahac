import sys
import os

# Add parent directory to path
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
sys.path.insert(0, os.path.dirname(parent_dir))

from backend.database.connection import SessionLocal
from backend.database.models.user import User

db = SessionLocal()

try:
    # Get the user to promote (ID 4 based on previous check)
    user_id = 4
    user = db.query(User).filter(User.id == user_id).first()
    
    if user:
        user.is_admin = True
        db.commit()
        print(f"✅ Usuario {user.username} ({user.email}) promovido a ADMINISTRADOR.")
    else:
        print(f"❌ No se encontró el usuario con ID {user_id}.")
        
        # Fallback: promote the last user found
        last_user = db.query(User).order_by(User.id.desc()).first()
        if last_user:
            last_user.is_admin = True
            db.commit()
            print(f"✅ Usuario {last_user.username} ({last_user.email}) promovido a ADMINISTRADOR (fallback).")

except Exception as e:
    print(f"❌ Error: {e}")
    db.rollback()
finally:
    db.close()
