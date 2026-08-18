from backend.database.connection import engine, Base
from backend.database.models.order import Order
from backend.database.models.order_item import OrderItem
from backend.database.models.payment_transaction import PaymentTransaction

def recreate():
    db_url = str(engine.url)
    print(f"Recreating Order tables in {db_url}...")
    
    # Drop existing tables to clear any bad constraints like NOT NULL on user_id
    Base.metadata.drop_all(engine, tables=[PaymentTransaction.__table__, OrderItem.__table__, Order.__table__])
    
    # Recreate them
    Base.metadata.create_all(engine, tables=[Order.__table__, OrderItem.__table__, PaymentTransaction.__table__])
    
    print("Done recreating tables.")

if __name__ == "__main__":
    recreate()
