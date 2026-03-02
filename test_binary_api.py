# Script to test Binary Global API directly
import requests
import json

# API Base URL
API_URL = "https://api.tuempresainternacional.com"

# User ID (assuming you're testing with user 1 - admin)
user_id = 1

print(f"Testing Binary Global API for User ID: {user_id}")
print("=" * 60)

# Test the status endpoint
print("\n1. Testing /api/binary/global/{user_id}")
print("-" * 60)
try:
    response = requests.get(f"{API_URL}/api/binary/global/{user_id}")
    print(f"Status Code: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(json.dumps(data, indent=2))
    else:
        print(f"Error: {response.text}")
except Exception as e:
    print(f"Exception: {e}")

# Test the stats endpoint
print("\n\n2. Testing /api/binary/global/stats/{user_id}")
print("-" * 60)
try:
    response = requests.get(f"{API_URL}/api/binary/global/stats/{user_id}")
    print(f"Status Code: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(json.dumps(data, indent=2))
        
        # Print specific counts
        print("\n" + "=" * 60)
        print("SUMMARY:")
        print("=" * 60)
        print(f"Left Line Count: {data.get('left_line_count', 0)}")
        print(f"Right Line Count: {data.get('right_line_count', 0)}")
        print(f"Total Network Members: {data.get('total_network_members', 0)}")
        print(f"Total Earnings This Year: ${data.get('total_earnings_this_year', 0):.2f}")
        print(f"Total Earnings All Time: ${data.get('total_earnings_all_time', 0):.2f}")
        
        # Show level stats for first few levels
        print("\nLevel Stats (first 5 levels):")
        print("-" * 60)
        level_stats = data.get('level_stats', [])
        for level_stat in level_stats[:5]:
            print(f"Level {level_stat['level']}: {level_stat['active_members']} active members")
    else:
        print(f"Error: {response.text}")
except Exception as e:
    print(f"Exception: {e}")
