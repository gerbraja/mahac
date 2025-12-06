"""
Create frozen_crypto table for managing frozen cryptocurrency rewards
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))

from sqlalchemy import create_engine, text

DATABASE_URL = "sqlite:///./dev.db"
engine = create_engine(DATABASE_URL)

try:
    print("\n" + "="*80)
    print("CREANDO TABLA: frozen_crypto")
    print("="*80 + "\n")
    
    with engine.connect() as conn:
        # Check if table exists
        result = conn.execute(text(
            "SELECT name FROM sqlite_master WHERE type='table' AND name='frozen_crypto'"
        ))
        exists = result.fetchone()
        
        if exists:
            print("⚠️  La tabla 'frozen_crypto' ya existe.\n")
        else:
            # Create the table
            conn.execute(text("""
                CREATE TABLE frozen_crypto (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    matrix_id INTEGER NOT NULL,
                    matrix_name VARCHAR(50),
                    crypto_amount REAL NOT NULL,
                    token_count REAL NOT NULL,
                    earned_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    freeze_until TIMESTAMP NOT NULL,
                    is_available BOOLEAN DEFAULT 0,
                    status VARCHAR(20) DEFAULT 'frozen',
                    converted_to_cash BOOLEAN DEFAULT 0,
                    conversion_date TIMESTAMP,
                    withdrawal_date TIMESTAMP,
                    notes VARCHAR(255),
                    FOREIGN KEY (user_id) REFERENCES users(id)
                )
            """))
            
            # Create indexes
            conn.execute(text("CREATE INDEX ix_frozen_crypto_user_id ON frozen_crypto(user_id)"))
            conn.execute(text("CREATE INDEX ix_frozen_crypto_status ON frozen_crypto(status)"))
            conn.execute(text("CREATE INDEX ix_frozen_crypto_is_available ON frozen_crypto(is_available)"))
            
            conn.commit()
            
            print("✅ Tabla 'frozen_crypto' creada exitosamente!")
            print("✅ Índices creados correctamente.\n")
            print("📋 INFORMACIÓN:")
            print("   - Las criptomonedas quedan congeladas por 210 días")
            print("   - Cada token = $100 USD")
            print("   - Después de 210 días pueden convertirse a cash o transferirse a Binance\n")
    
    print("="*80)
    print("¡COMPLETADO!")
    print("="*80 + "\n")
    
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
