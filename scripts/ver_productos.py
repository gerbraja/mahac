"""
Script para ver todos los productos en la base de datos
"""
from backend.database.connection import get_db
from backend.database.models.product import Product

def ver_productos():
    """Ver todos los productos"""
    db = next(get_db())
    
    print("\n" + "="*80)
    print("PRODUCTOS EN LA BASE DE DATOS")
    print("="*80)
    
    products = db.query(Product).all()
    
    if not products:
        print("\n❌ No hay productos registrados aún.")
        print("\n💡 Para agregar productos:")
        print("   1. Abre el navegador en: http://localhost:5173/dashboard/admin")
        print("   2. Llena el formulario 'Crear Nuevo Producto'")
        print("   3. Incluye el peso en gramos de cada producto")
        return
    
    print(f"\nTotal de productos: {len(products)}\n")
    
    for p in products:
        print(f"{'='*80}")
        print(f"ID: {p.id}")
        print(f"Nombre: {p.name}")
        print(f"Categoría: {p.category}")
        print(f"Precio USD: ${p.price_usd}")
        print(f"Precio Local (COP): ${p.price_local or 'N/A'}")
        print(f"Puntos (PV): {p.pv}")
        print(f"Stock: {p.stock}")
        print(f"⚖️  Peso: {p.weight_grams} gramos")
        print(f"Activación: {'Sí' if p.is_activation else 'No'}")
        print(f"Activo: {'Sí' if p.active else 'No'}")
        print(f"Descripción: {p.description or 'N/A'}")
    
    print(f"\n{'='*80}\n")
    db.close()

if __name__ == "__main__":
    ver_productos()
