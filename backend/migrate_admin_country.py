import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

# Build DATABASE_URL from Cloud SQL environment variables
db_user = os.getenv("DB_USER")
db_pass = os.getenv("DB_PASS")
db_name = os.getenv("DB_NAME")
cloud_sql_connection_name = os.getenv("CLOUD_SQL_CONNECTION_NAME")

if all([db_user, db_pass, db_name, cloud_sql_connection_name]):
    print("Configuring for Cloud SQL (Postgres)...")
    from urllib.parse import quote_plus
    encoded_pass = quote_plus(db_pass)
    DATABASE_URL = f"postgresql+psycopg2://{db_user}:{encoded_pass}@/{db_name}?host=/cloudsql/{cloud_sql_connection_name}"
else:
    print("Configuring for Local DB (SQLite)...")
    DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./dev.db")

engine = create_engine(DATABASE_URL)

with engine.begin() as conn:
    if "postgresql" in DATABASE_URL:
        print("Running Postgres migration...")
        conn.execute(text("ALTER TABLE users ALTER COLUMN admin_country TYPE TEXT;"))
    else:
        print("SQLite backend detected. No column alteration needed for TEXT vs VARCHAR.")
        
print("Migration completed successfully!")
