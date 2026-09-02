import sqlite3
import os

db_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'dev.db')

def run_migration():
    if not os.path.exists(db_path):
        print(f"Database not found at {db_path}")
        return
        
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Create merchants table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS merchants (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name VARCHAR(255) NOT NULL,
            document_id VARCHAR(100),
            email VARCHAR(255),
            phone VARCHAR(50),
            address VARCHAR(255),
            city VARCHAR(100),
            country VARCHAR(100),
            commission_margin FLOAT DEFAULT 20.0,
            tax_pct FLOAT DEFAULT 0.0,
            withholding_pct FLOAT DEFAULT 0.0,
            magic_token VARCHAR(255) UNIQUE,
            status VARCHAR(50) DEFAULT 'active',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
        """)
        
        # Create index on magic_token
        cursor.execute("CREATE UNIQUE INDEX IF NOT EXISTS ix_merchants_magic_token ON merchants (magic_token)")
        
        print("Created merchants table and indexes")
        
        # Note: SQLite does not support ALTER TABLE to change foreign key constraints easily.
        # However, for physical_transactions, merchant_id was an INTEGER pointing to users.id.
        # Now it will point to merchants.id. The column type doesn't need to change.
        
        # We should migrate existing "comercio_aliado" users to merchants
        try:
            cursor.execute("SELECT id, name, email, phone, address, city, merchant_tax_pct, merchant_withholding_pct, merchant_token FROM users WHERE admin_role = 'comercio_aliado'")
            comercio_users = cursor.fetchall()
            
            for u in comercio_users:
                cursor.execute("""
                INSERT INTO merchants (id, name, email, phone, address, city, tax_pct, withholding_pct, magic_token)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (u[0], u[1], u[2], u[3], u[4], u[5], u[6], u[7], u[8]))
                
            print(f"Migrated {len(comercio_users)} merchants")
        except Exception as query_e:
            print(f"Could not migrate existing users (perhaps columns don't exist): {query_e}")
        
        # We can leave the old columns in users for now
        
        conn.commit()
        print("Migration successful")
    except Exception as e:
        print(f"Error running migration: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    run_migration()
