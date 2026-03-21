import psycopg2

def fix():
    passwords = ["AdminPostgres2025", "AdminTei2025!"]
    user_id = 56
    new_username = "AleMor"
    
    for pwd in passwords:
        print(f"Probando contraseña: {pwd}...")
        try:
            conn = psycopg2.connect(
                host="127.0.0.1",
                port=5432,
                database="tiendavirtual",
                user="postgres",
                password=pwd,
                connect_timeout=5
            )
            cursor = conn.cursor()
            print(f"✅ Conectado con éxito!")
            
            cursor.execute("SELECT id, username FROM users WHERE id = %s", (user_id,))
            user = cursor.fetchone()
            
            if user:
                print(f"Usuario encontrado: ID: {user[0]}, Username: '{user[1]}'")
                cursor.execute("UPDATE users SET username = %s, referral_code = %s WHERE id = %s", (new_username, new_username, user_id))
                conn.commit()
                print(f"✅ Usuario {user_id} actualizado a '{new_username}'")
                cursor.close()
                conn.close()
                return True
            else:
                print(f"Usuario ID {user_id} no encontrado.")
            
            cursor.close()
            conn.close()
        except Exception as e:
            print(f"Error con contraseña {pwd}: {e}")
            
    return False

if __name__ == "__main__":
    fix()
