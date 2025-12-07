"""
Script para crear las tablas de Forced Matrix en la base de datos
"""
import sys
sys.path.insert(0, r'c:\Users\mahac\multinivel\tiendavirtual\miweb\CentroComercialTEI')

from backend.database.connection import Base, engine
from backend.database.models.forced_matrix import ForcedMatrixMember, ForcedMatrixCycle

def create_tables():
    """Create forced matrix tables in database"""
    print("Creating forced matrix tables...")
    
    # Create tables
    Base.metadata.create_all(bind=engine, tables=[
        ForcedMatrixMember.__table__,
        ForcedMatrixCycle.__table__
    ])
    
    print("✅ Tables created successfully!")
    print("  - forced_matrix_members")
    print("  - forced_matrix_cycles")

if __name__ == "__main__":
    create_tables()
