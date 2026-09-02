import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from sqlalchemy import create_engine, text
from backend.database.connection import Base
from backend.database.models import user, physical_transaction

# Connect to dev DB
engine = create_engine("sqlite:///./dev.db")

# Add column to users
with engine.connect() as conn:
    try:
        conn.execute(text("ALTER TABLE users ADD COLUMN commission_margin FLOAT DEFAULT 20.0"))
        print("Added commission_margin to users")
    except Exception as e:
        if "duplicate column name" in str(e).lower() or "operationalerror" in str(e).lower():
            print("commission_margin already exists or handled by ORM")
        else:
            print("Error altering users table:", e)
    
    conn.commit()

# Create physical_transactions table
Base.metadata.create_all(engine)
print("physical_transactions table created successfully!")
