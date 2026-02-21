from sqlalchemy import create_engine
from backend.database.connection import DATABASE_URL, Base
from backend.database.models.user import User # Load User to satisfy FK
from backend.database.models.global_pool import GlobalPool, GlobalPoolDistribution, GlobalPoolPayout
from backend.database.connection import SessionLocal

def migrate_pools():
    print(f"Connecting to {DATABASE_URL}")
    engine = create_engine(DATABASE_URL)
    
    print("Creating tables for Global Pools...")
    # This will create tables if they don't exist
    Base.metadata.create_all(bind=engine)
    print("Tables created.")
    
    # Initialize Master Pool if empty
    db = SessionLocal()
    master = db.query(GlobalPool).filter_by(name="Master Pool").first()
    if not master:
        print("Initializing Master Pool...")
        master = GlobalPool(name="Master Pool", total_accumulated=0.0, current_balance=0.0)
        db.add(master)
        db.commit()
        print("Master Pool initialized.")
    else:
        print(f"Master Pool exists with Correct Balance: ${master.current_balance}")
        
    db.close()

if __name__ == "__main__":
    migrate_pools()
