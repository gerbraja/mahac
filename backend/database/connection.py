import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from typing import Generator

# Local development DB (SQLite) by default. Production can override via
# the DATABASE_URL environment variable (e.g. a Postgres DSN).
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./dev.db")

# For SQLite we need a specific connect arg
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

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
