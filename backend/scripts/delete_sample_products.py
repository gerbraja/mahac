import sys
import os

# Add parent directory to path
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
sys.path.insert(0, os.path.dirname(parent_dir))

from backend.database.connection import SessionLocal
from backend.database.models.product import Product

db = SessionLocal()

def delete_sample_products():
    """
    PERMANENTLY DELETE products that don't have Imgur images (sample products)
    Keep only real products with Imgur images
    """
    print("=" * 80)
    print("🗑️  ELIMINANDO PRODUCTOS DE MUESTRA PERMANENTEMENTE")
    print("=" * 80)
    
    all_products = db.query(Product).all()
    
    to_delete = []
    to_keep = []
    
    for p in all_products:
        # Check if product has an Imgur image URL
        has_imgur = p.image_url and "imgur.com" in p.image_url.lower()
        
        if not has_imgur:
            # This is a sample product, mark for deletion
            to_delete.append(p)
            print(f"🗑️  Para eliminar: ID={p.id:3d} | {p.name}")
        else:
            # This is a real product with Imgur image, keep it
            to_keep.append(p)
            print(f"✅ Mantener:      ID={p.id:3d} | {p.name}")
    
    print("\n" + "=" * 80)
    print(f"📊 RESUMEN:")
    print(f"   Productos a eliminar (muestra): {len(to_delete)}")
    print(f"   Productos a mantener (reales):  {len(to_keep)}")
    print("=" * 80)
    
    if to_delete:
        print(f"\n⚠️  ADVERTENCIA: Se eliminarán {len(to_delete)} productos de la base de datos.")
        print("Esta acción NO se puede deshacer.\n")
        
        confirm = input("¿Deseas continuar? (escribe 'SI' para confirmar): ")
        
        if confirm.upper() == "SI":
            print("\n🔄 Eliminando productos de muestra...")
            for p in to_delete:
                db.delete(p)
                print(f"   ❌ Eliminado: {p.name}")
            
            try:
                db.commit()
                print("\n✅ Productos de muestra eliminados exitosamente de la base de datos.")
                print(f"✅ {len(to_keep)} productos reales permanecen en la base de datos.")
            except Exception as e:
                db.rollback()
                print(f"\n❌ Error al eliminar productos: {e}")
        else:
            print("\n❌ Operación cancelada. No se eliminó ningún producto.")
    else:
        print("\n✅ No hay productos de muestra para eliminar.")
    
    db.close()
    
    print("\n" + "=" * 80)
    print("🎉 PROCESO COMPLETADO")
    print("=" * 80)

if __name__ == "__main__":
    delete_sample_products()
