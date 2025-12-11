#!/usr/bin/env python3
"""Test login flow and token generation"""
import requests
import json

BASE_URL = "http://127.0.0.1:8000"

# Test login
print("\n" + "="*60)
print("TEST 1: LOGIN")
print("="*60)

login_data = {
    "username": "admin",
    "password": "admin123"
}

print(f"\n📤 Enviando: POST /auth/login")
print(f"   Datos: username={login_data['username']}, password=***")

try:
    response = requests.post(f"{BASE_URL}/auth/login", json=login_data)
    print(f"\n📥 Response: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Login exitoso!")
        print(f"   Access Token: {data.get('access_token')[:50]}...")
        
        token = data.get('access_token')
        
        # Test /auth/me endpoint with token
        print("\n" + "="*60)
        print("TEST 2: VERIFY TOKEN (/auth/me)")
        print("="*60)
        
        headers = {"Authorization": f"Bearer {token}"}
        print(f"\n📤 Enviando: GET /auth/me")
        print(f"   Headers: Authorization: Bearer {token[:50]}...")
        
        response = requests.get(f"{BASE_URL}/auth/me", headers=headers)
        print(f"\n📥 Response: {response.status_code}")
        
        if response.status_code == 200:
            user_data = response.json()
            print(f"✅ Token válido!")
            print(f"   Username: {user_data.get('username')}")
            print(f"   Email: {user_data.get('email')}")
            print(f"   Is Admin: {user_data.get('is_admin')}")
            print(f"   Name: {user_data.get('name')}")
        else:
            print(f"❌ Error: {response.text}")
    else:
        print(f"❌ Login fallido!")
        print(f"   Response: {response.text}")
except Exception as e:
    print(f"❌ Error: {str(e)}")

print("\n" + "="*60)
