import sqlite3
import sys
import os

# Add backend to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

try:
    conn = sqlite3.connect('dev.db')
    cursor = conn.cursor()
    
    print("=== RECENT USERS ===")
    cursor.execute('SELECT id, name, email, username, status, document_id FROM users ORDER BY id DESC LIMIT 10')
    users = cursor.fetchall()
    
    if not users:
        print("No users found in database")
    else:
        for user in users:
            print(f"ID: {user[0]}, Name: {user[1]}, Email: {user[2]}, Username: {user[3]}, Status: {user[4]}, Doc: {user[5]}")
    
    print("\n=== TOTAL USERS ===")
    cursor.execute('SELECT COUNT(*) FROM users')
    total = cursor.fetchone()[0]
    print(f"Total users in database: {total}")
    
    conn.close()
    print("\nDatabase check completed successfully!")
    
except Exception as e:
    print(f"Error checking database: {e}")
    import traceback
    traceback.print_exc()
