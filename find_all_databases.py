import sys
import os
from pathlib import Path
sys.path.insert(0, 'c:/Users/mahac/multinivel/tiendavirtual/miweb/CentroComercialTEI')

# Buscar todos los archivos .db y .db.backup
base_path = Path('c:/Users/mahac/multinivel/tiendavirtual/miweb/CentroComercialTEI')
db_files = list(base_path.rglob('*.db*'))

print("📁 Archivos de base de datos encontrados:\n")
print(f"{'Archivo':<60} {'Tamaño (KB)':<15} {'Última modificación'}")
print("="*100)

for db_file in sorted(db_files):
    size_kb = db_file.stat().st_size / 1024
    mtime = db_file.stat().st_mtime
    from datetime import datetime
    mod_time = datetime.fromtimestamp(mtime).strftime('%Y-%m-%d %H:%M:%S')
    rel_path = db_file.relative_to(base_path)
    print(f"{str(rel_path):<60} {size_kb:<15.2f} {mod_time}")

print("\n" + "="*100)
print("\n🔍 Analizando contenido de cada base de datos...\n")

from sqlalchemy import create_engine, inspect
from sqlalchemy.orm import sessionmaker
from backend.database.models.product import Product

for db_file in sorted(db_files):
    if db_file.suffix == '.db' or '.db' in db_file.name:
        print(f"\n{'='*100}")
        print(f"📊 Base de datos: {db_file.relative_to(base_path)}")
        print('='*100)
        
        try:
            engine = create_engine(f'sqlite:///{db_file}')
            Session = sessionmaker(bind=engine)
            session = Session()
            
            inspector = inspect(engine)
            if 'products' in inspector.get_table_names():
                products = session.query(Product).all()
                print(f"✅ Total de productos: {len(products)}")
                
                products_with_images = [p for p in products if p.image_url]
                print(f"📸 Productos con imágenes: {len(products_with_images)}")
                
                if len(products) > 0:
                    print("\nProductos:")
                    for p in products[:10]:  # Mostrar solo los primeros 10
                        img_status = "✅" if p.image_url else "❌"
                        print(f"  {img_status} ID {p.id}: {p.name} - ${p.price_usd}")
                        if p.image_url:
                            print(f"      🖼️  {p.image_url[:80]}...")
                    
                    if len(products) > 10:
                        print(f"  ... y {len(products) - 10} productos más")
            else:
                print("❌ No tiene tabla 'products'")
            
            session.close()
        except Exception as e:
            print(f"❌ Error al leer: {e}")

print("\n" + "="*100)
