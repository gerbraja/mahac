import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.database.connection import SessionLocal
from backend.database.models.user import User
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

db = SessionLocal()

# Get admin user
admin = db.query(User).filter(User.username == "admin").first()

if not admin:
    print("❌ Admin user not found")
else:
    print(f"✅ Admin user found: {admin.username}")
    print(f"   Email: {admin.email}")
    print(f"   Has password: {admin.password is not None}")
    
    # Test password
    test_password = "clave1207*1080*1"
    if admin.password:
        is_valid = pwd_context.verify(test_password, admin.password)
        print(f"   Password verification: {'✅ VALID' if is_valid else '❌ INVALID'}")
        
        if not is_valid:
            print("\n🔧 Updating password...")
            new_hash = pwd_context.hash(test_password)
            admin.password = new_hash
            db.commit()
            print("✅ Password updated successfully!")
    else:
        print("   ❌ No password set")

db.close()
