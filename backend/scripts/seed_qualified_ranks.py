from backend.database.connection import SessionLocal
from backend.database.models.qualified_rank import QualifiedRank

def seed_qualified_ranks():
    db = SessionLocal()
    print("Iniciando seed seguro de qualified_ranks...")

    ranks = [
        {"name": "Distribuidor", "matrix_id_required": 27, "reward_amount": 0, "monthly_limit": 7, "semester_limit": None, "yearly_limit": None},
        {"name": "Distribuidor Bronce", "matrix_id_required": 77, "reward_amount": 0, "monthly_limit": 6, "semester_limit": None, "yearly_limit": None},
        {"name": "Distribuidor Plata", "matrix_id_required": 277, "reward_amount": 147, "monthly_limit": 5, "semester_limit": None, "yearly_limit": None},
        {"name": "Distribuidor Oro", "matrix_id_required": 877, "reward_amount": 500, "monthly_limit": 4, "semester_limit": None, "yearly_limit": None},
        {"name": "Empresario Platino", "matrix_id_required": 3000, "reward_amount": 1700, "monthly_limit": 3, "semester_limit": None, "yearly_limit": None},
        {"name": "Empresario Rubí", "matrix_id_required": 9700, "reward_amount": 30000, "monthly_limit": 2, "semester_limit": None, "yearly_limit": None},
        {"name": "Empresario Esmeralda", "matrix_id_required": 30000, "reward_amount": 100000, "monthly_limit": 1, "semester_limit": None, "yearly_limit": None},
        {"name": "Diamante", "matrix_id_required": 100000, "reward_amount": 300000, "monthly_limit": None, "semester_limit": 1, "yearly_limit": None},
        {"name": "Diamante Azul", "matrix_id_required": 300000, "reward_amount": 1000000, "monthly_limit": None, "semester_limit": None, "yearly_limit": 1},
        {"name": "Diamante Rojo", "matrix_id_required": 1000000, "reward_amount": 3000000, "monthly_limit": None, "semester_limit": None, "yearly_limit": 1},
        {"name": "Diamante Negro", "matrix_id_required": 3000000, "reward_amount": 7000000, "monthly_limit": None, "semester_limit": None, "yearly_limit": 1},
        {"name": "Diamante Corona", "matrix_id_required": 7000000, "reward_amount": 20000000, "monthly_limit": None, "semester_limit": None, "yearly_limit": 1},
        {"name": "Corona Azul", "matrix_id_required": 20000000, "reward_amount": 70000000, "monthly_limit": None, "semester_limit": None, "yearly_limit": 1},
        {"name": "Corona Roja", "matrix_id_required": 70000000, "reward_amount": 210000000, "monthly_limit": None, "semester_limit": None, "yearly_limit": 1},
        {"name": "Corona Negra", "matrix_id_required": 210000000, "reward_amount": 0, "monthly_limit": None, "semester_limit": None, "yearly_limit": 1},
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
            existing.semester_limit = r["semester_limit"]
            existing.yearly_limit = r["yearly_limit"]
            updated += 1
        else:
            db.add(QualifiedRank(
                name=r["name"],
                matrix_id_required=r["matrix_id_required"],
                reward_amount=r["reward_amount"],
                monthly_limit=r["monthly_limit"],
                semester_limit=r["semester_limit"],
                yearly_limit=r["yearly_limit"]
            ))
            inserted += 1
    
    db.commit()
    db.close()
    print(f"Seeding completado con éxito. Insertados: {inserted}, Actualizados: {updated} rangos calificados.")

if __name__ == "__main__":
    seed_qualified_ranks()
