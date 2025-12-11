import sys
sys.path.insert(0, '..')

from database.connection import get_db
from database.models.user import User
from argon2 import PasswordHasher

pwd_hasher = PasswordHasher()

db = next(get_db())
admin = db.query(User).filter(User.username == 'admin').first()

if admin:
    print(f"✅ Admin user found")
    print(f"   Username: {admin.username}")
    print(f"   Email: {admin.email}")
    print(f"   Has password: {bool(admin.password)}")
    if admin.password:
        print(f"   Password hash: {admin.password[:50]}...")
        
        # Try to verify with a test password
        try:
            pwd_hasher.verify(admin.password, "admin123")
            print("   ✅ Password 'admin123' is CORRECT")
        except Exception as e:
            print(f"   ❌ Password 'admin123' verification failed: {type(e).__name__}")
            print(f"      Error: {str(e)}")
else:
    print("❌ No admin user found")

db.close()
