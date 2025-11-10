"""Seed script to populate honor ranks.

Run with: python backend/scripts/seed_honor_ranks.py
"""
from backend.database.connection import SessionLocal
from backend.database.models.honor_rank import HonorRank


def seed_honor_ranks():
    db = SessionLocal()
    ranks = [
        {"name": "Silver", "commission_required": 1000, "reward_description": "Reward $97 worth of products", "reward_value_usd": 97},
        {"name": "Gold", "commission_required": 3700, "reward_description": "Reward $277 worth of products", "reward_value_usd": 277},
        {"name": "Platinum", "commission_required": 5700, "reward_description": "Gift for $1000 USD", "reward_value_usd": 1000},
        {"name": "Rubí", "commission_required": 9700, "reward_description": "Domestic Trip x3", "reward_value_usd": None},
        {"name": "Esmeralda", "commission_required": 19700, "reward_description": "Cruise x4", "reward_value_usd": None},
        {"name": "Diamond", "commission_required": 37700, "reward_description": "International Cruise x5 + Pool 7%", "reward_value_usd": None},
        {"name": "Blue Diamond", "commission_required": 77700, "reward_description": "Luxury trip x5 + Pool 7%", "reward_value_usd": None},
    ]

    inserted = 0
    for r in ranks:
        if not db.query(HonorRank).filter(HonorRank.name == r["name"]).first():
            db.add(HonorRank(**r))
            db.commit()
            inserted += 1

    db.close()
    print(f"Seeding completed. Inserted: {inserted} honor ranks.")


if __name__ == "__main__":
    seed_honor_ranks()
