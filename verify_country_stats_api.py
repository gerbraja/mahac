import requests
import json
import sys

# Production URL
API_URL = "https://mlm-backend-s52yictoyq-rj.a.run.app"

def test_stats(username, password):
    session = requests.Session()
    
    # 1. Login
    print(f"Logging in as {username}...")
    try:
        login_payload = {
            "username": username,
            "password": password
        }
        
        # Correct login endpoint: /auth/login (not /api/auth/login)
        # Correct Payload: JSON (not form-data)
        response = session.post(f"{API_URL}/auth/login", json=login_payload)
        
        if response.status_code != 200:
            print(f"Login failed: {response.status_code} - {response.text}")
            return
            
        token = response.json().get("access_token")
        print("Login successful.")
        
        # 2. Check Stats Endpoint
        headers = {"Authorization": f"Bearer {token}"}
        # Correct Stats Endpoint: /api/admin/users/stats/countries
        endpoint = f"{API_URL}/api/admin/users/stats/countries"
        print(f"Checking {endpoint}...")
        
        stats_response = session.get(endpoint, headers=headers)
        
        if stats_response.status_code == 200:
            print("Endpoint exists and returned 200 OK.")
            data = stats_response.json()
            print(f"Data received: {json.dumps(data, indent=2)}")
        elif stats_response.status_code == 404:
            print("Endpoint NOT FOUND (404). Deployment might be missing or path is wrong.")
        else:
            print(f"Error: {stats_response.status_code} - {stats_response.text}")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python verify_country_stats_api.py <username> <password>")
    else:
        test_stats(sys.argv[1], sys.argv[2])
