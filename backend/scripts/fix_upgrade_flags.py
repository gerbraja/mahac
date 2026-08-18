import os
import sys

sys.path.append('c:/Users/mahac/multinivel/tiendavirtual/miweb/CentroComercialTEI')

from sqlalchemy import create_engine
from sqlalchemy import text

def main():
    DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:AdminPostgres2025@127.0.0.1:5432/tiendavirtual")
    engine = create_engine(DATABASE_URL)
    
    with engine.connect() as conn:
        try:
            print("Seteando is_upgrade = TRUE para los paquetes que tienen UPGRADE en el nombre...")
            result = conn.execute(text("UPDATE products SET is_upgrade = TRUE WHERE name ILIKE '%UPGRADE%';"))
            conn.commit()
            print(f"Paquetes actualizados: {result.rowcount}")
        except Exception as e:
            print(f"Error updating: {e}")
            conn.rollback()

if __name__ == '__main__':
    main()
