"""add referral_code and referred_by_id to users

Revision ID: 0003_add_referral_columns
Revises: 0002_add_membership_columns
Create Date: 20251030_000000
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '0003_add_referral_columns'
down_revision = '0002_add_membership_columns'
branch_labels = None
depends_on = None


def upgrade():
    # Add referral_code column
    try:
        op.add_column('users', sa.Column('referral_code', sa.String(length=64), nullable=True))
    except Exception:
        pass

    # Add referred_by_id column and FK to users.id
    try:
        op.add_column('users', sa.Column('referred_by_id', sa.Integer(), nullable=True))
        op.create_index('ix_users_referred_by_id', 'users', ['referred_by_id'])
        op.create_index('ix_users_referral_code', 'users', ['referral_code'], unique=True)
        op.create_foreign_key('fk_users_referred_by_id_users', 'users', 'users', ['referred_by_id'], ['id'])
    except Exception:
        # Some DB backends (SQLite older versions) may not support adding FK easily; ignore here.
        pass


def downgrade():
    try:
        op.drop_constraint('fk_users_referred_by_id_users', 'users', type_='foreignkey')
    except Exception:
        pass
    try:
        op.drop_index('ix_users_referred_by_id', table_name='users')
    except Exception:
        pass
    try:
        op.drop_index('ix_users_referral_code', table_name='users')
    except Exception:
        pass
    try:
        op.drop_column('users', 'referred_by_id')
    except Exception:
        pass
    try:
        op.drop_column('users', 'referral_code')
    except Exception:
        pass
