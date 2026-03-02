import requests
import json

def check():
    url = 'https://api.tuempresainternacional.com/debug-database-info?key=secure_setup_key_2025'
    try:
        r = requests.get(url)
        if r.status_code == 200:
            data = r.json()
            print(f"Total Users: {data.get('total_users')}")
            print("Users Sample:")
            for u in data.get('users_sample', []):
                print(f" - {u.get('username')} (ID: {u.get('id')})")
        else:
            print(f"Error {r.status_code}: {r.text}")
    except Exception as e:
        print(f"Request Error: {e}")

if __name__ == "__main__":
    check()
