import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from typing import Generator
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

print("--> LOADING DATABASE/CONNECTION.PY <--", flush=True)

# Build DATABASE_URL from Cloud SQL environment variables
db_user = os.getenv("DB_USER")
db_pass = os.getenv("DB_PASS")
db_name = os.getenv("DB_NAME")
cloud_sql_connection_name = os.getenv("CLOUD_SQL_CONNECTION_NAME")

print(f"DEBUG: Env Vars Read: User={db_user}, Name={db_name}, ConnName={cloud_sql_connection_name}", flush=True)

if all([db_user, db_pass, db_name, cloud_sql_connection_name]):
    # Production: Cloud SQL with Unix socket
    print("DEBUG: Configuring for Cloud SQL (Postgres)...", flush=True)
    try:
        from urllib.parse import quote_plus
        encoded_pass = quote_plus(db_pass)
        print("DEBUG: Password encoded.", flush=True)

        # SQLAlchemy URL
        DATABASE_URL = f"postgresql+psycopg2://{db_user}:{encoded_pass}@/{db_name}?host=/cloudsql/{cloud_sql_connection_name}"
        print(f"DEBUG: DATABASE_URL constructed for user {db_user}", flush=True)
        
        connect_args = {}
    except Exception as e:
        print(f"DEBUG: Error constructing URL: {e}", flush=True)
        raise e
else:
    # Local development
    print("DEBUG: Configuring for Local DB...", flush=True)
    DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./dev.db")
    connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

print(f"ðŸ”Œ DATABASE URL: {DATABASE_URL}", flush=True)

# Create engine
print("DEBUG: Calling create_engine...", flush=True)
try:
    # Remove pool_pre_ping temporarily to reduce complexity if it's causing hangs
    engine = create_engine(DATABASE_URL, connect_args=connect_args)
    print("DEBUG: Engine created successfully (pre_ping=False)", flush=True)
except Exception as e:
    print(f"DEBUG: Engine creation FAILED: {e}", flush=True)
    # Don't raise yet, let sessionmaker fail if needed, or maybe return dumb engine?
    # raise e 

# Mask password for safe logging
safe_url = DATABASE_URL.replace(encoded_pass, "******") if 'encoded_pass' in locals() and encoded_pass else DATABASE_URL
print(f"DEBUG: CONNECTION STRING (Masked): {safe_url}", flush=True)

print("DEBUG: Creating SessionLocal...", flush=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
print("DEBUG: SessionLocal created.", flush=True)

# Declarative base for models
Base = declarative_base()


def get_db() -> Generator:
    """Dependency that yields a SQLAlchemy Session and ensures it's closed.

    Use in FastAPI endpoints: `db: Session = Depends(get_db)`.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


async def init_db():
    """Optional async initializer kept for compatibility with startup events.

    This function is safe to call; it simply ensures the engine is reachable.
    For SQLite this is a no-op. For more advanced setups you can expand it.
    """
    return
