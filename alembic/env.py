from __future__ import with_statement
import os
import sys
from logging.config import fileConfig

from sqlalchemy import engine_from_config, pool
from alembic import context

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Interpret the config file for Python logging.
fileConfig(config.config_file_name)

# Prefer DATABASE_URL from env, otherwise fall back to a config value
DATABASE_URL = os.getenv('DATABASE_URL') or config.get_main_option('sqlalchemy.url')
if DATABASE_URL:
    config.set_main_option('sqlalchemy.url', DATABASE_URL)

# Import the project's MetaData (target_metadata) for 'autogenerate'.
# Try multiple likely import locations to be robust in this workspace.
target_metadata = None
try:
    # Preferred: backend.database.connection exports Base
    from backend.database.connection import Base
    target_metadata = Base.metadata
except Exception:
    try:
        # Fallback to backend.main which may import Base
        from backend.main import Base as MainBase
        target_metadata = MainBase.metadata
    except Exception:
        # Final fallback: attempt to import models package and reflect at runtime
        try:
            # some projects expose Base at backend.database.__init__
            from backend.database import Base as DBBase
            target_metadata = DBBase.metadata
        except Exception:
            target_metadata = None


def run_migrations_offline():
    url = config.get_main_option("sqlalchemy.url")
    context.configure(url=url, target_metadata=target_metadata, literal_binds=True)

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online():
    connectable = engine_from_config(
        config.get_section(config.config_ini_section),
        prefix='sqlalchemy.',
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
