"""
Script para diagnosticar problemas de autenticación y verificar el estado del admin.
"""
import sys
sys.path.insert(0, 'c:/Users/mahac/multinivel/tiendavirtual/miweb/CentroComercialTEI')

from backend.database.connection import SessionLocal
from backend.database.models.user import User

def diagnose_admin():
    db = SessionLocal()
    try:
        print("=" * 80)
        print("🔍 DIAGNÓSTICO DE AUTENTICACIÓN")
        print("=" * 80)
        
        # 1. Buscar usuario admin
        admin = db.query(User).filter(User.username == "admin").first()
        
        if not admin:
            print("❌ No se encontró el usuario 'admin'")
            print("\n📝 Creando usuario admin...")
            
            # Usar Argon2 para crear el hash
            from argon2 import PasswordHasher
            pwd_hasher = PasswordHasher()
            
            hashed_password = pwd_hasher.hash("admin123")
            
            new_admin = User(
                name="Administrador Principal",
                email="admin@tei.com",
                username="admin",
                password=hashed_password,
                is_admin=True,
                status="active",
                referral_code="ADMIN001"
            )
            db.add(new_admin)
            db.commit()
            db.refresh(new_admin)
            print("✅ Usuario admin creado con Argon2")
            admin = new_admin
        else:
            print(f"✅ Usuario admin encontrado (ID: {admin.id})")
            print(f"   Email: {admin.email}")
            print(f"   is_admin: {admin.is_admin}")
            print(f"   status: {admin.status}")
            
            # Verificar el formato del hash
            if admin.password:
                if admin.password.startswith("$argon2"):
                    print(f"   Hash: Argon2 ✅")
                elif admin.password.startswith("$2b$") or admin.password.startswith("$2a$"):
                    print(f"   Hash: bcrypt ⚠️ (necesita actualización)")
                    
                    # Actualizar a Argon2
                    print("\n🔄 Actualizando hash a Argon2...")
                    from argon2 import PasswordHasher
                    pwd_hasher = PasswordHasher()
                    admin.password = pwd_hasher.hash("admin123")
                    db.commit()
                    print("✅ Hash actualizado a Argon2")
                else:
                    print(f"   Hash: Formato desconocido ⚠️")
            else:
                print(f"   Hash: ❌ No hay contraseña")
        
        # 2. Verificar contraseña
        print("\n🔐 Verificando contraseña 'admin123'...")
        try:
            from argon2 import PasswordHasher
            pwd_hasher = PasswordHasher()
            pwd_hasher.verify(admin.password, "admin123")
            print("✅ Contraseña verificada correctamente")
        except Exception as e:
            print(f"❌ Error al verificar contraseña: {e}")
            print("   Restableciendo contraseña...")
            admin.password = pwd_hasher.hash("admin123")
            db.commit()
            print("✅ Contraseña restablecida")
        
        print("\n" + "=" * 80)
        print("📋 CREDENCIALES ACTUALES:")
        print("   Usuario: admin")
        print("   Contraseña: admin123")
        print("=" * 80)
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    diagnose_admin()
