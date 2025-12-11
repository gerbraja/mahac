"""
Script simple para verificar y cargar categorías en la base de datos.
"""
import sys
sys.path.insert(0, 'c:/Users/mahac/multinivel/tiendavirtual/miweb/CentroComercialTEI')

from backend.database.connection import SessionLocal
from backend.database.models.category import Category, Subcategory

# Categorías básicas para la tienda
BASIC_CATEGORIES = [
    {
        "code": "SUPLEMENTOS",
        "name": "Suplementos",
        "description": "Suplementos nutricionales y vitaminas"
    },
    {
        "code": "NUTRICION",
        "name": "Nutricion",
        "description": "Productos de nutrición y alimentación"
    },
    {
        "code": "LIMPIEZA",
        "name": "Limpieza",
        "description": "Productos de limpieza para el hogar"
    },
    {
        "code": "GENERAL",
        "name": "General",
        "description": "Productos generales"
    },
    {
        "code": "TECNOLOGIA",
        "name": "Tecnología",
        "description": "Productos tecnológicos"
    },
    {
        "code": "HOGAR",
        "name": "Hogar",
        "description": "Productos para el hogar"
    },
    {
        "code": "MODA",
        "name": "Moda",
        "description": "Ropa y accesorios"
    }
]

def seed_categories():
    db = SessionLocal()
    try:
        print("=" * 80)
        print("📦 CARGANDO CATEGORÍAS")
        print("=" * 80)
        
        # Check existing
        existing_count = db.query(Category).count()
        print(f"Categorías existentes: {existing_count}")
        
        if existing_count > 0:
            print("✅ Ya hay categorías en la base de datos.")
            return
        
        # Insert categories
        count = 0
        for cat_data in BASIC_CATEGORIES:
            existing = db.query(Category).filter(Category.code == cat_data["code"]).first()
            if not existing:
                new_cat = Category(
                    code=cat_data["code"],
                    name=cat_data["name"],
                    description=cat_data["description"]
                )
                db.add(new_cat)
                print(f"✅ Creada: {cat_data['name']}")
                count += 1
        
        db.commit()
        print("=" * 80)
        print(f"🎉 {count} categorías creadas exitosamente")
        print("=" * 80)
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_categories()
