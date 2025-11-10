"""
Extracted Unilevel routes example. This is a standalone example copied from the
plan template backup; adapt imports and DB session integration before enabling.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.db.database import get_db  # adjust to your project
from backend.mlm.examples.unilevel_models import UnilevelMember, UnilevelCommission

router = APIRouter(prefix="/api/unilevel", tags=["Unilevel"])

# Percentages by level (fractions)
UNILEVEL_PERCENTAGES = {
    1: 0.01,
    2: 0.02,
    3: 0.02,
    4: 0.04,
    5: 0.05,
    6: 0.06,
    7: 0.07
}

EQUALIZATION_BONUS = 0.50  # 50%


def calculate_unilevel_commissions(db: Session, seller_id: int, sale_amount: float):
    current_member = db.query(UnilevelMember).filter(UnilevelMember.user_id == seller_id).first()
    if not current_member:
        raise HTTPException(status_code=404, detail="The seller is not on the unilevel network")

    commissions = []
    sponsor = current_member.sponsor
    level = 1

    # Traverse the upline up to configured number of levels (here 7)
    while sponsor and level <= 7:
        percent = UNILEVEL_PERCENTAGES.get(level, 0)
        commission_amount = sale_amount * percent
        commission = UnilevelCommission(
            user_id=sponsor.user_id,
            sale_amount=sale_amount,
            commission_amount=commission_amount,
            level=level,
            type="unilevel"
        )
        db.add(commission)
        commissions.append(commission)

        sponsor = sponsor.sponsor
        level += 1

    db.commit()

    # Calculate matching bonus (direct sponsor only)
    if current_member.sponsor:
        sponsor_id = current_member.sponsor.user_id
        total_earned_by_downlines = sum([c.commission_amount for c in commissions])
        matching_bonus = total_earned_by_downlines * EQUALIZATION_BONUS

        db.add(UnilevelCommission(
            user_id=sponsor_id,
            sale_amount=sale_amount,
            commission_amount=matching_bonus,
            level=1,
            type="matching"
        ))
        db.commit()

    return commissions


@router.post("/calculate")
def generate_commission(seller_id: int, sale_amount: float, db: Session = Depends(get_db)):
    commissions = calculate_unilevel_commissions(db, seller_id, sale_amount)
    return {
        "message": "Commissions generated correctly",
        "total_commissions": len(commissions)
    }
