import requests
import json

def final_check():
    url = "https://mlm-backend-s52yictoyq-rj.a.run.app/auth/verify-referral/"
    tests = ["RubyB.J", "rubyb.j", "Nilsaexitosa", "nilsaexitosa", "Nilsaexitosa "]
    
    print("=== LIVE API VERIFICATION ===")
    for t in tests:
        try:
            r = requests.get(url + t)
            valid = r.json().get('valid')
            print(f"Input: '{t}' -> Valid: {valid}")
        except Exception as e:
            print(f"Error testing '{t}': {e}")

if __name__ == "__main__":
    final_check()
