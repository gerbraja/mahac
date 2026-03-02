import requests
import sys

def test_live_referral(username):
    url = f"https://mlm-backend-s52yictoyq-rj.a.run.app/auth/verify-referral/{username}"
    print(f"Testing URL: {url}")
    try:
        response = requests.get(url)
        print(f"Status Code: {response.status_code}")
        print(f"Response JSON: {response.json()}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        test_live_referral(sys.argv[1])
    else:
        # Test with a known username if possible, or just a sample
        test_live_referral("admin")
        test_live_referral("dianis75") # Common one in the logs
