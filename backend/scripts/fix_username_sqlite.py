import sqlite3
import os

db_path = '../dev.db'
if not os.path.exists(db_path):
    print(f"Error: {db_path} no existe.")
else:
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Primero verificamos si el usuario existe
        cursor.execute("SELECT id, username, referral_code FROM users WHERE id = 56")
        user = cursor.fetchone()
        
        if user:
            print(f"Usuario encontrado: ID: {user[0]}, Username: {user[1]}, Referral Code: {user[2]}")
            # Realizamos el cambio
            cursor.execute("UPDATE users SET username = 'AleMor', referral_code = 'AleMor' WHERE id = 56")
            conn.commit()
            print("Cambio realizado exitosamente en dev.db.")
            
            # Verificamos de nuevo
            cursor.execute("SELECT id, username, referral_code FROM users WHERE id = 56")
            user_after = cursor.fetchone()
            print(f"Datos actualizados: ID: {user_after[0]}, Username: {user_after[1]}, Referral Code: {user_after[2]}")
        else:
            print("Usuario con ID 56 no encontrado en dev.db.")
            
    except Exception as e:
        print(f"Error al manipular SQLite: {e}")
    finally:
        if 'conn' in locals(): conn.close()
