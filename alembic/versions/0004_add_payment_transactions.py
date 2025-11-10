"""add payment_transactions table

Revision ID: 0004_add_payment_transactions
Revises: 0003_add_referral_columns
Create Date: 20251106_000000
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '0004_add_payment_transactions'
down_revision = '0003_add_referral_columns'
branch_labels = None
depends_on = None


def upgrade():
    try:
        op.create_table(
            'payment_transactions',
            sa.Column('id', sa.Integer(), primary_key=True),
            sa.Column('order_id', sa.Integer(), nullable=True),
            sa.Column('provider', sa.String(length=255), nullable=False, server_default='wompi'),
            sa.Column('provider_payment_id', sa.String(length=255), nullable=True),
            sa.Column('amount', sa.Float(), nullable=False),
            sa.Column('currency', sa.String(length=10), nullable=False, server_default='COP'),
            sa.Column('status', sa.String(length=50), nullable=True, server_default='pending'),
            sa.Column('idempotency_key', sa.String(length=255), nullable=True),
            sa.Column('metadata', sa.JSON(), nullable=True),
            sa.Column('raw_payload', sa.JSON(), nullable=True),
            sa.Column('processed_event_id', sa.String(length=255), nullable=True),
            sa.Column('created_at', sa.DateTime(), nullable=True),
            sa.Column('updated_at', sa.DateTime(), nullable=True),
        )
        # try to create FK if DB supports it
        try:
            op.create_foreign_key('fk_payment_transactions_order_id', 'payment_transactions', 'orders', ['order_id'], ['id'])
        except Exception:
            pass
    except Exception:
        # if table exists or DB doesn't support some features, ignore for upgrade
        pass


def downgrade():
    try:
        op.drop_table('payment_transactions')
    except Exception:
        pass
