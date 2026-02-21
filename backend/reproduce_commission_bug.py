from backend.database.connection import SessionLocal, engine, Base
from backend.database.models.user import User
from backend.database.models.binary_global import BinaryGlobalMember
from backend.database.models.binary import BinaryCommission
from backend.mlm.services.binary_service import register_in_binary_global, activate_binary_global
from datetime import datetime

# Setup DB
Base.metadata.drop_all(bind=engine)
Base.metadata.create_all(bind=engine)
db = SessionLocal()

def create_user(email, name):
    u = User(email=email, username=name, name=name, password="pw", available_balance=0.0, total_earnings=0.0)
    db.add(u)
    db.commit()
    db.refresh(u)
    return u

print("=== STARTING REPRODUCTION SCRIPT ===")

# 1. Create Root (Sponsor)
root = create_user("root@test.com", "Sembradores") # Use strict name from user report
print(f"Created Root: {root.username} ({root.id})")
m_root = register_in_binary_global(db, root.id)
activate_binary_global(db, root.id)
print(f"Root Activated in Binary Global: Pos {m_root.global_position}")

# 2. Fill levels to reach Level 3 (where payment starts)
# Structure:
# Root (L0)
#   L1: A, B
#   L2: C, D, E, F
#   L3: G... (Pays Root $0.50)

# Create 2 users for Level 1
u_l1_a = create_user("l1a@test.com", "L1_A")
m_l1_a = register_in_binary_global(db, u_l1_a.id) # Pre-reg
activate_binary_global(db, u_l1_a.id) # Activate
print(f"L1_A Activated")

u_l1_b = create_user("l1b@test.com", "L1_B")
m_l1_b = register_in_binary_global(db, u_l1_b.id)
activate_binary_global(db, u_l1_b.id)
print(f"L1_B Activated")

# Create 4 users for Level 2
for i in range(4):
    u = create_user(f"l2_{i}@test.com", f"L2_{i}")
    register_in_binary_global(db, u.id)
    activate_binary_global(db, u.id)
    print(f"L2_{i} Activated")

print("\n--- Current Commissions for Root (Should be 0 as L1, L2 don't pay) ---")
comms = db.query(BinaryCommission).filter(BinaryCommission.user_id == root.id).all()
print(f"Commissions: {len(comms)}")

# 3. Create User at Level 3 (Should Trigger Payment)
print("\n--- Adding L3 User (Should Trigger Payment) ---")
u_l3 = create_user("l3_new@test.com", "NewUser_L3")
register_in_binary_global(db, u_l3.id)
activate_binary_global(db, u_l3.id)
print(f"NewUser_L3 Activated")

# 4. Check Commissions
print("\n--- Verifying Commissions ---")
comms = db.query(BinaryCommission).filter(BinaryCommission.user_id == root.id).all()
has_commission = False
for c in comms:
    print(f"Commission: Level {c.level}, Amount ${c.commission_amount}, Type {c.type}")
    if c.level == 3 and c.commission_amount == 0.50:
        has_commission = True

if has_commission:
    print("\nSUCCESS: Commission Generated!")
else:
    print("\nFAILURE: Commission NOT Generated!")

# 5. Check 'Pending' state (Inactive Upline)
print("\n--- Testing Inactive Upline Case ---")
# Create another L3 user, but make sure their parent/upline is INACTIVE?
# No, `process_arrival_bonuses` checks ALL uplines.
# Let's assume Root becomes Inactive clearly.
m_root.is_active = False
db.commit()
print("Root set to Inactive.")

u_l3_2 = create_user("l3_2@test.com", "NewUser_L3_2")
register_in_binary_global(db, u_l3_2.id)
activate_binary_global(db, u_l3_2.id)
print("NewUser_L3_2 Activated")

comms_after = db.query(BinaryCommission).filter(BinaryCommission.user_id == root.id).count()
print(f"Commissions after 2nd join (Should still be {len(comms)} as Root is inactive): {comms_after}")

if comms_after == len(comms):
    print("CONFIRMED: Inactive users do NOT receive commissions.")
else:
    print("UNEXPECTED: Inactive user received commission!")
