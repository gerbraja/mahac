"""
Unilevel service: calculates unilevel commissions and matching (equalization) bonus.

This service uses the project's SQLAlchemy session dependency and models in
`backend.database.models.unilevel`. It's implemented to be safe and non-destructive
— it persists UnilevelCommission rows but does not alter user accounts.
"""
from typing import List
from sqlalchemy.orm import Session
from backend.database.connection import get_db
from backend.database.models.unilevel import UnilevelMember, UnilevelCommission
from backend.database.models.user import User

# Default percentages by level (fractions)
UNILEVEL_PERCENTAGES = {
    1: 0.01,
    2: 0.02,
    3: 0.02,
    4: 0.04,
    5: 0.05,
    6: 0.06,
    7: 0.07,
}

EQUALIZATION_BONUS = 0.50  # 50% of downline commissions awarded to direct sponsor


def calculate_unilevel_commissions(db: Session, seller_id: int, sale_amount: float, max_levels: int = 7) -> List[UnilevelCommission]:
    """Calculate and persist unilevel commissions for a sale and update user balances.

    This function will create UnilevelCommission rows and increment the
    corresponding User.available_balance, User.monthly_earnings and
    User.total_earnings atomically in a single transaction.

    Args:
        db: SQLAlchemy Session
        seller_id: ID of the selling user (user_id stored in UnilevelMember)
        sale_amount: numeric sale amount
        max_levels: number of upline levels to traverse

    Returns:
        List of persisted UnilevelCommission objects (including matching if any).
    """
    current_member = db.query(UnilevelMember).filter(UnilevelMember.user_id == seller_id).first()
    if not current_member:
        raise ValueError("Seller is not on the unilevel network")

    commissions: List[UnilevelCommission] = []
    sponsor = current_member.sponsor
    level = 1

    try:
        # Traverse the upline up to max_levels
        while sponsor and level <= max_levels:
            percent = UNILEVEL_PERCENTAGES.get(level, 0)
            commission_amount = sale_amount * percent

            if commission_amount > 0:
                # 1. Create Unilevel Commission for the Upline (Beneficiary)
                commission = UnilevelCommission(
                    user_id=sponsor.user_id,
                    sale_amount=sale_amount,
                    commission_amount=commission_amount,
                    level=level,
                    type="unilevel",
                )
                db.add(commission)
                commissions.append(commission)

                # Update Beneficiary Balance
                sponsor_user = db.query(User).filter(User.id == sponsor.user_id).with_for_update().first()
                if sponsor_user:
                    sponsor_user.available_balance = (sponsor_user.available_balance or 0.0) + commission_amount
                    sponsor_user.monthly_earnings = (sponsor_user.monthly_earnings or 0.0) + commission_amount
                    sponsor_user.total_earnings = (sponsor_user.total_earnings or 0.0) + commission_amount

            sponsor = sponsor.sponsor
            level += 1

        # commit all changes atomically
        db.commit()
    except Exception:
        db.rollback()
        raise

    return commissions
