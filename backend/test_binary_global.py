from backend.database.connection import SessionLocal, engine, Base
from backend.database.models.user import User
from backend.database.models.binary_global import BinaryGlobalMember
from backend.database.models.binary import BinaryCommission
from backend.mlm.services.binary_service import register_in_binary_global, activate_binary_global, check_expirations
from datetime import datetime, timedelta

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
root = create_user("root@test.com", "Root")
u1 = create_user("u1@test.com", "User1")
u2 = create_user("u2@test.com", "User2")
u3 = create_user("u3@test.com", "User3")
u4 = create_user("u4@test.com", "User4")
u5 = create_user("u5@test.com", "User5")

print("\n--- 2. Registering Root in Binary Global ---")
# Root needs to be active to receive bonuses from downline
m_root = register_in_binary_global(db, root.id)
activate_binary_global(db, root.id)
print(f"Root placed: ID={m_root.id}, Pos={m_root.position}, GlobalPos={m_root.global_position}")

print("\n--- 3. Filling Level 1 (2 users) ---")
# Should go Left then Right of Root
m1 = register_in_binary_global(db, u1.id)
print(f"User1 placed: Upline={m1.upline_id}, Pos={m1.position} (Expected: Left of Root)")

m2 = register_in_binary_global(db, u2.id)
print(f"User2 placed: Upline={m2.upline_id}, Pos={m2.position} (Expected: Right of Root)")

print("\n--- 4. Filling Level 2 (Spillover) ---")
# Should go Left of User1, then Right of User1, etc.
m3 = register_in_binary_global(db, u3.id)
print(f"User3 placed: Upline={m3.upline_id}, Pos={m3.position} (Expected: Left of User1)")

m4 = register_in_binary_global(db, u4.id)
print(f"User4 placed: Upline={m4.upline_id}, Pos={m4.position} (Expected: Right of User1)")

print("\n--- 5. Checking Arrival Bonuses ---")
# User3 is at Level 3 relative to Root?
# Root (Lvl 0) -> User1 (Lvl 1) -> User3 (Lvl 2) ... wait, levels are usually 1-based in bonus rules.
# If Root is L1, U1 is L2, U3 is L3.
# Our logic: `level_up` starts at 1 (immediate upline).
# For User3:
# - Upline 1: User1 (Level 1 relative to U3). Rule for L1? No.
# - Upline 2: Root (Level 2 relative to U3). Rule for L2? No.
# Wait, the rule says "Level 3 to 13". Is that depth of the tree or distance from user?
# Usually "Arrival Bonus" in global binary means "When someone falls in your Level X".
# My implementation `process_arrival_bonuses` iterates UP.
# So if I am Root, and User3 joins at my Level 2 (Depth 2), does that trigger?
# The code: `level_up` increments as we go up.
# When User3 joins:
# - Upline is User1. `level_up` = 1. Rule for 1? No.
# - Upline is Root. `level_up` = 2. Rule for 2? No.
# Let's add a User at Level 3 (Depth 3) to trigger Level 3 bonus for Root.

print("Adding User5 (Should be Left of User2)")
m5 = register_in_binary_global(db, u5.id)
# User5 -> User2 -> Root
# Upline 1: User2 (L1).
# Upline 2: Root (L2).
# Still no L3. We need more depth.

print("Adding more users to reach depth 3...")
# We need to fill:
# L0: Root (1)
# L1: U1, U2 (2)
# L2: U3, U4, U5, U6 (4)
# L3: U7... (8)
# When U7 joins, Root is 3 levels up.
users = []
for i in range(6, 15):
    u = create_user(f"u{i}@test.com", f"User{i}")
    m = register_in_binary_global(db, u.id)
    users.append(m)
    print(f"User{i} placed at GlobalPos {m.global_position}")

print("\n--- 6. Verifying Root Balance ---")
# Root should receive $0.50 for every user at their Level 3.
# Level 3 has capacity 8. We added enough users to start filling L3.
# Let's check commissions.
commissions = db.query(BinaryCommission).filter(BinaryCommission.user_id == root.id).all()
print(f"Root Commissions: {len(commissions)}")
for c in commissions:
    print(f" - Amount: ${c.commission_amount} (Level {c.level})")

db.refresh(root)
print(f"Root Available Balance: ${root.available_balance}")

print("\n--- 7. Testing Expiration ---")
# User1 is pre-registered (inactive). Let's expire them.
print(f"User1 Active? {m1.is_active}")
m1.activation_deadline = datetime.utcnow() - timedelta(days=1)
db.commit()

print("Running Expiration Check...")
check_expirations(db)

m1_check = db.query(BinaryGlobalMember).filter(BinaryGlobalMember.id == m1.id).first()
if not m1_check:
    print("User1 was removed (Success).")
else:
    print("User1 still exists (Failed).")

db.close()
