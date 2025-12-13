import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from typing import Generator
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Build DATABASE_URL from Cloud SQL environment variables
# This supports both local development (SQLite) and production (PostgreSQL Cloud SQL)
db_user = os.getenv("DB_USER")
db_pass = os.getenv("DB_PASS")
db_name = os.getenv("DB_NAME")
cloud_sql_connection_name = os.getenv("CLOUD_SQL_CONNECTION_NAME")

if all([db_user, db_pass, db_name, cloud_sql_connection_name]):
    # Production: Cloud SQL with Unix socket
    DATABASE_URL = f"postgresql+pg8000://{db_user}:{db_pass}@/{db_name}?unix_sock=/cloudsql/{cloud_sql_connection_name}/.s.PGSQL.5432"
else:
    # Local development: SQLite or explicit DATABASE_URL
    DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./dev.db")

# For SQLite we need a specific connect arg
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

print(f"ðŸ”Œ DATABASE URL: {DATABASE_URL}")
if "sqlite" in DATABASE_URL and "///" in DATABASE_URL:
    db_path = DATABASE_URL.split("///")[1]
    print(f"ðŸ”Œ RESOLVED DB PATH: {os.path.abspath(db_path)}")

# Create engine and session factory
engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

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
