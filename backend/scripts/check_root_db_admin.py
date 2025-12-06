import sys
import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Add parent directory to path
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
sys.path.insert(0, os.path.dirname(parent_dir))

def check_admin(db_path):
    print(f"Verificando usuarios en: {db_path}")
    
    if not os.path.exists(db_path):
        print("❌ El archivo no existe.")
        return

    try:
        engine = create_engine(f"sqlite:///{db_path}")
        Session = sessionmaker(bind=engine)
        session = Session()
        
        # Check for admin
        result = session.execute(text("SELECT id, username, email, is_admin FROM users WHERE is_admin = 1"))
        admins = result.fetchall()
        
        if admins:
            print("✅ Administradores encontrados:")
            for a in admins:
                print(f"  - {a.username} ({a.email})")
        else:
            print("❌ No hay administradores.")
            
            # Check regular users
            result = session.execute(text("SELECT count(*) FROM users"))
            count = result.scalar()
            print(f"  Total usuarios: {count}")
            
        session.close()
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    root_dir = os.path.dirname(parent_dir)
    root_db = os.path.join(root_dir, "dev.db")
    check_admin(root_db)
