import sys
import os

# Add parent directory to path
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
sys.path.insert(0, os.path.dirname(parent_dir))

from backend.database.connection import SessionLocal
from backend.database.models.product import Product

db = SessionLocal()

try:
    all_products = db.query(Product).all()
    
    print(f"\n📦 Total de productos en la base de datos: {len(all_products)}\n")
    
    if not all_products:
        print("❌ No hay productos en la base de datos.")
    else:
        activation_products = [p for p in all_products if p.is_activation]
        regular_products = [p for p in all_products if not p.is_activation]
        
        if activation_products:
            print("🚀 PAQUETES DE ACTIVACIÓN:")
            for p in activation_products:
                print(f"   ID: {p.id} | {p.name} | ${p.price_usd} USD | PV: {p.pv} | Stock: {p.stock}")
        
        if regular_products:
            print("\n📦 PRODUCTOS REGULARES:")
            for p in regular_products:
                print(f"   ID: {p.id} | {p.name} | ${p.price_usd} USD | PV: {p.pv} | Stock: {p.stock}")
    
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
finally:
    db.close()
