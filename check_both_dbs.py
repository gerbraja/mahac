"""
Script para diagnosticar el estado de las dos bases de datos detectadas.
Compara 'dev.db' y 'backend/dev.db'.
"""
import sys
import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Paths
ROOT_DB = "sqlite:///./dev.db"
BACKEND_DB = "sqlite:///./backend/dev.db"

def check_db(name, url):
    print(f"\n🔍 ANALIZANDO: {name} ({url})")
    print("-" * 50)
    
    if not os.path.exists(url.replace("sqlite:///./", "")):
        print("❌ El archivo no existe.")
        return

    try:
        engine = create_engine(url)
        Session = sessionmaker(bind=engine)
        session = Session()
        
        # 1. Check Admin
        result = session.execute(text("SELECT id, username, email, password FROM users WHERE username='admin'")).fetchone()
        if result:
            print(f"✅ Usuario Admin: ENCONTRADO (ID: {result[0]})")
            # We can't easily verify hash here without passlib context, but existence is good.
        else:
            print("❌ Usuario Admin: NO ENCONTRADO")
            
        # 2. Check Products
        prod_count = session.execute(text("SELECT count(*) FROM products")).scalar()
        print(f"📦 Total Productos: {prod_count}")
        
        # 3. Check for specific restored product
        infactor = session.execute(text("SELECT name, image_url FROM products WHERE name='Infactor'")).fetchone()
        if infactor:
            print(f"✅ Producto 'Infactor': ENCONTRADO")
            print(f"   Imagen: {infactor[1]}")
        else:
            print("❌ Producto 'Infactor': NO ENCONTRADO")
            
        session.close()
        
    except Exception as e:
        print(f"❌ Error al leer DB: {e}")

if __name__ == "__main__":
    print("="*60)
    print("DIAGNÓSTICO DE BASES DE DATOS")
    print("="*60)
    
    check_db("ROOT DB (dev.db)", ROOT_DB)
    check_db("BACKEND DB (backend/dev.db)", BACKEND_DB)
    print("\n" + "="*60)
