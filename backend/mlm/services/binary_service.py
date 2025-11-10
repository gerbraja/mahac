from typing import List
from sqlalchemy.orm import Session
from backend.database.models.binary import BinaryCommission
from backend.database.models.user import User
from backend.database.models.unilevel import UnilevelMember

# Default signup percent for Binary Global (as in plan template)
SIGNUP_PACKAGE_COMMISSION_PERCENT = 0.07  # 7%


def calculate_binary_global_commissions(db: Session, seller_id: int, package_amount: float, signup_percent: float = SIGNUP_PACKAGE_COMMISSION_PERCENT) -> List[BinaryCommission]:
    """Calculate and persist binary-global style commissions for a package activation.

    Simple implementation (placeholder):
    - Compute the total plan allocation: package_amount * signup_percent
    - Distribute to the seller's sponsor (level 1) and sponsor's sponsor (level 2)
      with a simple split (70% / 30%) if they exist. Update user balances.

    Notes / assumptions:
    - This is a minimal, auditable implementation to mirror the Unilevel flow.
    - Later we can replace distribution logic with plan-driven rules from plan_template.yml.
    """
    # find the seller in the unilevel membership table (if present) to get sponsor chain
    member = db.query(UnilevelMember).filter(UnilevelMember.user_id == seller_id).first()
    if not member:
        # No placement info available; nothing to distribute
        raise ValueError("Seller is not placed in the network")

    total_allocation = package_amount * signup_percent
    commissions: List[BinaryCommission] = []

    level = 1
    sponsor = member.sponsor

    # Simple distribution: L1 gets 70%, L2 gets 30%
    splits = {1: 0.70, 2: 0.30}

    while sponsor and level <= 2:
            split = splits.get(level, 0)
            commission_amount = total_allocation * split

            comm = BinaryCommission(
                user_id=sponsor.user_id,
                sale_amount=package_amount,
                commission_amount=commission_amount,
                level=level,
                type="binary",
            )
            db.add(comm)
            commissions.append(comm)

            # update sponsor balances (with row-level lock if supported)
            sponsor_user = db.query(User).filter(User.id == sponsor.user_id).with_for_update().first()
            if sponsor_user:
                sponsor_user.available_balance = (sponsor_user.available_balance or 0.0) + commission_amount
                sponsor_user.monthly_earnings = (sponsor_user.monthly_earnings or 0.0) + commission_amount
                sponsor_user.total_earnings = (sponsor_user.total_earnings or 0.0) + commission_amount

            sponsor = sponsor.sponsor
            level += 1
    # Note: do not commit here; let the caller manage the transaction
    return commissions
