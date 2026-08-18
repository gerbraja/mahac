import os
import sys
from sqlalchemy import create_engine, text

sys.stdout.reconfigure(encoding='utf-8')

db_url = os.getenv("DATABASE_URL", "sqlite:///./dev.db")
print(f"Connecting to DB: {db_url}")

engine = create_engine(db_url)

with engine.begin() as conn:
    is_postgres = "postgresql" in db_url
    if is_postgres:
        print("Truncating orders and dependent tables with CASCADE and RESTART IDENTITY on PostgreSQL...")
        conn.execute(text("TRUNCATE TABLE orders, order_items, payment_transactions, product_reviews RESTART IDENTITY CASCADE;"))
    else:
        print("Deleting test order items and orders on SQLite...")
        try:
            conn.execute(text("DELETE FROM product_reviews;"))
        except Exception:
            pass
        conn.execute(text("DELETE FROM order_items;"))
        conn.execute(text("DELETE FROM payment_transactions;"))
        conn.execute(text("DELETE FROM orders;"))
        try:
            conn.execute(text("DELETE FROM sqlite_sequence WHERE name IN ('orders', 'order_items', 'payment_transactions', 'product_reviews');"))
        except Exception as e:
            print(f"Note on sqlite_sequence: {e}")

    result = conn.execute(text("SELECT COUNT(*) FROM orders;")).scalar()
    print(f"Total orders in database: {result}")
    
print("Order reset completed successfully!")
