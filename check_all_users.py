from backend.database.connection import engine
from backend.database.models.user import User
from backend.database.models.binary_millionaire import BinaryMillionaireMember
from sqlalchemy.orm import Session

db = Session(engine)

# Get ALL users
all_users = db.query(User).order_by(User.id).all()
print(f"=== ALL USERS ({len(all_users)}) ===")
for u in all_users:
    in_mill = db.query(BinaryMillionaireMember).filter(BinaryMillionaireMember.user_id == u.id).first()
    status_mark = "✓" if in_mill else "✗"
    print(f"{status_mark} {u.id:3d}. {u.username:25s} {u.status:15s} {u.name}")

# Show who's in millionaire
mill_members = db.query(BinaryMillionaireMember).order_by(BinaryMillionaireMember.global_position).all()
print(f"\n=== IN BINARY MILLIONAIRE ({len(mill_members)}) ===")
for m in mill_members:
    u = db.query(User).filter(User.id == m.user_id).first()
    print(f"Position #{m.global_position}: {u.username if u else 'UNKNOWN'} (ID:{m.user_id})")

db.close()
