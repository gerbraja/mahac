import sys
import os

# Add project root to path
project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.append(project_root)

from backend.database.connection import engine
from sqlalchemy import text, inspect

def run_migration():
    print("🚀 Iniciando migración de Roles de Administrador...")
    
    inspector = inspect(engine)
    
    if "users" not in inspector.get_table_names():
        print("❌ Error: La tabla 'users' no existe.")
        return

    columns = [c['name'] for c in inspector.get_columns("users")]
    
    with engine.begin() as conn:
        if "admin_role" not in columns:
            print("🛠️  Agregando columna 'admin_role' a la tabla 'users'...")
            conn.execute(text("ALTER TABLE users ADD COLUMN admin_role VARCHAR(50) DEFAULT 'user'"))
            print("✅ Columna 'admin_role' creada.")
        else:
            print("⚠️  La columna 'admin_role' ya existe. Omitiendo.")
            
        if "admin_country" not in columns:
            print("🛠️  Agregando columna 'admin_country' a la tabla 'users'...")
            conn.execute(text("ALTER TABLE users ADD COLUMN admin_country VARCHAR(100)"))
            print("✅ Columna 'admin_country' creada.")
        else:
            print("⚠️  La columna 'admin_country' ya existe. Omitiendo.")

        # Assign 'superadmin' to existing admins
        print("🛠️  Actualizando administradores existentes a 'superadmin'...")
        result = conn.execute(text("UPDATE users SET admin_role = 'superadmin' WHERE is_admin = true AND (admin_role = 'user' OR admin_role IS NULL)"))
        print(f"✅ {result.rowcount} administradores actualizados a 'superadmin'.")

    print("🎉 Migración completada exitosamente.")

if __name__ == "__main__":
    run_migration()
