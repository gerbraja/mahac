# Create Admin User - Simple Version
import os
import sys

# Check DATABASE_URL
if 'DATABASE_URL' not in os.environ:
    print("ERROR: DATABASE_URL not set")
    print("Run: $env:DATABASE_URL='postgresql://postgres:PASSWORD@127.0.0.1:5432/tiendavirtual'")
    sys.exit(1)

print(f"📊 DATABASE URL: {os.environ['DATABASE_URL']}")

sys.path.insert(0, os.path.dirname(__file__))

from database.connection import SessionLocal
from database.models.user import User
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def create_admin():
    db = SessionLocal()
    
    try:
        # Check if admin exists
        existing = db.query(User).filter(User.username == "admin").first()
        if existing:
            print("⚠️  Admin user already exists!")
            print(f"   Username: {existing.username}")
            print(f"   Email: {existing.email}")
            return
        
        # Create admin
        password = "Admin2025!TEI"
        hashed = pwd_context.hash(password)
        
        admin = User(
            username="admin",
            email="admin@tuempresainternacional.com",
            password_hash=hashed,
            is_admin=True,
            status="active",
            name="Administrador TEI",
            membership_number="0000001"
        )
        
        db.add(admin)
        db.commit()
        
        print("✅ Admin user created!")
        print("")
        print("📝 Credentials:")
        print(f"   Username: admin")
        print(f"   Password: {password}")
        print("")
        print("⚠️  Change password after first login!")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_admin()
