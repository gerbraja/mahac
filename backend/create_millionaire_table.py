"""Create binary_millionaire_members table and register users"""
import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), '..', 'dev.db')

conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()

print("=" * 70)
print("Creating Binary Millionaire Table & Registering Users")
print("=" * 70)

# Create table
print("\n1. Creating binary_millionaire_members table...")
cursor.execute("""
    CREATE TABLE IF NOT EXISTS binary_millionaire_members (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        upline_id INTEGER,
        position VARCHAR(10),
        global_position INTEGER UNIQUE,
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (upline_id) REFERENCES binary_millionaire_members(id)
    )
""")

cursor.execute("""
    CREATE INDEX IF NOT EXISTS idx_bmm_user_id ON binary_millionaire_members(user_id)
""")

cursor.execute("""
    CREATE INDEX IF NOT EXISTS idx_bmm_global_position ON binary_millionaire_members(global_position)
""")

conn.commit()
print("✓ Table created successfully!")

# Register all active users
print("\n2. Finding active users...")
cursor.execute('SELECT id, username, name FROM users WHERE status = "active"')
active_users = cursor.fetchall()

print(f"Found {len(active_users)} active users")

print("\n3. Registering users...")
success = 0

for user_id, username, name in active_users:
    # Check if already registered
    cursor.execute("SELECT COUNT(*) FROM binary_millionaire_members WHERE user_id = ?", (user_id,))
    if cursor.fetchone()[0] > 0:
        print(f"  - {username:25s} already registered")
        continue
    
    try:
        # Get max position
        cursor.execute("SELECT COALESCE(MAX(global_position), 0) FROM binary_millionaire_members")
        max_pos = cursor.fetchone()[0]
        
        # Get first node for placement
        cursor.execute("SELECT id FROM binary_millionaire_members ORDER BY id ASC LIMIT 1")
        root = cursor.fetchone()
        
        if root:
            root_id = root[0]
            # Check if left is taken
            cursor.execute("SELECT COUNT(*) FROM binary_millionaire_members WHERE upline_id = ? AND position = 'left'", (root_id,))
            left_taken = cursor.fetchone()[0]
            position = 'right' if left_taken > 0 else 'left'
            upline = root_id
        else:
            # First user
            position = 'left'
            upline = None
        
        global_pos = max_pos + 1
        
        cursor.execute("""
            INSERT INTO binary_millionaire_members (user_id, upline_id, position, global_position, is_active, created_at)
            VALUES (?, ?, ?, ?, 1, datetime('now'))""",
            (user_id, upline, position, global_pos)
        )
        
        conn.commit()
        success += 1
        print(f"  ✓ {username:25s} -> Position #{global_pos}")
        
    except Exception as e:
        print(f"  ✗ {username:25s} ERROR: {e}")
        conn.rollback()

print(f"\n{'=' * 70}")
print(f"✓ Registered {success}/{len(active_users)} users successfully!")
print("=" * 70)

conn.close()
