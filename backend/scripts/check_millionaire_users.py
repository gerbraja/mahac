import sys
import os
from sqlalchemy import create_engine, text

os.environ['DATABASE_URL'] = 'postgresql://tei_admin:TEI2026Master!@35.198.54.12:5432/teidb'

engine = create_engine(os.environ['DATABASE_URL'])
with engine.connect() as conn:
    print("--- USERS (34, 40) ---")
    users = conn.execute(text("SELECT id, name, referred_by_id FROM users WHERE id IN (34, 40)")).fetchall()
    for u in users:
        print(f"ID: {u.id} | Name: {u.name} | Referrer ID: {u.referred_by_id}")
        
    print("\n--- MILLIONAIRE MEMBERS ---")
    mems = conn.execute(text("SELECT id, user_id, upline_id, position FROM binary_millionaire_members WHERE user_id IN (34, 40)")).fetchall()
    for m in mems:
        print(f"Node ID: {m.id} | User ID: {m.user_id} | Upline ID: {m.upline_id} | Pos: {m.position}")
        
    print("\n--- SPONSOR's MILLIONAIRE NODE ---")
    if users:
        sponsor_id = users[0].referred_by_id
        if sponsor_id:
            s_node = conn.execute(text(f"SELECT id, position FROM binary_millionaire_members WHERE user_id = {sponsor_id}")).fetchone()
            if s_node:
                print(f"Sponsor {sponsor_id} Node ID: {s_node.id}")
                children = conn.execute(text(f"SELECT id, user_id, position FROM binary_millionaire_members WHERE upline_id = {s_node.id}")).fetchall()
                print("Children of Sponsor Node:")
                for c in children:
                    print(f"  - Node {c.id} | User {c.user_id} | Pos {c.position}")
