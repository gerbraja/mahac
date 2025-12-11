import sys
import os
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
sys.path.insert(0, os.path.dirname(parent_dir))

from backend.database.connection import SessionLocal
from backend.database.models.product import Product

db = SessionLocal()

# Get all products
all_products = db.query(Product).all()

print(f"Total products in database: {len(all_products)}\n")

# Delete products WITHOUT Imgur images
deleted_count = 0
for p in all_products:
    has_imgur = p.image_url and "imgur.com" in p.image_url.lower()
    
    if not has_imgur:
        print(f"🗑️  Deleting: ID={p.id} | {p.name}")
        db.delete(p)
        deleted_count += 1

if deleted_count > 0:
    try:
        db.commit()
        print(f"\n✅ Successfully deleted {deleted_count} sample products from database.")
    except Exception as e:
        db.rollback()
        print(f"\n❌ Error deleting products: {e}")
else:
    print("\n✅ No sample products found to delete.")

# Verify remaining products
remaining = db.query(Product).all()
print(f"\n📊 Remaining products: {len(remaining)}")
for p in remaining:
    print(f"   ✅ ID={p.id} | {p.name}")

db.close()
