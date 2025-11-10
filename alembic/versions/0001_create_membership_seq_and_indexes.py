"""create membership sequence and necessary unique indexes

Revision ID: 0001_create_membership_seq_and_indexes
Revises: 
Create Date: 2025-10-27 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import text

# revision identifiers, used by Alembic.
revision = '0001_create_membership_seq_and_indexes'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    conn = op.get_bind()
    dialect = conn.engine.dialect.name

    # Create Postgres sequence if using Postgres
    if dialect == 'postgresql':
        conn.execute(text("CREATE SEQUENCE IF NOT EXISTS membership_number_seq START 1"))

    # Create unique index on activation_logs.user_id if not exists
    try:
        if dialect == 'postgresql':
            conn.execute(text("CREATE UNIQUE INDEX IF NOT EXISTS ux_activation_logs_user_id ON activation_logs(user_id)"))
        else:
            # For SQLite and others, attempt to create unique index (may error if exists)
            op.create_index('ux_activation_logs_user_id', 'activation_logs', ['user_id'], unique=True)
    except Exception:
        # Index may already exist; ignore
        pass

    # Ensure unique indexes on users.membership_number and users.membership_code
    try:
        if dialect == 'postgresql':
            conn.execute(text("CREATE UNIQUE INDEX IF NOT EXISTS ux_users_membership_number ON users(membership_number)"))
            conn.execute(text("CREATE UNIQUE INDEX IF NOT EXISTS ux_users_membership_code ON users(membership_code)"))
        else:
            op.create_index('ux_users_membership_number', 'users', ['membership_number'], unique=True)
            op.create_index('ux_users_membership_code', 'users', ['membership_code'], unique=True)
    except Exception:
        pass


def downgrade():
    conn = op.get_bind()
    dialect = conn.engine.dialect.name

    # Drop indexes if possible
    try:
        if dialect == 'postgresql':
            conn.execute(text("DROP INDEX IF EXISTS ux_activation_logs_user_id"))
            conn.execute(text("DROP INDEX IF EXISTS ux_users_membership_number"))
            conn.execute(text("DROP INDEX IF EXISTS ux_users_membership_code"))
            conn.execute(text("DROP SEQUENCE IF EXISTS membership_number_seq"))
        else:
            op.drop_index('ux_activation_logs_user_id', table_name='activation_logs')
            op.drop_index('ux_users_membership_number', table_name='users')
            op.drop_index('ux_users_membership_code', table_name='users')
    except Exception:
        pass
