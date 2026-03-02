import requests
import json

def audit_admins():
    url = "https://api.tuempresainternacional.com/debug-database-info?key=secure_setup_key_2025"
    try:
        r = requests.get(url)
        data = r.json()
        print(f"Total Users: {data.get('total_users')}")
        users = data.get('users_sample', [])
        
        print("\n--- Admin Status Audit ---")
        for u in users:
            status = "ADMIN" if u.get('is_admin') else "user"
            print(f"ID: {u.get('id')} | Username: {u.get('username')} | Email: {u.get('email')} | Role: {status}")
            
    except Exception as e:
        print(f"Error auditing admins: {e}")

if __name__ == "__main__":
    audit_admins()
