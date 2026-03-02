import requests
import json

def compare():
    urls = {
        "Domain API": "https://api.tuempresainternacional.com",
        "Direct Service URL": "https://mlm-backend-s52yictoyq-rj.a.run.app",
        "New Revision URL": "https://mlm-backend-679747463414.southamerica-east1.run.app"
    }
    
    for label, base_url in urls.items():
        print(f"\n--- {label}: {base_url} ---")
        try:
            r = requests.get(f"{base_url}/debug-database-info?key=secure_setup_key_2025")
            if r.status_code == 200:
                data = r.json()
                print(f"Database URL: {data.get('database_url')}")
                print(f"Total Users: {data.get('total_users')}")
                print(f"Users Sample: {[u['username'] for u in data.get('users_sample', [])]}")
            else:
                print(f"Error {r.status_code}: {r.text}")
        except Exception as e:
            print(f"Request Error: {e}")

if __name__ == "__main__":
    compare()
