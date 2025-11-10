"""Add membership_number and membership_code to users table if missing

Revision ID: 0002_add_membership_columns
Revises: 0001_create_membership_seq_and_indexes
Create Date: 2025-10-27 00:00:00.000001
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '0002_add_membership_columns'
down_revision = '0001_create_membership_seq_and_indexes'
branch_labels = None
depends_on = None


def upgrade():
    bind = op.get_bind()
    insp = sa.inspect(bind)
    cols = [c['name'] for c in insp.get_columns('users')]

    if 'membership_number' not in cols:
        op.add_column('users', sa.Column('membership_number', sa.Integer(), nullable=True))
        try:
            op.create_index('ux_users_membership_number', 'users', ['membership_number'], unique=True)
        except Exception:
            pass

    if 'membership_code' not in cols:
        op.add_column('users', sa.Column('membership_code', sa.String(length=32), nullable=True))
        try:
            op.create_index('ux_users_membership_code', 'users', ['membership_code'], unique=True)
        except Exception:
            pass


def downgrade():
    bind = op.get_bind()
    insp = sa.inspect(bind)
    cols = [c['name'] for c in insp.get_columns('users')]

    if 'membership_code' in cols:
        try:
            op.drop_index('ux_users_membership_code', table_name='users')
        except Exception:
            pass
        try:
            op.drop_column('users', 'membership_code')
        except Exception:
            pass

    if 'membership_number' in cols:
        try:
            op.drop_index('ux_users_membership_number', table_name='users')
        except Exception:
            pass
        try:
            op.drop_column('users', 'membership_number')
        except Exception:
            pass
