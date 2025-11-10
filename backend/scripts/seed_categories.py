"""Seed categories from YAML into the database.

This script reads `backend/data/categories/categories_template.yml` and inserts
Category and Subcategory rows when they don't already exist.

It expects the project's DB layer to expose `SessionLocal`, `engine` and `Base`
from `backend.database.connection`. If those names are not present, the script
prints instructions instead of trying to run.
"""
import os
import sys
import yaml

HERE = os.path.dirname(__file__)
ROOT = os.path.abspath(os.path.join(HERE, ".."))
DATA_FILE = os.path.join(ROOT, "data", "categories", "categories_template.yml")

try:
    from backend.database.connection import SessionLocal, engine, Base
    from backend.database.models.category import Category, Subcategory
except Exception as e:
    print("Could not import DB session/engine from backend.database.connection:", e)
    print("Ensure your `backend/database/connection.py` exposes SessionLocal, engine and Base.")
    sys.exit(1)


def load_yaml(path):
    with open(path, "r", encoding="utf-8") as f:
        return yaml.safe_load(f)


def seed():
    data = load_yaml(DATA_FILE)
    if not data or "categories" not in data:
        print(f"No categories found in {DATA_FILE}")
        return

    Session = SessionLocal
    db = Session()

    # create tables if needed
    try:
        Base.metadata.create_all(bind=engine)
    except Exception:
        pass

    inserted = 0
    for item in data["categories"]:
        code = item.get("code")
        name = item.get("name")
        desc = item.get("description")
        subs = item.get("subcategories") or []

        if not code or not name:
            print("Skipping entry without code or name:", item)
            continue

        existing = db.query(Category).filter((Category.code == code) | (Category.name == name)).first()
        if existing:
            print(f"Category exists, skipping: {name} ({code})")
            continue

        cat = Category(code=code, name=name, description=desc)
        db.add(cat)
        db.commit()
        db.refresh(cat)

        for s in subs:
            if isinstance(s, dict):
                sname = s.get("name")
            else:
                sname = str(s)
            if sname:
                sub = Subcategory(name=sname, category_id=cat.id)
                db.add(sub)
        db.commit()
        inserted += 1
        print(f"Inserted category: {name} ({code})")

    db.close()
    print(f"Seeding completed. Inserted: {inserted} categories.")


if __name__ == "__main__":
    seed()
