from backend.database.connection import SessionLocal
from backend.database.models.user import User
from backend.database.models.matrix import MatrixMember
from backend.database.models.unilevel import UnilevelMember

db = SessionLocal()

# 1. Create Test User
user = db.query(User).filter(User.email == "test@example.com").first()
if not user:
    print("Creating test user...")
    user = User(
        email="test@example.com",
        username="testuser",
        name="Test User",
        password="hashed_password_placeholder",
        available_balance=1000.0
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    # Add to Unilevel
    unilevel = UnilevelMember(user_id=user.id, level=1)
    db.add(unilevel)
    db.commit()
else:
    print(f"User found: {user.id}")

# 2. Buy Matrix Position
matrix_id = 27
exists = db.query(MatrixMember).filter(MatrixMember.user_id == user.id, MatrixMember.matrix_id == matrix_id).first()
if not exists:
    print(f"Buying matrix {matrix_id} for user {user.id}...")
    # Manually adding for seed (skipping service logic for speed, just for viz)
    member = MatrixMember(
        user_id=user.id,
        matrix_id=matrix_id,
        position=1,
        level=0,
        upline_id=None # Root
    )
    db.add(member)
    db.commit()
    print("Matrix position purchased.")
else:
    print("Matrix position already exists.")

db.close()
