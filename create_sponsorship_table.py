"""
Create sponsorship_commissions table directly in SQLite
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Connect to the database
DATABASE_URL = "sqlite:///./dev.db"
engine = create_engine(DATABASE_URL)

try:
    print("\n" + "="*80)
    print("CREANDO TABLA: sponsorship_commissions")
    print("="*80 + "\n")
    
    with engine.connect() as conn:
        # Check if table exists
        result = conn.execute(text(
            "SELECT name FROM sqlite_master WHERE type='table' AND name='sponsorship_commissions'"
        ))
        exists = result.fetchone()
        
        if exists:
            print("⚠️  La tabla 'sponsorship_commissions' ya existe.")
            print("   Si quieres recrearla, elimínala primero manualmente.\n")
        else:
            # Create the table
            conn.execute(text("""
                CREATE TABLE sponsorship_commissions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    sponsor_id INTEGER NOT NULL,
                    new_member_id INTEGER NOT NULL,
                    package_amount REAL NOT NULL,
                    commission_amount REAL NOT NULL DEFAULT 9.7,
                    status VARCHAR(20) DEFAULT 'pending',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    paid_at TIMESTAMP,
                    FOREIGN KEY (sponsor_id) REFERENCES users(id),
                    FOREIGN KEY (new_member_id) REFERENCES users(id)
                )
            """))
            
            # Create indexes
            conn.execute(text(
                "CREATE INDEX ix_sponsorship_commissions_sponsor_id ON sponsorship_commissions(sponsor_id)"
            ))
            conn.execute(text(
                "CREATE INDEX ix_sponsorship_commissions_new_member_id ON sponsorship_commissions(new_member_id)"
            ))
            conn.execute(text(
                "CREATE INDEX ix_sponsorship_commissions_status ON sponsorship_commissions(status)"
            ))
            
            conn.commit()
            
            print("✅ Tabla 'sponsorship_commissions' creada exitosamente!")
            print("✅ Índices creados correctamente.\n")
            print("📋 INFORMACIÓN:")
            print("   - Esta tabla guarda las comisiones de patrocinio directo ($9.7 USD)")
            print("   - Se genera automáticamente cuando alguien compra un paquete de activación")
            print("   - La comisión se paga al sponsor (referred_by_id) del nuevo miembro\n")
    
    print("="*80)
    print("¡COMPLETADO!")
    print("="*80 + "\n")
    
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
