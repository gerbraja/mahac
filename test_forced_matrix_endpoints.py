"""
Script para probar los endpoints de forced matrix
"""
import requests

def test_endpoints():
    base_url = "http://127.0.0.1:8000/api/forced-matrix"
    user_id = 1
    
    print("Testing Forced Matrix Endpoints\n" + "="*50)
    
    # Test status endpoint
    print("\n1. Testing /status endpoint...")
    try:
        response = requests.get(f"{base_url}/status/{user_id}")
        print(f"   Status Code: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   Response: {data}")
        else:
            print(f"   Error: {response.text}")
    except Exception as e:
        print(f"   ❌ Error: {e}")
    
    # Test stats endpoint
    print("\n2. Testing /stats endpoint...")
    try:
        response = requests.get(f"{base_url}/stats/{user_id}")
        print(f"   Status Code: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   Response: {data}")
        else:
            print(f"   Error: {response.text}")
    except Exception as e:
        print(f"   ❌ Error: {e}")
    
    print("\n" + "="*50)
    print("Testing complete!")

if __name__ == "__main__":
    test_endpoints()
