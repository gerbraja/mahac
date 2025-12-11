"""
Script para ver usuarios admin en la base de datos
"""
import sqlite3
from pathlib import Path

def check_admin_users():
    db_path = Path(__file__).parent / "dev.db"
    
    if not db_path.exists():
        print(f"❌ Base de datos no encontrada en: {db_path}")
        return
    
    conn = sqlite3.connect(str(db_path))
    cursor = conn.cursor()
    
    try:
        # Buscar todos los usuarios admin
        cursor.execute("""
            SELECT id, username, email, is_admin, status, name
            FROM users 
            WHERE is_admin = 1 OR username LIKE '%admin%'
        """)
        
        admins = cursor.fetchall()
        
        if not admins:
            print("❌ No se encontraron usuarios administradores")
            return
        
        print("📋 Usuarios Administradores encontrados:\n")
        for admin in admins:
            admin_id, username, email, is_admin, status, name = admin
            print(f"ID: {admin_id}")
            print(f"Username: {username}")
            print(f"Email: {email}")
            print(f"Is Admin: {is_admin}")
            print(f"Status: {status}")
            print(f"Name: {name}")
            print("-" * 50)
        
        print("\n💡 Para iniciar sesión, usa uno de estos usernames")
        print("   Si no recuerdas la contraseña, puedo ayudarte a resetearla")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        conn.close()

if __name__ == "__main__":
    check_admin_users()
