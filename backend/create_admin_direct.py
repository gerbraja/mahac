# Create Admin User - Direct SQL Version
import os
import sys
import psycopg2
from passlib.hash import pbkdf2_sha256

# Database connection
DB_URL = os.environ.get('DATABASE_URL')
if not DB_URL:
    print("ERROR: DATABASE_URL not set")
    sys.exit(1)

print(f"📊 Connecting to database...")

try:
    # Parse connection string
    # Format: postgresql://user:password@host:port/database
    conn = psycopg2.connect(DB_URL)
    cursor = conn.cursor()
    
    # Check if admin exists
    cursor.execute("SELECT username FROM users WHERE username = 'admin'")
    existing = cursor.fetchone()
    
    if existing:
        print("⚠️  Admin user already exists!")
        cursor.close()
        conn.close()
        sys.exit(0)
    
    # Create admin user with pbkdf2_sha256 (simpler than bcrypt)
    password = "Admin2025!TEI"
    hashed = pbkdf2_sha256.hash(password)
    
    # Insert admin user
    cursor.execute("""
        INSERT INTO users (
            username, email, password, is_admin, 
            status, name, membership_number
        ) VALUES (
            %s, %s, %s, %s, %s, %s, %s
        )
    """, (
        'admin',
        'admin@tuempresainternacional.com',
        hashed,
        True,
        'active',
        'Administrador TEI',
        '0000001'
    ))
    
    conn.commit()
    cursor.close()
    conn.close()
    
    print("✅ Admin user created successfully!")
    print("")
    print("📝 Login Credentials:")
    print(f"   Username: admin")
    print(f"   Password: {password}")
    print("")
    print("⚠️  IMPORTANT: Change this password after first login!")
    print("")
    print("🌐 Access your application at:")
    print("   https://storage.googleapis.com/tuempresainternacional-frontend/index.html")
    
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
