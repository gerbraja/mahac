from backend.database.connection import engine
from backend.database.models.user import User
from backend.database.models.binary_millionaire import BinaryMillionaireMember
from sqlalchemy.orm import Session

db = Session(engine)

users = db.query(User).all()
print(f"Total users: {len(users)}")

active = [u for u in users if u.status == 'active']
print(f"Active users: {len(active)}")
for u in active:
    print(f"  {u.id:3d}. {u.username:20s} {u.name:30s}")

mill = db.query(BinaryMillionaireMember).all()
print(f"\nIn Binary Millionaire: {len(mill)}")
for m in mill:
    u = db.query(User).filter(User.id == m.user_id).first()
    print(f"  Pos #{m.global_position}: {u.username if u else 'unknown'}")

db.close()
