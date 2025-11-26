import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.database.connection import engine
from passlib.context import CryptContext
from sqlalchemy import text

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Hash the password
password = "clave1207*1080*1"
hashed_password = pwd_context.hash(password)

print(f"Hashed password: {hashed_password[:50]}...")

with engine.connect() as connection:
    # Update admin password
    result = connection.execute(
        text("UPDATE users SET password = :password WHERE username = 'admin'"),
        {"password": hashed_password}
    )
    connection.commit()
    print(f"✅ Updated {result.rowcount} row(s)")
    
    # Verify
    verify_result = connection.execute(
        text("SELECT username, email, password FROM users WHERE username = 'admin'")
    )
    row = verify_result.fetchone()
    if row:
        print(f"\n✅ Admin user verified:")
        print(f"   Username: {row[0]}")
        print(f"   Email: {row[1]}")
        print(f"   Password hash: {row[2][:50]}...")
        
        # Test verification
        is_valid = pwd_context.verify(password, row[2])
        print(f"   Password test: {'✅ VALID' if is_valid else '❌ INVALID'}")
