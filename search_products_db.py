import sys
import os
from pathlib import Path
sys.path.insert(0, 'c:/Users/mahac/multinivel/tiendavirtual/miweb/CentroComercialTEI')

from sqlalchemy import create_engine, inspect
from sqlalchemy.orm import sessionmaker
from backend.database.models.product import Product

# Buscar todos los archivos .db
base_path = Path('c:/Users/mahac/multinivel/tiendavirtual/miweb/CentroComercialTEI')
db_files = list(base_path.rglob('*.db'))

print("Archivos de base de datos encontrados:")
print("="*80)

for db_file in sorted(db_files):
    size_kb = db_file.stat().st_size / 1024
    rel_path = db_file.relative_to(base_path)
    print(f"{str(rel_path):<50} {size_kb:>10.2f} KB")

print("\n" + "="*80)
print("\nAnalizando contenido de cada base de datos...")
print("="*80)

for db_file in sorted(db_files):
    print(f"\nBase de datos: {db_file.relative_to(base_path)}")
    print("-"*80)
    
    try:
        engine = create_engine(f'sqlite:///{db_file}')
        Session = sessionmaker(bind=engine)
        session = Session()
        
        inspector = inspect(engine)
        if 'products' in inspector.get_table_names():
            products = session.query(Product).all()
            products_with_images = [p for p in products if p.image_url and 'imgur' in p.image_url.lower()]
            
            print(f"Total de productos: {len(products)}")
            print(f"Productos con imagenes de Imgur: {len(products_with_images)}")
            
            if len(products) > 0:
                print("\nPrimeros 5 productos:")
                for p in products[:5]:
                    has_img = "SI" if p.image_url else "NO"
                    print(f"  ID {p.id}: {p.name[:40]:<40} Imagen: {has_img}")
                    if p.image_url:
                        print(f"         URL: {p.image_url[:70]}")
        else:
            print("No tiene tabla 'products'")
        
        session.close()
    except Exception as e:
        print(f"Error al leer: {e}")

print("\n" + "="*80)
