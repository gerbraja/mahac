import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), '..', 'dev.db')
conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()

# Check if table exists
cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='binary_millionaire_members'")
table_exists = cursor.fetchone()

if table_exists:
    print("✓ binary_millionaire_members table EXISTS")
    
    cursor.execute("SELECT COUNT(*) FROM binary_millionaire_members")
    count = cursor.fetchone()[0]
    print(f"✓ Total members: {count}")
    
    if count > 0:
        cursor.execute("""
            SELECT u.username, b.global_position 
            FROM users u 
            JOIN binary_millionaire_members b ON u.id = b.user_id 
            ORDER BY b.global_position 
            LIMIT 10
        """)
        print("\nFirst 10 registered:")
        for username, pos in cursor.fetchall():
            print(f"  - {username:25s} Position #{pos}")
else:
    print("✗ binary_millionaire_members table DOES NOT EXIST")

conn.close()
