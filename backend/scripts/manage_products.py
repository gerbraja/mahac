import sys
import os

# Add parent directory to path
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
sys.path.insert(0, os.path.dirname(parent_dir))

from backend.database.connection import SessionLocal
from backend.database.models.product import Product

db = SessionLocal()

def manage_products():
    print("=" * 80)
    print("📦 GESTIÓN DE PRODUCTOS")
    print("=" * 80)
    
    all_products = db.query(Product).all()
    
    print(f"\nTotal de productos: {len(all_products)}\n")
    
    # List all products with details
    for idx, p in enumerate(all_products, 1):
        status = "✅ ACTIVO" if p.active else "❌ INACTIVO"
        img_status = "🖼️ Con imagen" if p.image_url else "❌ Sin imagen"
        print(f"{idx:2d}. {status} | ID: {p.id:3d} | {p.name[:40]:40s} | {img_status}")
        if p.image_url:
            print(f"     URL: {p.image_url[:75]}")
    
    print("\n" + "=" * 80)
    print("OPCIONES:")
    print("1. Desactivar productos de muestra (sin imágenes de Imgur)")
    print("2. Activar todos los productos")
    print("3. Mostrar solo productos con imágenes de Imgur")
    print("4. Salir")
    print("=" * 80)
    
    choice = input("\nSelecciona una opción (1-4): ")
    
    if choice == "1":
        # Deactivate sample products (those without Imgur images)
        count = 0
        for p in all_products:
            if not p.image_url or "imgur.com" not in p.image_url.lower():
                p.active = False
                count += 1
                print(f"❌ Desactivado: {p.name}")
        
        db.commit()
        print(f"\n✅ {count} productos de muestra desactivados.")
    
    elif choice == "2":
        # Activate all products
        for p in all_products:
            p.active = True
        db.commit()
        print("\n✅ Todos los productos activados.")
    
    elif choice == "3":
        # Show only products with Imgur images
        imgur_products = [p for p in all_products if p.image_url and "imgur.com" in p.image_url.lower()]
        print(f"\n📸 Productos con imágenes de Imgur: {len(imgur_products)}\n")
        for p in imgur_products:
            status = "✅ ACTIVO" if p.active else "❌ INACTIVO"
            print(f"{status} | {p.name} | {p.image_url}")
    
    db.close()

if __name__ == "__main__":
    manage_products()
