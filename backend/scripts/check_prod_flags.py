import os
import sys

sys.path.append('c:/Users/mahac/multinivel/tiendavirtual/miweb/CentroComercialTEI')

from sqlalchemy import create_engine
from sqlalchemy import text

def main():
    DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:AdminPostgres2025@127.0.0.1:5432/tiendavirtual")
    engine = create_engine(DATABASE_URL)
    
    with engine.connect() as conn:
        result = conn.execute(text("SELECT id, name, is_activation, is_upgrade FROM products WHERE is_activation = TRUE OR is_upgrade = TRUE;"))
        for row in result:
            print(f"ID: {row[0]} | Name: {row[1][:30]} | Activation: {row[2]} | Upgrade: {row[3]}")

if __name__ == '__main__':
    main()
