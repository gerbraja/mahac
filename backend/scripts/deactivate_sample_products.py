import sys
import os

# Add parent directory to path
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
sys.path.insert(0, os.path.dirname(parent_dir))

from backend.database.connection import SessionLocal
from backend.database.models.product import Product

db = SessionLocal()

def deactivate_sample_products():
    """
    Deactivate products that don't have Imgur images (sample products)
    Keep only real products with Imgur images active
    """
    print("=" * 80)
    print("🔄 DESACTIVANDO PRODUCTOS DE MUESTRA")
    print("=" * 80)
    
    all_products = db.query(Product).all()
    
    deactivated = []
    kept_active = []
    
    for p in all_products:
        # Check if product has an Imgur image URL
        has_imgur = p.image_url and "imgur.com" in p.image_url.lower()
        
        if not has_imgur:
            # This is a sample product, deactivate it
            p.active = False
            deactivated.append(p.name)
            print(f"❌ Desactivado: {p.name}")
        else:
            # This is a real product with Imgur image, keep it active
            p.active = True
            kept_active.append(p.name)
            print(f"✅ Mantiene activo: {p.name}")
    
    try:
        db.commit()
        print("\n" + "=" * 80)
        print("📊 RESUMEN:")
        print(f"   Productos desactivados (muestra): {len(deactivated)}")
        print(f"   Productos activos (reales):       {len(kept_active)}")
        print("=" * 80)
        print("\n✅ Cambios guardados exitosamente.")
        
        if kept_active:
            print("\n🎉 Productos activos con imágenes de Imgur:")
            for name in kept_active:
                print(f"   • {name}")
    except Exception as e:
        db.rollback()
        print(f"\n❌ Error al guardar cambios: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    deactivate_sample_products()
