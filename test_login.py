#!/usr/bin/env python
import sys
sys.path.insert(0, '.')

from backend.database.connection import get_db
from backend.database.models.user import User as UserModel
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

db = next(get_db())
admin = db.query(UserModel).filter(UserModel.username == 'admin').first()

if admin:
    print(f"✅ Admin found: {admin.username}")
    print(f"Password hash: {admin.password[:50]}...")
    
    # Test verification
    password_to_verify = 'admin123'[:72]
    try:
        result = pwd_context.verify(password_to_verify, admin.password)
        print(f"✅ Password verification result: {result}")
    except Exception as e:
        print(f"❌ Verification error: {type(e).__name__}: {e}")
else:
    print("❌ Admin not found")
