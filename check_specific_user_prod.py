import json
import psycopg2
import sys

# Path to service_env.json
SERVICE_ENV_PATH = "service_env.json"

def get_db_credentials():
    try:
        encodings = ['utf-16', 'utf-16-le', 'utf-8-sig', 'utf-8', 'cp1252']
        data = None
        for enc in encodings:
            try:
                with open(SERVICE_ENV_PATH, "r", encoding=enc) as f:
                    data = json.load(f)
                print(f"Successfully read service_env.json with encoding: {enc}")
                break
            except Exception as e:
                print(f"Failed with {enc}: {e}")
                
        if data is None:
            print("Failed to read service_env.json with all attempted encodings.")
            return None
        # Cloud Run format: spec -> template -> spec -> containers -> [0] -> env
        # Or direct key-value if simplified
        
        env_vars = {}
        
        # Traverse recursively to find 'env' list
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
        
        if not env_list:
            print("Could not find environment variables in service_env.json")
            return None

        for item in env_list:
            if 'name' in item and 'value' in item:
                env_vars[item['name']] = item['value']
                
        return env_vars
        
    except Exception as e:
        print(f"Error reading service_env.json: {e}")
        return None

def check_user(username):
    creds = get_db_credentials()
    if not creds:
        return

    DB_HOST = "34.176.8.33" # Hardcoded public IP from check_prod_users.py
    DB_NAME = creds.get("DB_NAME")
    DB_USER = creds.get("DB_USER")
    DB_PASS = creds.get("DB_PASSWORD") or creds.get("DB_PASS")

    if not all([DB_NAME, DB_USER, DB_PASS]):
        print("Missing DB credentials in env file")
        print(f"Found keys: {list(creds.keys())}")
        return

    print(f"Connecting to {DB_NAME} as {DB_USER}...")
    
    try:
        conn = psycopg2.connect(
            host=DB_HOST,
            database=DB_NAME,
            user=DB_USER,
            password=DB_PASS,
            connect_timeout=10
        )
        
        cursor = conn.cursor()
        
        # Check user
        query = "SELECT id, username, email, password, status FROM users WHERE username = %s"
        cursor.execute(query, (username,))
        user = cursor.fetchone()
        
        if user:
            uid, uname, email, pwd, status = user
            print(f"\nUser Found: {uname} (ID: {uid})")
            print(f"Email: {email}")
            print(f"Status: {status}")
            print(f"Password Hash Prefix: {pwd[:15] if pwd else 'NONE'}")
            
            # Additional check: Is password valid bcrypt?
            if pwd and (pwd.startswith("$2b$") or pwd.startswith("$2a$")):
                print("Hash Format: Bcrypt (Looks valid)")
            elif pwd and pwd.startswith("$argon2"):
                print("Hash Format: Argon2 (Might be incompatible with current bcrypt-only config)")
            else:
                print(f"Hash Format: Unknown/Other ('{pwd[:10]}...')")
                
        else:
            print(f"\nUser '{username}' NOT FOUND in database.")
            
        cursor.close()
        conn.close()

    except Exception as e:
        print(f"Connection/Query Error: {e}")

if __name__ == "__main__":
    check_user("RubyB.J")
