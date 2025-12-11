"""
Create a test pre-affiliate user for activation testing
"""
import sys
sys.path.insert(0, '.')

from backend.database.connection import get_db
from backend.database.models.user import User
from argon2 import PasswordHasher
from datetime import datetime

db = next(get_db())
ph = PasswordHasher()

# Check if test user already exists
existing = db.query(User).filter(User.email == "test_pv@test.com").first()

if existing:
    print(f"Usuario de prueba ya existe: {existing.name} (ID: {existing.id})")
    print(f"Estado: {existing.status}")
    
    # Reset to pre-affiliate if needed
    if existing.status != 'pre-affiliate':
        print("Reseteando a pre-affiliate...")
        existing.status = 'pre-affiliate'
        existing.membership_number = None
        existing.membership_code = None
        db.commit()
        print("✅ Usuario reseteado")
else:
    # Create new test user
    test_user = User(
        name="Test PV User",
        email="test_pv@test.com",
        username=f"testpv{int(datetime.now().timestamp())}",
        password_hash=ph.hash("test123"),
        status="pre-affiliate",
        country="Colombia",
        city="Bogotá"
    )
    db.add(test_user)
    db.commit()
    db.refresh(test_user)
    print(f"✅ Usuario creado: {test_user.name} (ID: {test_user.id})")
    print(f"   Email: {test_user.email}")
    print(f"   Username: {test_user.username}")
    print(f"   Password: test123")
    print(f"   Estado: {test_user.status}")

db.close()
