"""Direct database fix for Binary Millionaire registration."""
import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), '..', 'dev.db')

print("=" * 70)
print("Binary Millionaire Registration Fix")
print("=" * 70)

conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()

# Find active users not in binary_millionaire_members
query = """
    SELECT id, username, name 
    FROM users 
    WHERE status = 'active'
"""
cursor.execute(query)
all_active = cursor.fetchall()

# Get users already in millionaire
cursor.execute("SELECT user_id FROM binary_millionaire_members")
registered_ids = set(row[0] for row in cursor.fetchall())

# Find missing users
missing = [u for u in all_active if u[0] not in registered_ids]

if not missing:
    print("\n✓ All active users are already registered in Binary Millionaire!")
    conn.close()
    exit(0)

print(f"\nFound {len(missing)} users NOT registered:")
for user_id, username, name in missing:
    print(f"  - ID: {user_id:3d} | {username:25s} | {name}")

print(f"\nRegistering {len(missing)} users...")

# Get max position
cursor.execute("SELECT COALESCE(MAX(global_position), 0) FROM binary_millionaire_members")
max_pos = cursor.fetchone()[0]

# Get first available spot (simplified: add to root)
cursor.execute("SELECT id FROM binary_millionaire_members ORDER BY global_position ASC LIMIT 1")
root = cursor.fetchone()
root_id = root[0] if root else None

success = 0
for user_id, username, name in missing:
    try:
        # Determine position
        if root_id:
            cursor.execute(
                "SELECT position FROM binary_millionaire_members WHERE upline_id = ? ORDER BY position",
                (root_id,)
            )
            taken = [r[0] for r in cursor.fetchall()]
            position = 'right' if 'left' in taken else 'left'
            upline = root_id
        else:
            position = 'left'
            upline = None
        
        max_pos += 1
        
        # Insert
        cursor.execute(
            "INSERT INTO binary_millionaire_members (user_id, upline_id, position, global_position, is_active, created_at) VALUES (?, ?, ?, ?, 1, datetime('now'))",
            (user_id, upline, position, max_pos)
        )
        
        conn.commit()
        success += 1
        print(f"✓ {username:25s} -> Position #{max_pos}")
        
    except Exception as e:
        print(f"✗ {username:25s} ERROR: {e}")
        conn.rollback()

print(f"\n{'=' * 70}")
print(f"✓ Successfully registered {success}/{len(missing)} users!")
print("=" * 70)

conn.close()
