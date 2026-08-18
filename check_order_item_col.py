import os
import sys
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from backend.database.connection import engine
from sqlalchemy import text

try:
    with engine.connect() as conn:
        result = conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name='order_items'"))
        columns = [row[0] for row in result]
        print("Columns in order_items:")
        print(columns)
        if 'is_ordered_from_supplier' in columns:
            print("is_ordered_from_supplier EXACTLY exists!")
        else:
            print("is_ordered_from_supplier DOES NOT exist!")
except Exception as e:
    print(f"Error: {e}")
