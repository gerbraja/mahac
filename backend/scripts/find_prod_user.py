import json
import psycopg2
import sys

# Path to service_env.json
SERVICE_ENV_PATH = "service_env.json"

def get_db_credentials():
    try:
        data = None
        for enc in ['utf-8-sig', 'utf-16', 'utf-16-le', 'utf-8', 'cp1252']:
            try:
                with open(SERVICE_ENV_PATH, "r", encoding=enc) as f:
                    data = json.load(f)
                break
            except Exception:
                continue
        
        if data is None: return None
        
        env_vars = {}
        def find_env(obj):
            if isinstance(obj, dict):
                if 'env' in obj and isinstance(obj['env'], list):
                    return obj['env']
                for k, v in obj.items():
                    res = find_env(v)
                    if res: return res
            elif isinstance(obj, list):
                for item in obj:
                    res = find_env(item)
                    if res: return res
            return None

        env_list = find_env(data)
        if not env_list: return None

        for item in env_list:
            if 'name' in item and 'value' in item:
                env_vars[item['name']] = item['value']
        return env_vars
    except Exception as e:
        print(f"Error reading credentials: {e}")
        return None

def find_user(search_term):
    creds = get_db_credentials()
    if not creds: return

    DB_HOST = "34.176.8.33"
    DB_NAME = creds.get("DB_NAME")
    DB_USER = creds.get("DB_USER")
    DB_PASS = creds.get("DB_PASSWORD") or creds.get("DB_PASS")

    try:
        conn = psycopg2.connect(
            host=DB_HOST,
            database=DB_NAME,
            user=DB_USER,
            password=DB_PASS,
            connect_timeout=10
        )
        cursor = conn.cursor()
        
        print(f"Searching for '{search_term}' in '{DB_NAME}'...")
        
        # Search for username OR referral_code OR name
        query = "SELECT id, username, referral_code, name, status FROM users WHERE LOWER(username) LIKE LOWER(%s) OR LOWER(referral_code) LIKE LOWER(%s) OR LOWER(name) LIKE LOWER(%s)"
        cursor.execute(query, ('%' + search_term + '%', '%' + search_term + '%', '%' + search_term + '%'))
        results = cursor.fetchall()
        
        if results:
            print(f"\nFound {len(results)} matches:")
            for row in results:
                print(f"ID: {row[0]} | Username: '{row[1]}' | RefCode: '{row[2]}' | Name: '{row[3]}' | Status: {row[4]}")
        else:
            print(f"\nNo user found matching '{search_term}'.")
            
            # List first 50 users to see what's there
            print("\nListing first 50 users in DB:")
            cursor.execute("SELECT username FROM users LIMIT 50")
            all_users = cursor.fetchall()
            for u in all_users:
                print(f"- {u[0]}")
        
        cursor.close()
        conn.close()
    except Exception as e:
        print(f"DB Error: {e}")

if __name__ == "__main__":
    term = sys.argv[1] if len(sys.argv) > 1 else "Nilsa"
    find_user(term)
