from backend.database.connection import SessionLocal
from backend.database.models.qualified_rank import QualifiedRank

def seed_qualified_ranks():
    db = SessionLocal()
    # DROP TABLE to ensure schema update (Dev only)
    # This is a quick fix since we don't have migrations set up for this session.
    from sqlalchemy import text
    try:
        # Check if column exists, if not drop table
        # Or just blindly drop it since it's a seed script for dev
        db.execute(text("DROP TABLE IF EXISTS qualified_ranks"))
        db.commit()
        print("Dropped qualified_ranks table to apply schema changes.")
        
        # Re-create table
        from backend.database.connection import engine, Base
        Base.metadata.create_all(bind=engine)
        print("Re-created qualified_ranks table.")
    except Exception as e:
        print(f"Error resetting table: {e}")

    ranks = [
        {"name": "Distribuidor", "matrix_id_required": 27, "reward_amount": 0, "monthly_limit": 14, "yearly_limit": None},
        {"name": "Distribuidor Bronce", "matrix_id_required": 77, "reward_amount": 0, "monthly_limit": 10, "yearly_limit": None},
        {"name": "Distribuidor Plata", "matrix_id_required": 277, "reward_amount": 147, "monthly_limit": 8, "yearly_limit": None},
        {"name": "Distribuidor Oro", "matrix_id_required": 877, "reward_amount": 500, "monthly_limit": 7, "yearly_limit": None},
        {"name": "Empresario Platino", "matrix_id_required": 3000, "reward_amount": 1700, "monthly_limit": 6, "yearly_limit": None},
        {"name": "Empresario Rubí", "matrix_id_required": 9700, "reward_amount": 30000, "monthly_limit": 5, "yearly_limit": None},
        {"name": "Empresario Esmeralda", "matrix_id_required": 30000, "reward_amount": 100000, "monthly_limit": 4, "yearly_limit": None},
        {"name": "Diamante", "matrix_id_required": 100000, "reward_amount": 300000, "monthly_limit": 3, "yearly_limit": None},
        {"name": "Diamante Azul", "matrix_id_required": 300000, "reward_amount": 1000000, "monthly_limit": 2, "yearly_limit": None},
        {"name": "Diamante Rojo", "matrix_id_required": 1000000, "reward_amount": 3000000, "monthly_limit": None, "yearly_limit": 7},
        {"name": "Diamante Negro", "matrix_id_required": 3000000, "reward_amount": 7000000, "monthly_limit": None, "yearly_limit": 5},
        {"name": "Diamante Corona", "matrix_id_required": 7000000, "reward_amount": 20000000, "monthly_limit": None, "yearly_limit": 4},
        {"name": "Corona Azul", "matrix_id_required": 20000000, "reward_amount": 70000000, "monthly_limit": None, "yearly_limit": 3},
        {"name": "Corona Roja", "matrix_id_required": 70000000, "reward_amount": 210000000, "monthly_limit": None, "yearly_limit": 1},
        {"name": "Corona Negra", "matrix_id_required": 210000000, "reward_amount": 0, "monthly_limit": None, "yearly_limit": 1}, # Final matrix?
    ]

    inserted = 0
    updated = 0
    for r in ranks:
        # Lookup by Matrix ID to allow renaming
        existing = db.query(QualifiedRank).filter(QualifiedRank.matrix_id_required == r["matrix_id_required"]).first()
        if existing:
            existing.name = r["name"]
            existing.reward_amount = r["reward_amount"]
            existing.monthly_limit = r["monthly_limit"]
            existing.yearly_limit = r["yearly_limit"]
            updated += 1
        else:
            db.add(QualifiedRank(**r))
            inserted += 1
    
    db.commit()
    db.close()
    print(f"Seeding completed. Inserted: {inserted}, Updated: {updated} qualified ranks.")

if __name__ == "__main__":
    seed_qualified_ranks()
