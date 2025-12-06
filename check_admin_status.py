#!/usr/bin/env python
import sys
sys.path.insert(0, 'C:\\Users\\mahac\\multinivel\\tiendavirtual\\miweb\\CentroComercialTEI')

from backend.database.database import get_db
from backend.database.models.user import User
from sqlalchemy.orm import Session

# Get the database session
db_session = next(get_db())

try:
    # Get the admin user
    admin = db_session.query(User).filter(User.username == "admin").first()
    
    if admin:
        print(f"✅ Admin user found:")
        print(f"  ID: {admin.id}")
        print(f"  Username: {admin.username}")
        print(f"  Email: {admin.email}")
        print(f"  Is Admin: {admin.is_admin}")
        
        if not admin.is_admin:
            print(f"\n⚠️  Admin user is NOT marked as admin. Setting is_admin=True...")
            admin.is_admin = True
            db_session.commit()
            print(f"✅ Admin status updated!")
        else:
            print(f"\n✅ Admin status is already True")
    else:
        print("❌ Admin user not found")
        
finally:
    db_session.close()
