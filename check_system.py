import requests
import sys

def check_backend():
    try:
        response = requests.get('http://127.0.0.1:8000/docs', timeout=5)
        if response.status_code == 200:
            print("✅ Backend: OK (http://127.0.0.1:8000)")
            return True
        else:
            print(f"❌ Backend: Responde pero con error (Status: {response.status_code})")
            return False
    except Exception as e:
        print(f"❌ Backend: No responde - {str(e)}")
        return False

def check_frontend():
    try:
        response = requests.get('http://localhost:5173', timeout=5)
        if response.status_code == 200:
            print("✅ Frontend: OK (http://localhost:5173)")
            return True
        else:
            print(f"❌ Frontend: Responde pero con error (Status: {response.status_code})")
            return False
    except Exception as e:
        print(f"❌ Frontend: No responde - {str(e)}")
        return False

def check_database():
    import os
    db_path = "tei.db"
    if os.path.exists(db_path):
        size_mb = os.path.getsize(db_path) / (1024 * 1024)
        print(f"✅ Base de datos: Existe ({size_mb:.2f} MB)")
        return True
    else:
        print("❌ Base de datos: No encontrada")
        return False

def check_admin_user():
    try:
        import sys
        sys.path.insert(0, '.')
        from backend.database.connection import SessionLocal
        from backend.database.models.user import User
        
        db = SessionLocal()
        admin_count = db.query(User).filter(User.is_admin == True).count()
        db.close()
        
        if admin_count > 0:
            print(f"✅ Usuarios admin: {admin_count} encontrado(s)")
            return True
        else:
            print("⚠️  Usuarios admin: Ninguno encontrado")
            return False
    except Exception as e:
        print(f"⚠️  No se pudo verificar usuarios admin: {str(e)}")
        return False

if __name__ == "__main__":
    print("\n" + "="*60)
    print("          Verificación del Sistema TEI")
    print("="*60 + "\n")
    
    backend_ok = check_backend()
    frontend_ok = check_frontend()
    db_ok = check_database()
    admin_ok = check_admin_user()
    
    print("\n" + "="*60)
    if backend_ok and frontend_ok and db_ok:
        print("✅ Sistema completamente funcional")
        if not admin_ok:
            print("\n⚠️  Recomendación: Ejecuta 'python make_admin.py' para crear un admin")
        sys.exit(0)
    else:
        print("⚠️  Hay problemas que requieren atención")
        print("\nSoluciones rápidas:")
        if not backend_ok:
            print("  - Backend: Ejecuta 'uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000'")
        if not frontend_ok:
            print("  - Frontend: Ejecuta 'npm run dev' en la carpeta frontend")
        if not db_ok:
            print("  - Base de datos: Verifica que el archivo tei.db exista")
        sys.exit(1)
