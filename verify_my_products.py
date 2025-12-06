"""
Script para verificar los productos reales en la base de datos.
Muestra todos los productos actuales con sus detalles.
"""
import sys
sys.path.insert(0, 'c:/Users/mahac/multinivel/tiendavirtual/miweb/CentroComercialTEI')

from backend.database.connection import SessionLocal
from backend.database.models.product import Product

def verify_products():
    """Muestra todos los productos en la base de datos"""
    db = SessionLocal()
    try:
        print("=" * 100)
        print("VERIFICACIÓN DE PRODUCTOS EN LA BASE DE DATOS")
        print("=" * 100)
        
        # Obtener todos los productos
        all_products = db.query(Product).order_by(Product.id).all()
        
        print(f"\n📦 TOTAL DE PRODUCTOS: {len(all_products)}")
        print("=" * 100)
        
        if not all_products:
            print("\n⚠️  No hay productos en la base de datos.")
            print("   Usa el Admin Dashboard para crear productos.")
            return
        
        # Contar productos con imágenes de Imgur
        with_imgur = [p for p in all_products if p.image_url and 'imgur' in p.image_url.lower()]
        without_images = [p for p in all_products if not p.image_url or p.image_url.strip() == '']
        
        print(f"\n✅ Productos con imágenes de Imgur: {len(with_imgur)}")
        print(f"⚠️  Productos sin imagen: {len(without_images)}")
        print("=" * 100)
        
        # Mostrar cada producto
        for i, product in enumerate(all_products, 1):
            print(f"\n{i}. {product.name}")
            print(f"   ID: {product.id}")
            print(f"   Categoría: {product.category}")
            print(f"   Precio USD: ${product.price_usd}")
            print(f"   Precio Local: ${product.price_local:,.0f}" if product.price_local else "   Precio Local: No definido")
            print(f"   PV: {product.pv}")
            print(f"   Stock: {product.stock}")
            print(f"   Peso: {product.weight_grams}g")
            print(f"   Activación: {'Sí' if product.is_activation else 'No'}")
            print(f"   Activo: {'Sí' if product.active else 'No'}")
            
            if product.image_url:
                has_imgur = "✅ SÍ" if 'imgur' in product.image_url.lower() else "⚠️  NO (otra URL)"
                print(f"   Imagen Imgur: {has_imgur}")
                print(f"   URL: {product.image_url}")
            else:
                print(f"   Imagen: ❌ Sin imagen")
            
            print("-" * 100)
        
        # Resumen por categoría
        print("\n📊 RESUMEN POR CATEGORÍA:")
        print("=" * 100)
        categories = {}
        for p in all_products:
            if p.category not in categories:
                categories[p.category] = []
            categories[p.category].append(p)
        
        for category, products in sorted(categories.items()):
            print(f"\n{category}: {len(products)} producto(s)")
            for p in products:
                imgur_icon = "🖼️" if (p.image_url and 'imgur' in p.image_url.lower()) else "❌"
                print(f"  {imgur_icon} {p.name}")
        
        print("\n" + "=" * 100)
        print("✅ Verificación completada")
        print("=" * 100)
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    verify_products()
