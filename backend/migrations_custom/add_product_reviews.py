import os
import sys
from sqlalchemy import create_engine, inspect, text
from dotenv import load_dotenv

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))
from backend.database.connection import Base, DATABASE_URL
from backend.database.models.product_review import ProductReview

# Load specific env var if needed, though DATABASE_URL should be available
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

def run_migration():
    engine = create_engine(DATABASE_URL)
    inspector = inspect(engine)
    
    with engine.connect() as conn:
        print("Checking 'products' table for new rating columns...")
        columns = [col['name'] for col in inspector.get_columns('products')]
        
        if 'average_rating' not in columns:
            print("Adding 'average_rating' to 'products'...")
            conn.execute(text("ALTER TABLE products ADD COLUMN average_rating FLOAT DEFAULT 0.0"))
            conn.execute(text("UPDATE products SET average_rating = 0.0"))
            
        if 'rating_count' not in columns:
            print("Adding 'rating_count' to 'products'...")
            conn.execute(text("ALTER TABLE products ADD COLUMN rating_count INTEGER DEFAULT 0"))
            conn.execute(text("UPDATE products SET rating_count = 0"))
            
        conn.commit()

    print("Ensuring 'product_reviews' table exists...")
    Base.metadata.create_all(bind=engine, tables=[ProductReview.__table__])
    
    print("Migration successful! Product Reviews schema is ready.")

if __name__ == "__main__":
    run_migration()
