import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), '..', 'dev.db')
print(f"Database: {DB_PATH}")

conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()

# Check current state
cursor.execute("SELECT COUNT(*) FROM binary_millionaire_members")
current_count = cursor.fetchone()[0]
print(f"\nCurrent members in Binary Millionaire: {current_count}")

cursor.execute('SELECT COUNT(*) FROM users WHERE status = "active"')
active_count = cursor.fetchone()[0]
print(f"Active users: {active_count}")

# Find missing users
cursor.execute("""
    SELECT u.id, u.username, u.name, u.status
    FROM users u
    WHERE u.status = 'active'
    AND u.id NOT IN (SELECT user_id FROM binary_millionaire_members)
""")

missing = cursor.fetchall()

if not missing:
    print("\n✓ All active users are registered!")
else:
    print(f"\n⚠️ Found {len(missing)} active users NOT registered:")
    for uid, username, name, status in missing:
        print(f"   ID:{uid:3d} | {username:25s} | {name:30s}")
    
    print(f"\nRegistering {len(missing)} users...")
    
    # Get max position
    cursor.execute("SELECT COALESCE(MAX(global_position), 0) FROM binary_millionaire_members")
    max_pos = cursor.fetchone()[0]
    
    # Get first node (root)
    cursor.execute("SELECT id FROM binary_millionaire_members ORDER BY id ASC LIMIT 1")
    root = cursor.fetchone()
    root_id = root[0] if root else None
    
    for uid, username, name, status in missing:
        try:
            if root_id:
                # Check available position
                cursor.execute("SELECT COUNT(*) FROM binary_millionaire_members WHERE upline_id = ? AND position = 'left'", (root_id,))
                left_taken = cursor.fetchone()[0]
                position = 'right' if left_taken > 0 else 'left'
                upline = root_id
            else:
                position = 'left'
                upline = None
            
            max_pos += 1
            
            cursor.execute("""
                INSERT INTO binary_millionaire_members 
                (user_id, upline_id, position, global_position, is_active, created_at)
                VALUES (?, ?, ?, ?, 1, datetime('now'))
            """, (uid, upline, position, max_pos))
            
            print(f"   ✓ {username:25s} -> Position #{max_pos}")
            
        except Exception as e:
            print(f"   ✗ {username:25s} ERROR: {e}")
    
    conn.commit()
    print(f"\n✓ Registration complete!")

conn.close()
