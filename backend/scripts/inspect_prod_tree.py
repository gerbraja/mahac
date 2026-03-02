import requests
import json

API_URL = "https://mlm-backend-s52yictoyq-rj.a.run.app"

# 1. Login to get token
login_data = {"username": "admin", "password": "TEI2026Master!"}
res = requests.post(f"{API_URL}/auth/login", json=login_data)
if res.status_code != 200:
    print("Login failed:", res.text)
    exit()

token = res.json().get("access_token")
headers = {"Authorization": f"Bearer {token}"}

# 2. Get users list to find Isis and Norma IDs correctly
print("--- FETCHING USERS ---")
res_users = requests.get(f"{API_URL}/api/admin/users", headers=headers)
users = res_users.json()

target_users = []
for u in users:
    if "Isis" in u.get("name", "") or "Norma" in u.get("name", "") or u.get("id") in [34, 40]:
        target_users.append(u)
        print(f"Found Target User: ID {u.get('id')} | Name: {u.get('name')} | Status: {u.get('status')} | Referrer: {u.get('referred_by_id')} | Pkg: {u.get('package_level')}")

# 3. Check their sponsor and Unilevel
my_id = None
for u in target_users:
    my_id = u.get("referred_by_id") # assuming they have the same sponsor
    if my_id: break

print(f"\n--- SPONSOR IS {my_id} ---")

if my_id:
    # See Unilevel members of the sponsor
    res_uni = requests.get(f"{API_URL}/api/unilevel/members/{my_id}", headers=headers)
    if res_uni.status_code == 200:
        print(f"Unilevel network of {my_id}:")
        print(json.dumps(res_uni.json()[:3], indent=2)) # Print first 3
    else:
        print("Failed to get Unilevel:", res_uni.text)
        
    # See Millionaire tree of the sponsor
    res_mil = requests.get(f"{API_URL}/api/binary-millionaire/tree/{my_id}", headers=headers)
    if res_mil.status_code == 200:
        print(f"\nMillionaire network of {my_id}:")
        tree_data = res_mil.json()
        print(f"Node: {tree_data.get('user_id')} | Pos: {tree_data.get('position')} | Global: {tree_data.get('global_position')}")
        children = tree_data.get("children", [])
        print("Children:")
        for c in children:
            print(f"  -> U {c.get('user_id')} | Pos: {c.get('position')}")
    else:
        print("Failed to get Millionaire tree:", res_mil.text)
