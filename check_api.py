import requests
import json

url = "https://mlm-backend-s52yictoyq-rj.a.run.app/api/products"

try:
    print(f"Fetching {url}...")
    response = requests.get(url, timeout=10)
    print(f"Status Code: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"Products count: {len(data)}")
        print(json.dumps(data[:2], indent=2)) # Print first 2 products
    else:
        print(f"Error: {response.text}")
except Exception as e:
    print(f"Exception: {e}")
