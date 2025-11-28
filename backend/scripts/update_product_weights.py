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
    products = db.query(Product).filter(Product.active == True).all()
    
    print(f"\n📦 PRODUCTOS PARA ACTUALIZAR PESO ({len(products)} total)")
    print("="*80)
    
    # Suggested weights for different categories
    weight_suggestions = {
        "Paquetes de Activación": 100,  # Digital/virtual, minimal weight
        "Alimentos y Suplementos": 800,  # Bottles/containers
        "Tecnología": 300,  # Electronics
        "Hogar": 1200,  # Household items
        "Moda": 200,  # Clothing/accessories
    }
    
    for p in products:
        current_weight = p.weight_grams if hasattr(p, 'weight_grams') else 500
        suggested = weight_suggestions.get(p.category, 500)
        
        print(f"\nID: {p.id} | {p.name}")
        print(f"  Categoría: {p.category}")
        print(f"  Peso actual: {current_weight}g")
        print(f"  Peso sugerido: {suggested}g")
        
        # Update with suggested weight
        p.weight_grams = suggested
    
    # Commit changes
    db.commit()
    print(f"\n✅ Pesos actualizados para {len(products)} productos")
    print("\nPesos asignados por categoría:")
    for cat, weight in weight_suggestions.items():
        count = len([p for p in products if p.category == cat])
        if count > 0:
            print(f"  - {cat}: {weight}g ({count} productos)")

except Exception as e:
    db.rollback()
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
finally:
    db.close()
