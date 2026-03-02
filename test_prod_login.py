import requests
import json

# Test production login API
url = "https://api.tuempresainternacional.com/auth/login"

# Try different username variations
usernames = ["Sembradores", "sembradores", "Sembradoresdeesperanza", "SembradoresDeEsperanza"]
password = "1234.qwer"

print("Testing Production Login API")
print("=" * 60)

for username in usernames:
    data = {
        "username": username,
        "password": password
    }
    
    try:
        response = requests.post(url, json=data, timeout=10)
        print(f"\nUsername: {username}")
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text[:200]}")
        
        if response.status_code == 200:
            print("✅ LOGIN SUCCESSFUL!")
            break
    except Exception as e:
        print(f"Error: {e}")

print("\n" + "=" * 60)
