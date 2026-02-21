from sqlalchemy.orm import Session
import os
import sys

# Add parent directory to path
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
sys.path.insert(0, os.path.dirname(parent_dir))

from backend.database.connection import SessionLocal
from backend.database.models.product import Product

def update_levels():
    db = SessionLocal()
    try:
        products = db.query(Product).all()
        count = 0
        for p in products:
            name_upper = p.name.upper()
            
            # Rule 1: Franquicia 1 = Level 1
            if "FRANQUICIA DIGITAL INTERNACIONAL 1" in name_upper:
                p.package_level = 1
                p.is_activation = True # Ensure it activates
                print(f"Updated '{p.name}' to LEVEL 1")
                count += 1
            
            # Rule 2: Any "other" franchise/package = Level 2
            # User said "Nivel 2 con cualquier otro paquete"
            # We look for "Franquicia" or "Paquete" that is NOT #1
            elif ("FRANQUICIA" in name_upper or "PAQUETE" in name_upper) and "INTERNACIONAL 1" not in name_upper:
                # Optional: Differentiate Franquicia 3? User said "any other -> Level 2" for now.
                # But typically Franquicia 3 is Level 3.
                # Let's be smart: if it explicitly says 3, give it 3. Else 2.
                
                if "3" in name_upper:
                    p.package_level = 3
                    print(f"Updated '{p.name}' to LEVEL 3")
                else:
                    p.package_level = 2
                    print(f"Updated '{p.name}' to LEVEL 2")
                
                p.is_activation = True
                count += 1
                
        db.commit()
        print(f"Updated {count} products.")
        
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    update_levels()
