import requests
import json

print("Testing Production Unilevel API")
print("=" * 60)

# Try different user IDs to find Sembradores
for user_id in [2, 3, 4, 5]:
    url = f"https://api.tuempresainternacional.com/api/unilevel/stats/{user_id}"
    try:
        response = requests.get(url, timeout=10)
        data = response.json()
        
        print(f"\n--- User ID {user_id} ---")
        print(f"Response keys: {list(data.keys())}")
        
        # Check for quick_start_bonus
        if 'quick_start_bonus' in data:
            print(f"✅ quick_start_bonus EXISTS: ${data['quick_start_bonus']}")
        else:
            print(f"❌ quick_start_bonus MISSING - Backend NOT updated!")
        
        print(f"total_earnings: ${data.get('total_earnings', 0)}")
        print(f"total_downline: {data.get('total_downline', 0)}")
        
    except Exception as e:
        print(f"Error for user {user_id}: {e}")

print("\n" + "=" * 60)
