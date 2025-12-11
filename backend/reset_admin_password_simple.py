"""
Script para resetear la contraseña del admin
"""
import sqlite3
from pathlib import Path
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def reset_admin_password():
    # Conectar a la base de datos
    db_path = Path(__file__).parent / "dev.db"
    
    if not db_path.exists():
        print(f"❌ Base de datos no encontrada en: {db_path}")
        return
    
    conn = sqlite3.connect(str(db_path))
    cursor = conn.cursor()
    
    try:
        # Verificar si existe admin
        cursor.execute("SELECT id, username, email FROM users WHERE username = 'admin' OR is_admin = 1")
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
        new_password = "admin123"
        hashed = pwd_context.hash(new_password)
        
        # Actualizar contraseña y asegurar que is_admin = 1
        cursor.execute("""
            UPDATE users 
            SET password_hash = ?, is_admin = 1, status = 'active'
            WHERE id = ?
        """, (hashed, admin_id))
        
        conn.commit()
        
        print("\n✅ Contraseña reseteada exitosamente!")
        print("")
        print("📝 NUEVAS Credenciales:")
        print(f"   Username: {username}")
        print(f"   Password: {new_password}")
        print("")
        print("🌐 Acceso:")
        print("   1. Ve a http://localhost:5173/login")
        print("   2. Usa las credenciales de arriba")
        print("   3. Luego ve a http://localhost:5173/admin/orders")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    reset_admin_password()
