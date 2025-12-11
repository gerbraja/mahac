#!/usr/bin/env python
"""Direct login test without FastAPI overhead."""
import sys
sys.path.insert(0, '.')

from backend.database.connection import get_db
from backend.database.models.user import User as UserModel
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError, InvalidHash
from jose import jwt
import os

SECRET_KEY = os.getenv("SECRET_KEY", "secret123")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
pwd_hasher = PasswordHasher()

print("=" * 60)
print("DIRECT LOGIN TEST")
print("=" * 60)

try:
    # Get DB session
    db = next(get_db())
    print("✅ DB connection established")
    
    # Find user
    username = "admin"
    password = "admin123"
    password_to_verify = password[:72]
    
    user = db.query(UserModel).filter(UserModel.username == username).first()
    if not user:
        print(f"❌ User '{username}' not found")
        sys.exit(1)
    
    print(f"✅ User found: {user.username} (id={user.id})")
    print(f"   Password hash: {user.password[:50]}...")
    
    # Verify password
    try:
        pwd_hasher.verify(user.password, password_to_verify)
        print(f"✅ Password verified successfully")
    except (VerifyMismatchError, InvalidHash) as e:
        print(f"❌ Password verification failed: {type(e).__name__}")
        sys.exit(1)
    
    # Create token
    token = jwt.encode({"user_id": user.id}, SECRET_KEY, algorithm=ALGORITHM)
    print(f"✅ Token generated: {token[:40]}...")
    
    print("\n" + "=" * 60)
    print("LOGIN TEST PASSED")
    print("=" * 60)
    
except Exception as e:
    print(f"❌ ERROR: {type(e).__name__}: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
