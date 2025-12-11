"""
Script para crear las tablas de special_bonuses y travel_bonuses en la base de datos
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))

from backend.database.connection import Base, engine
from backend.database.models.special_bonuses import SpecialBonus, TravelBonus

def create_special_bonuses_tables():
    print("📊 Creando tablas de bonos especiales...")
    
    # Importar todos los modelos para asegurar que Base tenga la metadata completa
    from backend.database.models import user  # noqa
    from backend.database.models import special_bonuses  # noqa
    
    # Crear solo las tablas que no existen
    Base.metadata.create_all(bind=engine)
    
    print("✅ Tablas creadas exitosamente:")
    print("   - special_bonuses")
    print("   - travel_bonuses")

if __name__ == "__main__":
    create_special_bonuses_tables()
