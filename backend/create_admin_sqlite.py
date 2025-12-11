"""
Script simple para crear usuario administrador en SQLite
"""
import sqlite3
from pathlib import Path
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def create_admin():
    # Conectar a la base de datos
    db_path = Path(__file__).parent / "dev.db"
    
    if not db_path.exists():
        print(f"❌ Base de datos no encontrada en: {db_path}")
        return
    
    conn = sqlite3.connect(str(db_path))
    cursor = conn.cursor()
    
    try:
        # Verificar si ya existe admin
        cursor.execute("SELECT * FROM users WHERE username = 'admin'")
        existing = cursor.fetchone()
        
        if existing:
            print("⚠️  Usuario admin ya existe!")
            print(f"   Username: admin")
            print(f"   Email: admin@tuempresainternacional.com")
            print("\n💡 Credenciales:")
            print("   Username: admin")
            print("   Password: Admin2025!TEI")
            return
        
        # Crear admin
        password = "Admin2025!TEI"
        hashed = pwd_context.hash(password)
        
        cursor.execute("""
            INSERT INTO users (
                username, email, password_hash, is_admin, status, 
                name, membership_number, country
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            "admin",
            "admin@tuempresainternacional.com",
            hashed,
            1,  # is_admin = True
            "active",
            "Administrador TEI",
            "0000001",
            "Colombia"
        ))
        
        conn.commit()
        
        print("✅ Usuario admin creado exitosamente!")
        print("")
        print("📝 Credenciales:")
        print(f"   Username: admin")
        print(f"   Password: {password}")
        print("")
        print("🌐 Acceso:")
        print("   1. Ve a http://localhost:5173/login")
        print("   2. Inicia sesión con las credenciales de arriba")
        print("   3. Luego ve a http://localhost:5173/admin")
        print("")
        print("⚠️  Cambia la contraseña después del primer inicio de sesión!")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    create_admin()
