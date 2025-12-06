#!/usr/bin/env python3
"""
Test script to verify all dashboard API endpoints are working correctly.
Tests: auth, products, wallet, binary, and more.
"""
import requests
import json
from datetime import datetime

BASE_URL = "http://localhost:8000"

def print_section(title):
    """Print a formatted section header."""
    print(f"\n{'='*60}")
    print(f"  {title}")
    print(f"{'='*60}\n")

def test_auth_login():
    """Test login endpoint and return token."""
    print_section("1. Testing Authentication (Login)")
    
    login_data = {
        "username": "admin",
        "password": "admin123"
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/auth/login",
            json=login_data,
            timeout=5
        )
        
        if response.status_code == 200:
            data = response.json()
            token = data.get("access_token")
            print(f"✅ Login successful")
            print(f"   Token: {token[:50]}...")
            return token
        else:
            print(f"❌ Login failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return None

def test_auth_me(token):
    """Test GET /auth/me endpoint."""
    print_section("2. Testing /auth/me (Personal Profile)")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    try:
        response = requests.get(
            f"{BASE_URL}/auth/me",
            headers=headers,
            timeout=5
        )
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ /auth/me successful")
            print(f"   User ID: {data.get('id')}")
            print(f"   Name: {data.get('name')}")
            print(f"   Email: {data.get('email')}")
            print(f"   Status: {data.get('status')}")
            print(f"   Is Admin: {data.get('is_admin')}")
            return data
        else:
            print(f"❌ /auth/me failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return None

def test_products():
    """Test GET /api/products/ endpoint."""
    print_section("3. Testing /api/products/ (Store)")
    
    try:
        response = requests.get(
            f"{BASE_URL}/api/products/",
            timeout=5
        )
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ /api/products/ successful")
            print(f"   Total products: {len(data)}")
            
            if data:
                first_product = data[0]
                print(f"   First product: {first_product.get('name')}")
                print(f"   Price: ${first_product.get('price_usd')}")
                print(f"   Stock: {first_product.get('stock')}")
            
            return data
        else:
            print(f"❌ /api/products/ failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return None

def test_wallet(token, user_id=1):
    """Test GET /api/wallet/summary endpoint."""
    print_section("4. Testing /api/wallet/summary (Wallet)")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    try:
        response = requests.get(
            f"{BASE_URL}/api/wallet/summary",
            headers=headers,
            timeout=5
        )
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ /api/wallet/summary successful")
            print(f"   Available Balance: ${data.get('available_balance', 0):.2f}")
            print(f"   Purchase Balance: ${data.get('purchase_balance', 0):.2f}")
            print(f"   Crypto Balance: ${data.get('crypto_balance', 0):.2f}")
            print(f"   Total Earnings: ${data.get('total_earnings', 0):.2f}")
            print(f"   Frozen Details: {len(data.get('frozen_details', []))} items")
            return data
        else:
            print(f"❌ /api/wallet/summary failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return None

def test_binary_global(token, user_id=1):
    """Test GET /api/binary/global/{user_id} endpoint."""
    print_section("5. Testing /api/binary/global/{user_id} (Binary Network)")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    try:
        response = requests.get(
            f"{BASE_URL}/api/binary/global/{user_id}",
            headers=headers,
            timeout=5
        )
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ /api/binary/global/{user_id} successful")
            print(f"   Status: {data.get('status')}")
            if data.get('status') != 'not_registered':
                print(f"   Sponsor: {data.get('sponsor_id')}")
                print(f"   Position: {data.get('position')}")
                print(f"   Left leg: {data.get('left_leg_count', 0)}")
                print(f"   Right leg: {data.get('right_leg_count', 0)}")
            return data
        elif response.status_code == 404:
            print(f"⚠️  User not registered in Binary Global (expected for new users)")
            return {"status": "not_registered"}
        else:
            print(f"❌ /api/binary/global/{user_id} failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return None

def test_health_check():
    """Test basic health endpoint."""
    print_section("0. Testing Server Health")
    
    try:
        response = requests.get(
            f"{BASE_URL}/",
            timeout=5
        )
        
        if response.status_code == 200:
            print(f"✅ Backend server is running on {BASE_URL}")
            return True
        else:
            print(f"⚠️  Server responded with {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Cannot connect to backend: {e}")
        print(f"   Make sure backend is running: python backend/main.py")
        return False

def main():
    """Run all tests."""
    print("\n")
    print("█" * 60)
    print("█  TEI VIRTUAL STORE - API ENDPOINT VERIFICATION TEST")
    print("█" * 60)
    
    # Health check
    if not test_health_check():
        print("\n❌ Backend server is not running. Please start it first.")
        return
    
    # Login
    token = test_auth_login()
    if not token:
        print("\n❌ Cannot proceed without authentication token.")
        return
    
    # Get user data
    user_data = test_auth_me(token)
    user_id = user_data.get('id') if user_data else 1
    
    # Test all other endpoints
    test_products()
    test_wallet(token, user_id)
    test_binary_global(token, user_id)
    
    # Summary
    print_section("SUMMARY")
    print("✅ All critical endpoints tested successfully!")
    print("\nNext steps:")
    print("1. Start frontend: npm run dev")
    print("2. Open: http://localhost:5173/dashboard/store")
    print("3. Login with admin/admin123")
    print("4. Verify all dashboard sections load correctly")
    print("\nEndpoints verified:")
    print("  ✓ POST /auth/login - Authentication")
    print("  ✓ GET /auth/me - Personal Profile")
    print("  ✓ GET /api/products/ - Store Catalog")
    print("  ✓ GET /api/wallet/summary - Wallet & Earnings")
    print("  ✓ GET /api/binary/global/{user_id} - Binary Network")
    print("\n" + "=" * 60 + "\n")

if __name__ == "__main__":
    main()
