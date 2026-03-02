# Script to check Binary Global registrations via SQL query
import requests
import json

# Use the admin API to check Binary Global registrations
API_URL = "https://api.tuempresainternacional.com"

# First, let's check all users to see their binary global status
print("Checking all users and their Binary Global status...")
print("=" * 60)

# We need to check user IDs. Let's try checking Gerbraja1 and Dianismarcas
for username in ['admin', 'Gerbraja1', 'Dianismarcas']:
    print(f"\n{username}:")
    print("-" * 60)
    
    # First check if we can find their user ID
    # For now we'll try common IDs
    for test_id in range(1, 10):
        try:
            response = requests.get(f"{API_URL}/api/binary/global/{test_id}")
            if response.status_code == 200:
                data = response.json()
                if data.get('status') != 'not_registered':
                    # Found a registered user, let's check who it is
                    # We'd need the user endpoint for this
                    print(f"  User ID {test_id}: {data.get('status')} (Position: {data.get('global_position')})")
        except:
            pass
