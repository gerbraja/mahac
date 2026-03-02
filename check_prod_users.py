"""
Script to check users in production database
"""
import psycopg2
import os

# Production database connection details
DB_HOST = "34.176.8.33"  # Cloud SQL public IP
DB_NAME = "tiendavirtual"
DB_USER = "postgres"
DB_PASSWORD = input("Enter production database password: ")

try:
    conn = psycopg2.connect(
        host=DB_HOST,
        database=DB_NAME,
        user=DB_USER,
        password=DB_PASSWORD
    )
    
    cursor = conn.cursor()
    
    # Get all users
    cursor.execute("""
        SELECT id, username, email, name, status, created_at 
        FROM users 
        ORDER BY id
    """)
    
    users = cursor.fetchall()
    
    print("\n" + "="*80)
    print("PRODUCTION DATABASE USERS")
    print("="*80)
    
    for user in users:
        user_id, username, email, name, status, created_at = user
        print(f"\nID: {user_id}")
        print(f"  Username: {username}")
        print(f"  Email: {email}")
        print(f"  Name: {name}")
        print(f"  Status: {status}")
        print(f"  Created: {created_at}")
    
    cursor.close()
    conn.close()
    
    print("\n" + "="*80)
    print(f"Total users: {len(users)}")
    
except Exception as e:
    print(f"Error: {e}")
