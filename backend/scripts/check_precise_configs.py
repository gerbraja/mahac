import requests
import json

def check_precise():
    targets = {
        "API": "https://api.tuempresainternacional.com",
        "REV": "https://mlm-backend-s52yictoyq-rj.a.run.app"
    }
    
    for label, base_url in targets.items():
        try:
            r = requests.get(f"{base_url}/debug-database-info?key=secure_setup_key_2025")
            if r.status_code == 200:
                d = r.json()
                db_url = d.get('database_url', 'N/A')
                count = d.get('total_users', -1)
                # Look for database name in the URL (it's at the end)
                db_name = db_url.split('/')[-1] if '/' in db_url else 'Unknown'
                # Check Nilsaexitosa
                v = requests.get(f"{base_url}/auth/verify-referral/Nilsaexitosa ").json()
                v2 = requests.get(f"{base_url}/auth/verify-referral/Nilsaexitosa").json()
                print(f"[{label}] DB: '{db_name}' | Users: {count} | 'Nilsaexitosa ': {v.get('valid')} | 'Nilsaexitosa': {v2.get('valid')}")
            else:
                print(f"[{label}] Error {r.status_code}")
        except Exception as e:
            print(f"[{label}] Request Error: {e}")

if __name__ == "__main__":
    check_precise()
