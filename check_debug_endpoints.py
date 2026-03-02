import requests

base_url = "https://mlm-backend-s52yictoyq-rj.a.run.app"

endpoints = [
    "/",
    "/debug-db",
    "/api/products"
]

for ep in endpoints:
    url = base_url + ep
    print(f"Checking {url}...")
    try:
        resp = requests.get(url, timeout=10)
        print(f"Status: {resp.status_code}")
        if resp.status_code == 200:
             print(f"Response: {resp.text[:200]}")
    except Exception as e:
        print(f"Error: {e}")
    print("-" * 20)
