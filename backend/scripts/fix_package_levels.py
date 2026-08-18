from backend.database.connection import SessionLocal
from backend.database.models.product import Product
from backend.database.models.user import User

def fix_package_levels():
    db = SessionLocal()
    try:
        print("🔍 Buscando productos de Activación y Upgrade...")
        
        # 1. Update Activation Packages (Franquicias)
        # Assuming Franquicia 1 has '1' in name, Franquicia 2 has '2'
        act_products = db.query(Product).filter(Product.is_activation == True).all()
        for p in act_products:
            name_lower = p.name.lower()
            if "2" in name_lower or "466" in str(p.price_local):
                p.package_level = 2
                print(f"✅ Actualizando a Nivel 2: {p.name}")
            elif "1" in name_lower:
                p.package_level = 1
                print(f"✅ Actualizando a Nivel 1: {p.name}")
        
        # 2. Update Upgrade Packages
        upg_products = db.query(Product).filter(Product.is_upgrade == True).all()
        for p in upg_products:
            p.package_level = 2
            print(f"✅ Actualizando Upgrade a Nivel 2: {p.name}")
            
        db.commit()
        print("🚀 Productos actualizados correctamente.")
        
        # 3. Update existing users who already bought Franquicia 2 but don't have level 2
        # (This is a safety check just in case someone already bought it)
        # We can find users by their packages, but it's safer to just let the admin manually 
        # edit users if needed, or rely on future purchases. 
        # Let's just fix the products so future purchases work perfectly.
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    fix_package_levels()
