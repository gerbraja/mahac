import requests
import json

URLS = [
    "https://tuempresainternacional.com/api/orders/",
    "https://api.tuempresainternacional.com/api/orders/"
]

def check_endpoint():
    for url in URLS:
        print(f"Checking {url}...")
        try:
            # Simulate frontend request with Auth header
            headers = {"Authorization": "Bearer some.fake.token"}
            resp = requests.get(url, headers=headers, timeout=10)
            print(f"Status: {resp.status_code}")
            if resp.status_code == 200:
                print("Success! (First 100 chars):", resp.text[:100])
                try:
                    data = resp.json()
                    print(f"Count: {len(data)}")
                except:
                    print("Could not parse JSON")
            else:
                print("Error Response:", resp.text[:200])
        except Exception as e:
            print(f"Failed to connect: {e}")
        print("-" * 30)

if __name__ == "__main__":
    check_endpoint()
