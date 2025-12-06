#!/usr/bin/env python
import sys
sys.path.insert(0, '.')

from backend.database.connection import get_db
from backend.database.models.user import User as UserModel
from argon2 import PasswordHasher

pwd_hasher = PasswordHasher()

db = next(get_db())
admin = db.query(UserModel).filter(UserModel.username == 'admin').first()

if admin:
    print(f"✅ Admin found: {admin.username}")
    
    # Hash the admin password with Argon2
    new_password = 'admin123'[:72]
    new_hash = pwd_hasher.hash(new_password)
    print(f"✅ New password hash created (Argon2)")
    
    # Update in DB
    admin.password = new_hash
    db.commit()
    print("✅ Admin password updated in database")
    
    # Test verification
    try:
        pwd_hasher.verify(admin.password, new_password)
        print("✅ Password verification successful")
    except Exception as e:
        print(f"❌ Verification failed: {e}")
else:
    print("❌ Admin not found")
