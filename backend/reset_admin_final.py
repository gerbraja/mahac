"""
Script para resetear contraseña del admin a admind123
"""
import sqlite3
from pathlib import Path
import argon2

# Usar Argon2 que es lo que usa el sistema
ph = argon2.PasswordHasher()

def reset_admin_password():
    db_path = Path(__file__).parent / "dev.db"
    
    if not db_path.exists():
        print(f"❌ Base de datos no encontrada en: {db_path}")
        return
    
    conn = sqlite3.connect(str(db_path))
    cursor = conn.cursor()
    
    try:
        # Buscar usuario admin
        cursor.execute("SELECT id, username, email FROM users WHERE username = 'admin' OR is_admin = 1 LIMIT 1")
        admin = cursor.fetchone()
        
        if not admin:
            print("❌ No se encontró usuario admin")
            return
        
        admin_id, username, email = admin
        print(f"✅ Usuario encontrado:")
        print(f"   ID: {admin_id}")
        print(f"   Username: {username}")
        print(f"   Email: {email}")
        
        # Nueva contraseña
        new_password = "admind123"
        hashed = ph.hash(new_password)
        
        # Actualizar contraseña (la columna se llama 'password', no 'password_hash')
        cursor.execute("""
            UPDATE users 
            SET password = ?, is_admin = 1, status = 'active'
            WHERE id = ?
        """, (hashed, admin_id))
        
        conn.commit()
        
        print("\n✅ ¡Contraseña reseteada exitosamente!")
        print("")
        print("📝 CREDENCIALES:")
        print(f"   Username: {username}")
        print(f"   Password: {new_password}")
        print("")
        print("🌐 Para acceder al panel de administración:")
        print("   1. Ve a http://localhost:5173/login")
        print("   2. Inicia sesión con las credenciales de arriba")
        print("   3. Luego accede a http://localhost:5173/admin/orders")
        print("")
        print("✨ El sistema de gestión de pedidos está listo para usar!")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    reset_admin_password()
