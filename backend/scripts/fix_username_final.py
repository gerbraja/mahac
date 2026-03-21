import json
import psycopg2
import os

# Path to service_env.json
SERVICE_ENV_PATH = "service_env.json"

def get_db_credentials():
    try:
        data = None
        for enc in ['utf-8-sig', 'utf-16', 'utf-16-le', 'utf-8', 'cp1252']:
            try:
                if not os.path.exists(SERVICE_ENV_PATH):
                    return None
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

def fix_user(user_id, new_username):
    creds = get_db_credentials()
    
    # Try multiple possible hosts
    hosts = ["34.176.8.33", "34.39.249.9", "127.0.0.1"]
    
    for host in hosts:
        print(f"Intentando conectar a {host}...")
        try:
            conn = psycopg2.connect(
                host=host,
                database=creds.get("DB_NAME") if creds else "tiendavirtual",
                user=creds.get("DB_USER") if creds else "postgres",
                password=creds.get("DB_PASSWORD") or creds.get("DB_PASS") or "AdminTei2025!",
                connect_timeout=5
            )
            cursor = conn.cursor()
            
            # Check if user exists
            cursor.execute("SELECT id, username, referral_code FROM users WHERE id = %s", (user_id,))
            user = cursor.fetchone()
            
            if user:
                print(f"Usuario encontrado en {host}: ID: {user[0]}, Username: '{user[1]}'")
                cursor.execute("UPDATE users SET username = %s, referral_code = %s WHERE id = %s", (new_username, new_username, user_id))
                conn.commit()
                print(f"✅ Usuario actualizado exitosamente en {host}.")
                cursor.close()
                conn.close()
                return True
            else:
                print(f"Usuario ID {user_id} no encontrado en {host}.")
            
            cursor.close()
            conn.close()
        except Exception as e:
            print(f"Error conectando a {host}: {e}")
    
    return False

if __name__ == "__main__":
    if fix_user(56, "AleMor"):
        print("\nPROCESO COMPLETADO.")
    else:
        print("\nFallo al localizar o actualizar el usuario.")
