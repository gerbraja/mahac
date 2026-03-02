import os
import sys

# Add CentroComercialTEI to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from sqlalchemy import create_engine, text

engine = create_engine('sqlite:///./dev.db')

def add_missing_columns():
    print("Checking for missing columns in orders table...")
    with engine.connect() as conn:
        try:
            # Check if column exists first
            result = conn.execute(text("PRAGMA table_info(orders)")).fetchall()
            columns = [row[1] for row in result]
            
            missing_cols = {
                'guest_info': 'TEXT',
                'payment_method': 'VARCHAR(50)',
                'tracking_number': 'VARCHAR(100)',
                'payment_confirmed_at': 'DATETIME',
                'shipped_at': 'DATETIME',
                'completed_at': 'DATETIME'
            }
            
            for col_name, col_type in missing_cols.items():
                if col_name not in columns:
                    print(f"Column '{col_name}' not found. Adding it...")
                    conn.execute(text(f"ALTER TABLE orders ADD COLUMN {col_name} {col_type}"))
                    conn.commit()
                    print(f"Successfully added {col_name} column.")
                else:
                    print(f"Column '{col_name}' already exists.")
        except Exception as e:
            print(f"Error checking/adding column: {e}")

if __name__ == "__main__":
    add_missing_columns()
