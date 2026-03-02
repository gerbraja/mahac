import requests
import json

# Test production login API with correct credentials
url = "https://api.tuempresainternacional.com/auth/login"

data = {
    "username": "Sembradores",
    "password": "Sem7141*"
}

print("Testing Production Login with correct credentials")
print("=" * 60)

try:
    response = requests.post(url, json=data, timeout=10)
    print(f"Status Code: {response.status_code}")
    
    if response.status_code == 200:
        print("✅ LOGIN SUCCESSFUL!")
        result = response.json()
        print(f"\nUser ID: {result.get('user_id')}")
        print(f"Token received: {result.get('access_token')[:50]}...")
        
        # Now test the Unilevel stats API
        user_id = result.get('user_id')
        stats_url = f"https://api.tuempresainternacional.com/api/unilevel/stats/{user_id}"
        stats_response = requests.get(stats_url, timeout=10)
        
        if stats_response.status_code == 200:
            stats = stats_response.json()
            print(f"\n📊 Unilevel Stats:")
            print(f"  Total Earnings: ${stats.get('total_earnings', 0)}")
            print(f"  Quick Start Bonus: ${stats.get('quick_start_bonus', 0)}")
            print(f"  Combined Total: ${stats.get('total_earnings', 0) + stats.get('quick_start_bonus', 0)}")
            print(f"  Total Downline: {stats.get('total_downline', 0)}")
            
    else:
        print(f"❌ LOGIN FAILED")
        print(f"Response: {response.text}")
        
except Exception as e:
    print(f"Error: {e}")

print("\n" + "=" * 60)
