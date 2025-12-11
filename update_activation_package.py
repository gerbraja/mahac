import sys
sys.path.insert(0, '.')

from backend.database.connection import get_db
from backend.database.models.product import Product

db = next(get_db())

# Get PAQUETE DE INICIO BASICO
paquete = db.query(Product).filter(Product.id == 2).first()

if paquete:
    print(f"✅ Producto encontrado: {paquete.name}")
    print(f"   ID: {paquete.id}")
    print(f"   PV: {paquete.pv}")
    print(f"   Es activación: {paquete.is_activation}")
    print(f"   Precio USD: ${paquete.price_usd}")
    print(f"   Precio Local: ${paquete.price_local}")
    print(f"   Categoría: {paquete.category}")
    
    # Ensure it's marked as activation package
    if not paquete.is_activation:
        print(f"\n⚠️ Marcando como producto de activación...")
        paquete.is_activation = True
        db.commit()
        print("✅ Actualizado correctamente")
    else:
        print("\n✅ Ya está marcado como producto de activación")
    
    # Verify PV is 3
    if paquete.pv == 3:
        print("✅ PV correcto: 3")
    else:
        print(f"⚠️ PV actual: {paquete.pv}, actualizando a 3...")
        paquete.pv = 3
        db.commit()
        print("✅ PV actualizado a 3")
else:
    print("❌ Producto ID 2 no encontrado")

db.close()
