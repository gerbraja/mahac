import sys
import os

# Add parent directory to path
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
sys.path.insert(0, os.path.dirname(parent_dir))

from backend.database.connection import SessionLocal
from backend.database.models.product import Product

db = SessionLocal()

def check_and_fix_products():
    """
    Check all products and deactivate those without Imgur images
    """
    print("=" * 80)
    print("🔍 VERIFICANDO PRODUCTOS EN LA BASE DE DATOS")
    print("=" * 80)
    
    all_products = db.query(Product).all()
    
    print(f"\nTotal de productos: {len(all_products)}\n")
    
    sample_products = []
    real_products = []
    
    for p in all_products:
        has_imgur = p.image_url and "imgur.com" in p.image_url.lower()
        
        if has_imgur:
            real_products.append(p)
            print(f"✅ REAL (Imgur): ID={p.id:3d} Active={p.active} | {p.name[:40]}")
        else:
            sample_products.append(p)
            print(f"❌ MUESTRA:      ID={p.id:3d} Active={p.active} | {p.name[:40]}")
    
    print("\n" + "=" * 80)
    print(f"📊 RESUMEN:")
    print(f"   Productos reales (con Imgur): {len(real_products)}")
    print(f"   Productos de muestra:         {len(sample_products)}")
    print("=" * 80)
    
    if sample_products:
        print(f"\n🔧 Desactivando {len(sample_products)} productos de muestra...")
        for p in sample_products:
            p.active = False
            print(f"   ❌ Desactivando: {p.name}")
        
        try:
            db.commit()
            print("\n✅ Cambios guardados exitosamente en la base de datos.")
        except Exception as e:
            db.rollback()
            print(f"\n❌ Error al guardar: {e}")
    else:
        print("\n✅ No hay productos de muestra para desactivar.")
    
    # Ensure all real products are active
    if real_products:
        print(f"\n🔧 Asegurando que {len(real_products)} productos reales estén activos...")
        for p in real_products:
            if not p.active:
                p.active = True
                print(f"   ✅ Activando: {p.name}")
        
        try:
            db.commit()
            print("\n✅ Productos reales activados correctamente.")
        except Exception as e:
            db.rollback()
            print(f"\n❌ Error al activar productos reales: {e}")
    
    db.close()
    
    print("\n" + "=" * 80)
    print("🎉 PROCESO COMPLETADO")
    print("=" * 80)

if __name__ == "__main__":
    check_and_fix_products()
