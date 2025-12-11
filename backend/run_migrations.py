# Database Migration Script for Production
# Run this to create all tables in Cloud SQL

import os
import sys

# Database URL should be set via environment variable
# Do NOT hardcode it here

# Import database models
sys.path.insert(0, os.path.dirname(__file__))

from database.connection import Base, engine
from database.models import *  # Import all models

def run_migrations():
    """Create all tables in the database"""
    print("🔄 Starting database migrations...")
    print(f"📊 Database URL: {os.environ.get('DATABASE_URL', 'Not set')}")
    
    try:
        # Create all tables
        print("📝 Creating tables...")
        Base.metadata.create_all(engine)
        print("✅ All tables created successfully!")
        
        # List all tables created
        print("\n📋 Tables created:")
        for table in Base.metadata.sorted_tables:
            print(f"   - {table.name}")
            
    except Exception as e:
        print(f"❌ Error during migration: {e}")
        raise

if __name__ == "__main__":
    run_migrations()
