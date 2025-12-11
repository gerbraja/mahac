"""
Test login y capturar logs completos
"""
import requests
import json
import time

url = "http://localhost:8000/auth/login"

print("Esperando 2 segundos para que el servidor esté listo...")
time.sleep(2)

print("\n" + "=" * 60)
print("PROBANDO LOGIN")
print("=" * 60)

data = {
    "username": "superadmin",
    "password": "123456"
}

print(f"\nEnviando request...")
response = requests.post(url, json=data)

print(f"\nStatus: {response.status_code}")
print(f"Response: {json.dumps(response.json(), indent=2)}")

if response.status_code == 200:
    print("\n✅ LOGIN EXITOSO!")
else:
    print("\n❌ LOGIN FALLÓ")
    print("\nAhora revisa los logs del backend en la terminal")
