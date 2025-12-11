# Create Admin User in Production Database
import os
import sys
from passlib.context import CryptContext

# Set database URL
if 'DATABASE_URL' not in os.environ:
    print("ERROR: DATABASE_URL environment variable not set")
    sys.exit(1)

sys.path.insert(0, os.path.dirname(__file__))

from database.connection import SessionLocal
from database.models import User

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def create_admin():
    """Create admin user in production database"""
    db = SessionLocal()
    
    try:
        # Check if admin already exists
        existing_admin = db.query(User).filter(User.username == "admin").first()
        if existing_admin:
            print("⚠️  Admin user already exists")
            return
        
        # Create admin user
        admin_password = "Admin2025!TEI"  # Change this password after first login!
        hashed_password = pwd_context.hash(admin_password)
        
        admin_user = User(
            username="admin",
            email="admin@tuempresainternacional.com",
            password_hash=hashed_password,
            is_admin=True,
            status="active",
            name="Administrador TEI",
            membership_number="0000001"
        )
        
        db.add(admin_user)
        db.commit()
        
        print("✅ Admin user created successfully!")
        print("")
        print("📝 Admin Credentials:")
        print(f"   Username: admin")
        print(f"   Password: {admin_password}")
        print("")
        print("⚠️  IMPORTANT: Change this password after first login!")
        
    except Exception as e:
        print(f"❌ Error creating admin user: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    create_admin()
