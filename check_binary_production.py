"""
Script to call the production API to fix Binary Global positions
This connects to the Cloud SQL database via the deployed backend
"""
import requests
import json

API_URL = "https://api.tuempresainternacional.com"

print("=" * 80)
print("CALLING PRODUCTION API TO FIX BINARY GLOBAL")
print("=" * 80)

# We need to create an admin endpoint to fix this
# For now, let's call the existing endpoints to verify the fix worked

# Check Binary Global status for known users
user_ids = [1, 2, 4, 6, 7]  # admin, TeiAdmin, Sembradores, Gerbraja1, Dianismarcas

for user_id in user_ids:
    print(f"\n{'='*60}")
    print(f"Checking User ID {user_id}")
    print(f"{'='*60}")
    
    try:
        # Get Binary Global status
        response = requests.get(f"{API_URL}/api/binary/global/{user_id}")
        if response.status_code == 200:
            data = response.json()
            print(f"Status: {data.get('status')}")
            print(f"Position: {data.get('position')}")
            print(f"Global Position: {data.get('global_position')}")
            print(f"Is Active: {data.get('is_active')}")
        else:
            print(f"Error: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"Exception: {e}")

print("\n" + "=" * 80)
print("If positions are still NULL, we need to run the fix script on the server")
print("=" * 80)
