import sys
from pathlib import Path
sys.path.insert(0, 'c:/Users/mahac/multinivel/tiendavirtual/miweb/CentroComercialTEI')

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend.database.models.product import Product

# Nombres de productos reales
real_product_names = ['Infactor', 'foodline', 'Reverastrol', 'Morinlin', 'Limpiap']

# Buscar todos los archivos .db
base_path = Path('c:/Users/mahac/multinivel/tiendavirtual/miweb/CentroComercialTEI')
db_files = list(base_path.rglob('*.db'))

print("Buscando productos reales en todas las bases de datos...")
print("="*80)
print(f"Productos a buscar: {', '.join(real_product_names)}")
print("="*80)

found_db = None
found_products = []

for db_file in sorted(db_files):
    try:
        engine = create_engine(f'sqlite:///{db_file}')
        Session = sessionmaker(bind=engine)
        session = Session()
        
        # Buscar productos por nombre
        for name in real_product_names:
            products = session.query(Product).filter(
                Product.name.like(f'%{name}%')
            ).all()
            
            if products:
                if not found_db:
                    found_db = db_file
                    print(f"\nENCONTRADO en: {db_file.relative_to(base_path)}")
                    print("-"*80)
                
                for p in products:
                    found_products.append(p)
                    has_imgur = "SI" if (p.image_url and 'imgur' in p.image_url.lower()) else "NO"
                    print(f"  ID {p.id}: {p.name}")
                    print(f"         Precio: ${p.price_usd} USD / ${p.price_local} COP")
                    print(f"         PV: {p.pv}")
                    print(f"         Imagen Imgur: {has_imgur}")
                    if p.image_url:
                        print(f"         URL: {p.image_url}")
                    print()
        
        session.close()
    except Exception as e:
        pass

if found_db:
    print("="*80)
    print(f"RESUMEN:")
    print(f"  Base de datos con productos reales: {found_db.relative_to(base_path)}")
    print(f"  Total productos encontrados: {len(found_products)}")
    print(f"  Productos con Imgur: {sum(1 for p in found_products if p.image_url and 'imgur' in p.image_url.lower())}")
    print("="*80)
else:
    print("\nNO SE ENCONTRARON productos con esos nombres en ninguna base de datos.")
    print("Los productos pueden haberse perdido o estar en otro lugar.")
