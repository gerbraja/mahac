from backend.database.connection import SessionLocal, engine, Base
from backend.database.models.user import User
from backend.database.models.binary_millionaire import BinaryMillionaireMember
from backend.database.models.binary import BinaryCommission
from backend.mlm.services.binary_millionaire_service import register_in_millionaire, distribute_millionaire_commissions

# Re-create tables to start fresh for test
Base.metadata.drop_all(bind=engine)
Base.metadata.create_all(bind=engine)

db = SessionLocal()

def create_user(email, name):
    u = User(email=email, username=name, name=name, password="pw", available_balance=0.0)
    db.add(u)
    db.commit()
    db.refresh(u)
    return u

print("--- 1. Creating Users ---")
# We need depth to test levels 1, 3, 5...
# Root -> L1 -> L2 -> L3
root = create_user("root@test.com", "Root")
users = []
for i in range(1, 10):
    users.append(create_user(f"u{i}@test.com", f"User{i}"))

print("\n--- 2. Registering Root ---")
m_root = register_in_millionaire(db, root.id)
print(f"Root placed: GlobalPos={m_root.global_position}")

print("\n--- 3. Building Chain (Linear for simplicity to test depth) ---")
# To test Level 3 commission for Root, we need a user at Depth 3.
# Root (L0) -> U1 (L1) -> U2 (L2) -> U3 (L3)
# Note: Our Global Placement fills 2x2.
# L0: Root (1 node)
# L1: U1, U2 (2 nodes)
# L2: U3, U4, U5, U6 (4 nodes)
# L3: U7... (8 nodes)

# Let's register 10 users. They will fill levels 1, 2, and start 3.
members = []
for u in users:
    m = register_in_millionaire(db, u.id)
    members.append(m)
    print(f"User {u.username} placed at GlobalPos {m.global_position}")

# U1, U2 are Level 1 relative to Root.
# U3, U4, U5, U6 are Level 2 relative to Root.
# U7, U8, U9 are Level 3 relative to Root.

print("\n--- 4. Distributing Commissions ---")
# Simulate a sale by User U7 (Level 3 relative to Root)
# Root should get 3% (Level 3 rule).
# Upline of U7:
# - Parent (Level 1 up): U3 (Level 2 relative to Root). Rule for L1? 3%. U3 gets 3%.
# - Grandparent (Level 2 up): U1 (Level 1 relative to Root). Rule for L2? No (Even).
# - Great-Grandparent (Level 3 up): Root. Rule for L3? 3%. Root gets 3%.

sale_amount = 100.0
u7_member = members[6] # User7 (Index 6)
print(f"Processing Sale of ${sale_amount} by User7 (GlobalPos {u7_member.global_position})...")

distribute_millionaire_commissions(db, u7_member, sale_amount)

print("\n--- 5. Verifying Commissions ---")
# Check Root
commissions = db.query(BinaryCommission).filter(BinaryCommission.user_id == root.id).all()
print(f"Root Commissions: {len(commissions)}")
for c in commissions:
    print(f" - Amount: ${c.commission_amount} (Level {c.level})")
    # Expected: $3.00 (3% of 100) from Level 3.

# Check U3 (Direct Sponsor of U7 in this fill order? Let's verify U7 upline)
u7_upline = db.query(BinaryMillionaireMember).filter(BinaryMillionaireMember.id == u7_member.upline_id).first()
print(f"User7 Upline is ID {u7_upline.user_id} (GlobalPos {u7_upline.global_position})")
# U7 is 7th user. Root=1. U1=2, U2=3. U3=4, U4=5, U5=6, U6=7.
# Wait, GlobalPos: Root=1.
# L1: U1(2), U2(3).
# L2: U3(4), U4(5), U5(6), U6(7).
# L3: U7(8).
# U7(8) is child of U3(4).
# So U3 is Level 1 upline. Should get 3%.
# U3's upline is U1(2). Level 2 upline. Should get 0%.
# U1's upline is Root(1). Level 3 upline. Should get 3%.

u3_commissions = db.query(BinaryCommission).filter(BinaryCommission.user_id == users[2].id).all() # U3 is index 2
print(f"User3 Commissions: {len(u3_commissions)}")
for c in u3_commissions:
    print(f" - Amount: ${c.commission_amount} (Level {c.level})")

db.close()
