import requests

print("="*60)
print("Testing API Endpoints")
print("="*60)

BASE_URL = "http://localhost:8000"

# Test 1: Root endpoint
print("\n1. Testing root endpoint...")
try:
    response = requests.get(f"{BASE_URL}/")
    print(f"   Status: {response.status_code}")
    print(f"   Response: {response.json()}")
except Exception as e:
    print(f"   ❌ ERROR: {e}")
    print("   ⚠️  Backend no está corriendo!")

# Test 2: Forced Matrix Status
print("\n2. Testing /api/forced-matrix/status/1...")
try:
    response = requests.get(f"{BASE_URL}/api/forced-matrix/status/1")
    print(f"   Status: {response.status_code}")
    data = response.json()
    print(f"   User ID: {data.get('user_id')}")
    print(f"   Status: {data.get('status')}")
    print(f"   Matrices: {len(data.get('matrices', []))} found")
    if data.get('matrices'):
        for m in data['matrices']:
            print(f"      - Level {m.get('matrix_level')}: {m.get('name')}")
except Exception as e:
    print(f"   ❌ ERROR: {e}")

# Test 3: Forced Matrix Stats
print("\n3. Testing /api/forced-matrix/stats/1...")
try:
    response = requests.get(f"{BASE_URL}/api/forced-matrix/stats/1")
    print(f"   Status: {response.status_code}")
    data = response.json()
    matrices = data.get('matrices', {})
    print(f"   Matrices in response: {list(matrices.keys())}")
    if '1' in matrices:
        m1 = matrices['1']
        print(f"   Matriz 1 (CONSUMIDOR):")
        print(f"      - active_members: {m1.get('active_members')}")
        print(f"      - status: {m1.get('status')}")
except Exception as e:
    print(f"   ❌ ERROR: {e}")

print("\n" + "="*60)
