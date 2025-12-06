#!/usr/bin/env python
import sys
sys.path.insert(0, '.')

from backend.database.connection import get_db
from backend.database.models.user import User as UserModel
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError, InvalidHash

pwd_hasher = PasswordHasher()

db = next(get_db())
admin = db.query(UserModel).filter(UserModel.username == 'admin').first()

if admin:
    print(f"✅ Admin found: {admin.username}")
    print(f"Email: {admin.email}")
    print(f"Password hash: {admin.password[:50]}...")
    
    # Test verification
    password_to_verify = 'admin123'[:72]
    try:
        pwd_hasher.verify(admin.password, password_to_verify)
        print("✅ Password verification successful")
    except (VerifyMismatchError, InvalidHash) as e:
        print(f"❌ Verification failed: {type(e).__name__}: {e}")
else:
    print("❌ Admin not found")
