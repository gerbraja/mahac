from backend.database.session import SessionLocal
from backend.database.models.product import Product

def check_products():
    db = SessionLocal()
    try:
        products = db.query(Product).all()
        print(f"Total Products found: {len(products)}")
        for p in products:
            print(f"ID: {p.id}, Name: {p.name}, Active: {p.active}, Is Activation: {p.is_activation}")
    except Exception as e:
        print(f"Error querying database: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    check_products()
