import requests
import json

def detail_audit():
    url = "https://api.tuempresainternacional.com/debug-database-info?key=secure_setup_key_2025"
    try:
        r = requests.get(url)
        data = r.json()
        users = data.get('users_sample', [])
        
        target_usernames = ['admin', 'teiadmin', 'Gerbraja']
        print("=== DETAILED ADMIN AUDIT ===")
        for u in users:
            if u.get('username') in target_usernames:
                status = "ADMIN" if u.get('is_admin') else "user"
                print(f"Username: {u.get('username')} | Email: {u.get('email')} | Admin Status: {status}")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    detail_audit()
