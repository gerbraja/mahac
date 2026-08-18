import os
import sys
import json
from sqlalchemy.orm import Session
from sqlalchemy import create_engine

# Add the project root (CentroComercialTEI) to path instead of backend to resolve 'backend.X' imports
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.dirname(current_dir)
project_root = os.path.dirname(backend_dir)
sys.path.append(project_root)

from backend.database.models.user import User

def main():
    # Usamos la misma conexión de Cloud SQL Proxy de tu script check_prod.py
    DB_URL = "postgresql+psycopg2://postgres:AdminPostgres2025@127.0.0.1:5432/tiendavirtual"
    engine = create_engine(DB_URL)
    SessionLocal = lambda: Session(engine)
    
    print(f"Connecting to production database at 127.0.0.1:5432 ...")
    
    frontend_dir = os.path.abspath(os.path.join(backend_dir, '../frontend'))
    divipola_path = os.path.join(frontend_dir, 'colombia_divipola_completo.json')
    statemap_path = os.path.join(frontend_dir, 'state_iso_map.json')
    
    if not os.path.exists(divipola_path) or not os.path.exists(statemap_path):
        print("Error: Required JSON mapping files not found in frontend directory.")
        print(f"Looked for: {divipola_path} and {statemap_path}")
        return

    with open(divipola_path, 'r', encoding='utf-8') as f:
        divipola_data = json.load(f)
        
    with open(statemap_path, 'r', encoding='utf-8') as f:
        state_map = json.load(f)
        
    with SessionLocal() as session:
        # Assuming we only need to migrate users from Colombia
        users = session.query(User).filter(User.country == 'Colombia').all()
        
        updated_count = 0
        skipped_count = 0
        
        for user in users:
            # Skip if already exactly 5 digits and matches municipio_id (already divipola)
            if user.postal_code and len(str(user.postal_code).strip()) == 5 and user.municipio_id == user.postal_code:
                skipped_count += 1
                continue
                
            state_iso = state_map.get(user.province)
            if not state_iso:
                # Intentemos buscar de forma aproximada o imprimir error
                print(f"Skipping {user.username}: Province '{user.province}' not found in state_map.")
                skipped_count += 1
                continue
                
            city_mapping = divipola_data.get(state_iso, {})
            divipola_code = city_mapping.get(user.city)
            
            if divipola_code:
                print(f"Update: {user.username} | {user.city}, {user.province} | old_postal: {user.postal_code} -> DIVIPOLA: {divipola_code}")
                user.postal_code = divipola_code
                user.municipio_id = divipola_code
                updated_count += 1
            else:
                print(f"Warning: City '{user.city}' not found in {state_iso} ({user.province}) for user {user.username}")
                skipped_count += 1
                
        # Guardar cambios
        session.commit()
        print(f"\nMigration complete. Updated {updated_count} users. Skipped {skipped_count} users.")

if __name__ == "__main__":
    main()
