"""
Probar login directamente
"""
import requests
import json

url = "http://localhost:8000/auth/login"

# Test 1: Con username
print("=" * 60)
print("TEST 1: Login con username")
print("=" * 60)
data1 = {
    "username": "admin",
    "password": "admin2025!TEI"
}
try:
    response1 = requests.post(url, json=data1)
    print(f"Status: {response1.status_code}")
    print(f"Response: {response1.json()}")
except Exception as e:
    print(f"Error: {e}")

# Test 2: Con email
print("\n" + "=" * 60)
print("TEST 2: Login con email")
print("=" * 60)
data2 = {
    "email": "admin@tei.com",
    "password": "admin2025!TEI"
}
try:
    response2 = requests.post(url, json=data2)
    print(f"Status: {response2.status_code}")
    print(f"Response: {response2.json()}")
except Exception as e:
    print(f"Error: {e}")

# Test 3: Verificar usuario en BD
print("\n" + "=" * 60)
print("TEST 3: Verificar usuario en BD")
print("=" * 60)
import sys
sys.path.insert(0, '.')
from backend.database.connection import get_db
from backend.database.models.user import User

db = next(get_db())
admin = db.query(User).filter(User.email == 'admin@tei.com').first()
if admin:
    print(f"✅ Usuario existe")
    print(f"   Username: {admin.username}")
    print(f"   Email: {admin.email}")
    print(f"   is_admin: {admin.is_admin}")
else:
    print("❌ Usuario NO existe")
db.close()
