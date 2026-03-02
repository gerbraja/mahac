import requests

base_url = "https://mlm-backend-679747463414.southamerica-east1.run.app"
login_url = f"{base_url}/auth/login"
target_url = f"{base_url}/api/admin/supplier-orders"

login_data = {
    "username": "admin",
    "password": "AdminTei2025!"
}

try:
    print("Logging in...")
    # Get token using JSON
    res = requests.post(login_url, json=login_data)
    
    if res.status_code == 200:
        token = res.json().get("access_token")
        print("Login successful! Token acquired.")
        
        print(f"Fetching {target_url}...")
        headers = {"Authorization": f"Bearer {token}"}
        target_res = requests.get(target_url, headers=headers)
        print(f"Status Code: {target_res.status_code}")
        print(f"Response: {target_res.text[:1000]}") # Print first 1000 chars
    else:
        print(f"Login failed: {res.status_code}")
        print(res.text)
except Exception as e:
    print(f"Error: {e}")
