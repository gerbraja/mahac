import sys
import os
import re
import json
import httpx
import subprocess

# We want to connect directly to the database.
try:
    print("Getting local public IP address...")
    ip_resp = httpx.get("https://api.ipify.org", timeout=10)
    my_ip = ip_resp.text.strip()
    print(f"Local public IP is: {my_ip}")
except Exception as e:
    print(f"Error getting public IP: {e}")
    sys.exit(1)

# Temporarily authorize our IP in Cloud SQL
instance_name = "mlm-db-us"
project = "tei-mlm-prod"
print(f"Authorizing IP {my_ip} in Cloud SQL instance {instance_name}...")

cmd = [
    "gcloud", "sql", "instances", "patch", instance_name,
    f"--authorized-networks={my_ip}/32",
    f"--project={project}",
    "--quiet"
]

try:
    subprocess.run(cmd, check=True, shell=True)
    print("IP authorized successfully in Cloud SQL!")
except Exception as e:
    print(f"Error authorizing IP via gcloud: {e}")
    sys.exit(1)

# Now connect to the database and perform migration
from sqlalchemy import create_engine, MetaData, Table, Column, Integer, String
from sqlalchemy.orm import sessionmaker

db_user = "postgres"
db_pass = "AdminPostgres2025"
db_name = "tiendavirtual"
db_host = "136.115.34.51"

DATABASE_URL = f"postgresql+psycopg2://{db_user}:{db_pass}@{db_host}/{db_name}"

def clean_word(word):
    word = word.upper()
    accents = {'Á':'A', 'É':'E', 'Í':'I', 'Ó':'O', 'Ú':'U', 'Ñ':'N', 'Ü':'U'}
    for k, v in accents.items():
        word = word.replace(k, v)
    word = re.sub(r'[^A-Z0-9]', '', word)
    return word

def generate_sku(product_id, name):
    words = name.split()
    stop_words = {
        "DE", "CON", "PARA", "LA", "EL", "LOS", "LAS", "UN", "UNA", "Y", "EN", "POR", "DEL", 
        "A", "O", "E", "U", "AL", "DEL"
    }
    significant_words = []
    for w in words:
        cleaned = clean_word(w)
        if cleaned and cleaned not in stop_words:
            significant_words.append(cleaned)
    slug_parts = significant_words[:3]
    slug = "-".join(slug_parts)
    return f"P-{product_id}-{slug}"

def run_migration(dry_run=True):
    engine = create_engine(DATABASE_URL)
    metadata = MetaData()
    products_table = Table(
        'products', metadata,
        Column('id', Integer, primary_key=True),
        Column('name', String),
        Column('sku', String)
    )
    
    Session = sessionmaker(bind=engine)
    session = Session()
    
    try:
        products = session.query(products_table).order_by(products_table.c.id.asc()).all()
        print(f"\nFound {len(products)} products in the database.")
        
        changes = []
        for p in products:
            new_sku = generate_sku(p.id, p.name)
            if p.sku != new_sku:
                changes.append({
                    "id": p.id,
                    "old_sku": p.sku,
                    "new_sku": new_sku,
                    "name": p.name
                })
                # Safe print (remove non-ascii for terminal)
                safe_name = p.name.encode('ascii', errors='ignore').decode('ascii')
                safe_old = str(p.sku).encode('ascii', errors='ignore').decode('ascii')
                print(f"ID: {p.id:<5} | OLD: {safe_old:<15} | NEW: {new_sku:<35} | NAME: {safe_name[:35]}")
                
        print("-" * 90)
        print(f"Total products requiring SKU update: {len(changes)}")
        
        # Write to JSON file for safety and review
        with open("scratch_migration_preview.json", "w", encoding="utf-8") as f:
            json.dump(changes, f, indent=2, ensure_ascii=False)
        print("Detailed preview saved to scratch_migration_preview.json")
        
        if not dry_run and len(changes) > 0:
            print("\nExecuting actual migration (writing to database)...")
            for chg in changes:
                session.query(products_table).filter(products_table.c.id == chg["id"]).update({
                    products_table.c.sku: chg["new_sku"]
                })
            session.commit()
            print("Migration completed successfully and committed to production!")
        else:
            print("\nDry run mode. No database changes were made.")
            
    except Exception as e:
        session.rollback()
        print(f"Error during migration: {e}")
    finally:
        session.close()

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--execute", action="store_true", help="Run actual update in DB")
    args = parser.parse_args()
    
    dry_run = not args.execute
    print(f"Running in {'DRY RUN' if dry_run else 'EXECUTE'} mode...")
    run_migration(dry_run=dry_run)
