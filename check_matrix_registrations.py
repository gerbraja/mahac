"""
Script to check Forced Matrix registrations and diagnose why they show 0 positions
"""
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
import os

# Use local database for testing
db_path = "backend/mlm_system.db"

if os.path.exists(db_path):
    engine = create_engine(f"sqlite:///{db_path}")
    print(f"✓ Connected to local database: {db_path}")
else:
    # Try production
    db_url = "postgresql://postgres:AdminPostgres2025@34.176.8.33/tiendavirtual"
    engine = create_engine(db_url)
    print(f"✓ Attempting production database connection...")

Session = sessionmaker(bind=engine)
db = Session()

try:
    print("\n" + "="*80)
    print("FORCED MATRIX MEMBERS CHECK")
    print("="*80)
    
    # Check all matrix members
    members = db.execute(text("""
        SELECT 
            m.id,
            m.user_id,
            u.username,
            m.matrix_id,
            m.upline_id,
            m.position,
            m.is_active,
            m.created_at
        FROM matrix_members m
        LEFT JOIN users u ON m.user_id = u.id
        ORDER BY m.created_at ASC
    """)).fetchall()
    
    print(f"\nTotal Matrix Members: {len(members)}")
    
    if len(members) == 0:
        print("\n⚠️  WARNING: NO users are registered in any matrix!")
        print("   This means activation is NOT registering users in forced matrix.")
    else:
        print("\nMatrix Registrations:")
        for member in members:
            mid, uid, username, matrix_id, upline_id, position, is_active, created = member
            print(f"\n  ID: {mid}")
            print(f"    User: {username} (ID: {uid})")
            print(f"    Matrix ID: {matrix_id}")
            print(f"    Upline ID: {upline_id}")
            print(f"    Position: {position}")
            print(f"    Active: {is_active}")
            print(f"    Created: {created}")
    
    # Check matrix 27 specifically (CONSUMIDOR - first matrix)
    print("\n" + "="*80)
    print("MATRIX 27 (CONSUMIDOR) REGISTRATIONS")
    print("="*80)
    
    matrix_27 = db.execute(text("""
        SELECT 
            m.id,
            m.user_id,
            u.username,
            m.upline_id,
            m.position
        FROM matrix_members m
        LEFT JOIN users u ON m.user_id = u.id
        WHERE m.matrix_id = 27
        ORDER BY m.id ASC
    """)).fetchall()
    
    print(f"\nTotal in Matrix 27: {len(matrix_27)}")
    
    if len(matrix_27) > 0:
        for member in matrix_27:
            mid, uid, username, upline_id, position = member
            print(f"  {username}: upline_id={upline_id}, position={position}")
    
    print("\n" + "="*80)
    
except Exception as e:
    print(f"\n❌ Error: {e}")
    import traceback
    traceback.print_exc()
finally:
    db.close()
