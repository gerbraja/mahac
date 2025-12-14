"""
Script to create/reset admin user with bcrypt password hash
compatible with login endpoint.
"""
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from passlib.context import CryptContext
from backend.database.models.user import User

# Database connection
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASS = os.getenv("DB_PASS", "1234")
DB_NAME = os.getenv("DB_NAME", "tiendavirtual")
CLOUD_SQL_CONNECTION_NAME = os.getenv("CLOUD_SQL_CONNECTION_NAME", "tei-mlm-prod:southamerica-east1:mlm-db")

# Cloud SQL connection
DATABASE_URL = f"postgresql+pg8000://{DB_USER}:{DB_PASS}@/{DB_NAME}?unix_sock=/cloudsql/{CLOUD_SQL_CONNECTION_NAME}/.s.PGSQL.5432"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)

# Create bcrypt context (same as login uses)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def fix_admin():
    db = SessionLocal()
    try:
        # Find admin user
        admin = db.query(User).filter(User.username == "admin").first()
        
        # Plain password
        password = "AdminTei2025!"
        
        # Hash with bcrypt (NO truncation - let bcrypt handle it)
        hashed = pwd_context.hash(password)
        
        if admin:
            print(f"Admin user found (ID: {admin.id})")
            print(f"Updating password...")
            admin.password = hashed
            admin.is_admin = True
            admin.status = "active"
        else:
            print("Admin user not found, creating...")
            admin = User(
                name="Administrador Principal",
                username="admin",
                email="admin@tuempresainternacional.com",
                password=hashed,
                is_admin=True,
                status="active",
                referral_code="admin",
                membership_number=1,
                membership_code="ADMIN001"
            )
            db.add(admin)
        
        db.commit()
        db.refresh(admin)
        
        print(f"✅ Admin user ready!")
        print(f"   ID: {admin.id}")
        print(f"   Username: {admin.username}")
        print(f"   Password: {password}")
        print(f"   Hash (first 50 chars): {hashed[:50]}")
        
        # Test the password verification
        print("\nTesting password verification...")
        if pwd_context.verify(password, hashed):
            print("✅ Password verification SUCCESS")
        else:
            print("❌ Password verification FAILED")
            
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    fix_admin()
