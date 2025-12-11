"""
Create sponsorship_commissions table

This table stores direct sponsorship commissions ($9.7 USD) paid to sponsors
when they directly refer someone who purchases an activation package.
"""
from alembic import op
import sqlalchemy as sa
from datetime import datetime


def upgrade():
    """Create the sponsorship_commissions table"""
    op.create_table(
        'sponsorship_commissions',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('sponsor_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('new_member_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('package_amount', sa.Float(), nullable=False),
        sa.Column('commission_amount', sa.Float(), nullable=False, default=9.7),
        sa.Column('status', sa.String(20), default='pending'),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('paid_at', sa.DateTime(), nullable=True),
    )
    
    # Create indexes for better query performance
    op.create_index('ix_sponsorship_commissions_sponsor_id', 'sponsorship_commissions', ['sponsor_id'])
    op.create_index('ix_sponsorship_commissions_new_member_id', 'sponsorship_commissions', ['new_member_id'])
    op.create_index('ix_sponsorship_commissions_status', 'sponsorship_commissions', ['status'])


def downgrade():
    """Drop the sponsorship_commissions table"""
    op.drop_index('ix_sponsorship_commissions_status', table_name='sponsorship_commissions')
    op.drop_index('ix_sponsorship_commissions_new_member_id', table_name='sponsorship_commissions')
    op.drop_index('ix_sponsorship_commissions_sponsor_id', table_name='sponsorship_commissions')
    op.drop_table('sponsorship_commissions')
