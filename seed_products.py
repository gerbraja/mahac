import requests

url = "https://mlm-backend-s52yictoyq-rj.a.run.app/seed-real-products?key=secure_setup_key_2025"

try:
    print(f"Seeding products via {url}...")
    response = requests.get(url, timeout=30)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Exception: {e}")
