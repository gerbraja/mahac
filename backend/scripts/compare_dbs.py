import sys
import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Add parent directory to path
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
sys.path.insert(0, os.path.dirname(parent_dir))

def check_db(db_path, name):
    print(f"\n--- Verificando Base de Datos: {name} ---")
    print(f"Ruta: {db_path}")
    
    if not os.path.exists(db_path):
        print("❌ El archivo no existe.")
        return

    try:
        # Connect to specific DB file
        engine = create_engine(f"sqlite:///{db_path}")
        Session = sessionmaker(bind=engine)
        session = Session()
        
        # Query products
        result = session.execute(text("SELECT id, name, is_activation FROM products"))
        products = result.fetchall()
        
        print(f"✅ Total productos encontrados: {len(products)}")
        if products:
            print("Lista de productos:")
            for p in products:
                print(f"  - [{p.id}] {p.name} (Activación: {p.is_activation})")
        else:
            print("⚠️ La tabla de productos está vacía.")
            
        session.close()
    except Exception as e:
        print(f"❌ Error al leer la base de datos: {e}")

if __name__ == "__main__":
    # Path to backend/dev.db (Current)
    backend_db = os.path.join(parent_dir, "dev.db")
    
    # Path to CentroComercialTEI/dev.db (Parent)
    # parent_dir is .../backend, so we need to go up one more level
    root_dir = os.path.dirname(parent_dir)
    root_db = os.path.join(root_dir, "dev.db")
    
    check_db(backend_db, "Backend DB (Actual)")
    check_db(root_db, "Root DB (Posible Original)")
