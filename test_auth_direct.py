#!/usr/bin/env python
import sys
sys.path.insert(0, '.')

from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

# Test login
print("Testing login...")
response = client.post("/auth/login", json={"username": "admin", "password": "admin123"})
print(f"Status: {response.status_code}")
print(f"Response: {response.json()}")

if response.status_code == 200:
    token = response.json()["access_token"]
    
    # Test /auth/me
    print("\nTesting /auth/me...")
    me_response = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    print(f"Status: {me_response.status_code}")
    print(f"Response:\n{me_response.json()}")
else:
    print("Login failed, cannot test /auth/me")
