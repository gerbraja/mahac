"""
Script to create binary_millionaire_members table in PostgreSQL directly.
Use this if backend is connected to PostgreSQL Cloud SQL.
"""
import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session

# Try to get PostgreSQL connection from environment
db_user = os.getenv("DB_USER")
db_pass = os.getenv("DB_PASS")
db_name = os.getenv("DB_NAME")
cloud_sql = os.getenv("CLOUD_SQL_CONNECTION_NAME")

if all([db_user, db_pass, db_name, cloud_sql]):
    print("Using PostgreSQL Cloud SQL")
    DATABASE_URL = f"postgresql+pg8000://{db_user}:{db_pass}@/{db_name}?unix_sock=/cloudsql/{cloud_sql}/.s.PGSQL.5432"
else:
    print("PostgreSQL environment variables not found!")
    print("Please run this with:")
    print('$env:DB_USER="your_user"')
    print('$env:DB_PASS="your_pass"')
    print('$env:DB_NAME="your_db"')
    print('$env:CLOUD_SQL_CONNECTION_NAME="project:region:instance"')
    exit(1)

engine = create_engine(DATABASE_URL)

print(f"\nConnecting to: {db_name}")

# Create table
print("\n1. Creating binary_millionaire_members table...")
with engine.connect() as conn:
    conn.execute(text("""
        CREATE TABLE IF NOT EXISTS binary_millionaire_members (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL,
            upline_id INTEGER REFERENCES binary_millionaire_members(id),
            position VARCHAR(10),
            global_position INTEGER UNIQUE,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT NOW()
        )
    """))
    
    conn.execute(text("CREATE INDEX IF NOT EXISTS idx_bmm_user_id ON binary_millionaire_members(user_id)"))
    conn.execute(text("CREATE INDEX IF NOT EXISTS idx_bmm_global_pos ON binary_millionaire_members(global_position)"))
    conn.commit()

print("✓ Table created!")

# Register active users
print("\n2. Registering active users...")
with Session(engine) as db:
    result = db.execute(text("SELECT id, username FROM users WHERE status = 'active' ORDER BY id"))
    active_users = result.fetchall()
    
    print(f"Found {len(active_users)} active users")
    
    for user_id, username in active_users:
        # Check if exists
        exists = db.execute(text("SELECT COUNT(*) FROM binary_millionaire_members WHERE user_id = :uid"), {"uid": user_id}).scalar()
        if exists:
            print(f"  - {username:25s} already registered")
            continue
        
        # Get max position
        max_pos = db.execute(text("SELECT COALESCE(MAX(global_position), 0) FROM binary_millionaire_members")).scalar()
        
        # Get first node
        root = db.execute(text("SELECT id FROM binary_millionaire_members ORDER BY id LIMIT 1")).fetchone()
        
        if root:
            root_id = root[0]
            left_taken = db.execute(text("SELECT COUNT(*) FROM binary_millionaire_members WHERE upline_id = :rid AND position = 'left'"), {"rid": root_id}).scalar()
            position = 'right' if left_taken > 0 else 'left'
            upline_id = root_id
        else:
            position = 'left'
            upline_id = None
        
        db.execute(text("""
            INSERT INTO binary_millionaire_members (user_id, upline_id, position, global_position, is_active)
            VALUES (:uid, :upline, :pos, :gpos, TRUE)
        """), {"uid": user_id, "upline": upline_id, "pos": position, "gpos": max_pos + 1})
        
        db.commit()
        print(f"  ✓ {username:25s} -> Position #{max_pos + 1}")

print("\n✓ Complete!")
