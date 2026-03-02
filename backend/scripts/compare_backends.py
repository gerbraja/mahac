import requests

backends = [
    "https://api.tuempresainternacional.com",
    "https://mlm-backend-s52yictoyq-rj.a.run.app"
]

names = ["Nilsaexitosa", "NilsaExitosa", "Nilsaexitosa ", " Nilsaexitosa"]

for base in backends:
    print(f"\nComparing Backend: {base}")
    try:
        # Check database info
        info = requests.get(f"{base}/debug-database-info?key=secure_setup_key_2025").json()
        print(f"Total Users: {info.get('total_users')}")
        
        # Check specific names
        for name in names:
            v = requests.get(f"{base}/auth/verify-referral/{name}").json()
            print(f" - '{name}': {v}")
            
    except Exception as e:
        print(f"Error on {base}: {e}")
