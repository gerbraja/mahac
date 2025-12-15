"""
Migration script to register existing active users in Forced Matrix CONSUMIDOR (ID 27)
"""
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from backend.database.models.user import User
from backend.database.models.matrix import MatrixMember
from backend.mlm.services.matrix_service import MatrixService
from backend.mlm.schemas.plan import MatrixPlan
import yaml
import os

# Production database connection
db_url = os.getenv("DATABASE_URL", "postgresql://postgres:AdminPostgres2025@34.176.8.33/tiendavirtual")

engine = create_engine(db_url)
Session = sessionmaker(bind=engine)
db = Session()

CONSUMIDOR_MATRIX_ID = 27

try:
    print("\n" + "="*80)
    print("FORCED MATRIX MIGRATION - REGISTER ACTIVE USERS IN CONSUMIDOR")
    print("="*80)
    
    # Load Matrix Plan
    matrix_plan_path = os.path.join("backend", "mlm", "plans", "matriz_forzada", "plan_template.yml")
    
    if not os.path.exists(matrix_plan_path):
        print(f"ERROR: Matrix plan file not found at {matrix_plan_path}")
        exit(1)
    
    with open(matrix_plan_path, 'r') as f:
        plan_data = yaml.safe_load(f)
        matrix_plan = MatrixPlan(**plan_data)
        matrix_service = MatrixService(matrix_plan)
    
    # Get all active users
    active_users = db.query(User).filter(User.status == 'active').order_by(User.id.asc()).all()
    
    print(f"\nFound {len(active_users)} active users")
    
    registered_count = 0
    skipped_count = 0
    
    for user in active_users:
        # Check if user is already in Matrix 27
        existing = db.query(MatrixMember).filter(
            MatrixMember.user_id == user.id,
            MatrixMember.matrix_id == CONSUMIDOR_MATRIX_ID
        ).first()
        
        if existing:
            print(f"  ⏭️  Skipping {user.username} (ID: {user.id}) - already in Matrix 27")
            skipped_count += 1
            continue
        
        try:
            # Register user in Matrix 27
            matrix_service.buy_matrix(db, user.id, matrix_id=CONSUMIDOR_MATRIX_ID)
            print(f"  ✓ Registered {user.username} (ID: {user.id}) in Matrix CONSUMIDOR")
            registered_count += 1
        except Exception as e:
            print(f"  ❌ ERROR registering {user.username} (ID: {user.id}): {e}")
    
    print("\n" + "="*80)
    print("SUMMARY:")
    print(f"  Total active users: {len(active_users)}")
    print(f"  Newly registered: {registered_count}")
    print(f"  Already registered: {skipped_count}")
    print("="*80)
    
    if registered_count > 0:
        print("\n✅ Migration completed successfully!")
    else:
        print("\n⚠️  No new registrations needed")
    
except Exception as e:
    print(f"\n❌ Migration error: {e}")
    import traceback
    traceback.print_exc()
    db.rollback()
finally:
    db.close()
