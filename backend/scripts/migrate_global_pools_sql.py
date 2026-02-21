from sqlalchemy import create_engine, text
from backend.database.connection import DATABASE_URL

def migrate_pools_sql():
    print(f"Connecting to {DATABASE_URL}")
    engine = create_engine(DATABASE_URL)
    
    with engine.connect() as conn:
        print("Creating Global Pool tables (Raw SQL)...")
        
        # GlobalPool
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS global_pools (
                id SERIAL PRIMARY KEY,
                name VARCHAR(50) UNIQUE,
                total_accumulated FLOAT DEFAULT 0.0,
                current_balance FLOAT DEFAULT 0.0,
                last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """))
        
        # GlobalPoolDistribution
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS global_pool_distributions (
                id SERIAL PRIMARY KEY,
                pool_id INTEGER REFERENCES global_pools(id),
                rank_name VARCHAR(50),
                distribution_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                total_distributed FLOAT NOT NULL,
                amount_per_user FLOAT NOT NULL,
                user_count INTEGER NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """))
        
        # GlobalPoolPayout
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS global_pool_payouts (
                id SERIAL PRIMARY KEY,
                distribution_id INTEGER REFERENCES global_pool_distributions(id),
                user_id INTEGER REFERENCES users(id),
                amount FLOAT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """))
        
        # Initialize Master Pool
        result = conn.execute(text("SELECT id FROM global_pools WHERE name = 'Master Pool'")).fetchone()
        if not result:
            print("Initializing Master Pool...")
            conn.execute(text("INSERT INTO global_pools (name, total_accumulated, current_balance) VALUES ('Master Pool', 0.0, 0.0)"))
            print("Master Pool initialized.")
        
        conn.commit()
        print("Tables created successfully.")

if __name__ == "__main__":
    migrate_pools_sql()
