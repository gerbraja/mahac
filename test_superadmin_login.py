"""
Probar login con superadmin directamente en el backend
"""
import requests
import json

url = "http://localhost:8000/auth/login"

print("=" * 60)
print("PROBANDO LOGIN CON SUPERADMIN")
print("=" * 60)

data = {
    "username": "superadmin",
    "password": "123456"
}

print(f"\nEnviando: {json.dumps(data, indent=2)}")
print(f"URL: {url}")

try:
    response = requests.post(url, json=data)
    print(f"\nStatus Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    
    if response.status_code == 200:
        print("\n✅ LOGIN EXITOSO!")
        token = response.json().get('access_token')
        print(f"Token: {token[:50]}...")
    else:
        print("\n❌ LOGIN FALLÓ")
        
except Exception as e:
    print(f"\n❌ ERROR: {e}")
    import traceback
    traceback.print_exc()
