from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Database connection
DATABASE_URL = "postgresql://postgres:AdminPostgres2025@34.151.240.244/tiendavirtual"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)
db = SessionLocal()

try:
    # 1. Inspect Product "LIMPIAP"
    print("\n--- Inspecting Product 'LIMPIAP' ---")
    # Using vague search in case name is longer
    products = db.execute(text("SELECT id, name, price_usd, pv, direct_bonus_pv, cost_price FROM products WHERE name LIKE '%LIMPIAP%'")).fetchall()
    for p in products:
        print(f"ID: {p.id} | Name: {p.name} | Price: {p.price_usd} | PV: {p.pv} | Direct Bonus PV: {p.direct_bonus_pv}")

    # 2. Inspect Commissions for Users
    print("\n--- Inspecting Recent Commissions ---")
    users = ['Dianismarcas', 'Gerbraja1', 'Sembradores']
    for username in users:
        print(f"\nUser: {username}")
        user_row = db.execute(text("SELECT id FROM users WHERE username = :u"), {"u": username}).fetchone()
        if user_row:
            uid = user_row.id
            comms = db.execute(text(
                "SELECT id, amount, description, created_at FROM wallet_transactions "
                "WHERE user_id = :uid ORDER BY created_at DESC LIMIT 5"
            ), {"uid": uid}).fetchall()
            for c in comms:
                print(f"  Tx: {c.id} | Amount: {c.amount} | Desc: {c.description} | Date: {c.created_at}")
        else:
            print("  User not found")

except Exception as e:
    print(f"Error: {e}")
finally:
    db.close()
