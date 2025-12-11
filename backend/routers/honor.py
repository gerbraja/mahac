from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.database.connection import get_db
from backend.database.models.honor_rank import HonorRank, UserHonor
from backend.database.models.user import User
from backend.utils.auth import get_current_user
from datetime import datetime
from pydantic import BaseModel

router = APIRouter(prefix="/api/honor", tags=["Honor Ranks"])


@router.get("/check")
def check_user_honor(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """Check current user's total commissions and create UserHonor rows
    for every HonorRank they qualify for (idempotent).
    """
    ranks = db.query(HonorRank).order_by(HonorRank.commission_required.asc()).all()
    # NOTE: the User model is expected to have a numeric `total_earnings` or
    # similar field that represents cumulative commissions.
    # Calculate total earnings EXCLUDING Matrix Commissions
    # We can do this by subtracting MatrixCommission sum from user.total_earnings
    # or by summing Unilevel + Binary + GlobalPool + etc.
    # Subtracting is easier if total_earnings is accurate.
    
    from backend.database.models.matrix import MatrixCommission
    
    matrix_earnings = db.query(func.sum(MatrixCommission.amount)).filter(MatrixCommission.user_id == user.id).scalar() or 0.0
    
    # Total valid earnings for Honor Ranks
    # Assuming user.total_earnings includes everything.
    # If total_earnings is not reliable, we should sum specific tables.
    # For now, let's trust total_earnings - matrix_earnings.
    
    valid_earnings = (getattr(user, "total_earnings", 0) or 0) - matrix_earnings
    
    achieved = []

    for rank in ranks:
        if valid_earnings >= rank.commission_required:
            existing = db.query(UserHonor).filter_by(user_id=user.id, rank_id=rank.id).first()
            if not existing:
                new_honor = UserHonor(user_id=user.id, rank_id=rank.id, achieved_at=datetime.utcnow(), reward_granted=True)
                db.add(new_honor)
                achieved.append(rank.name)
                db.commit()

    return {
        "user": getattr(user, "name", None),
        "total_commissions": user_total_commission,
        "ranges_achieved": achieved,
    }


@router.get("/my_honors")
def get_my_honors(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    honors = db.query(UserHonor).filter_by(user_id=user.id).all()
    result = []
    for h in honors:
        result.append({
            "rank": h.rank.name,
            "reward": h.rank.reward_description,
            "date": h.achieved_at.isoformat() if h.achieved_at is not None else None,
        })

    return result


class ClaimRequest(BaseModel):
    rank_id: int


@router.post("/claim")
def claim_honor(payload: ClaimRequest, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """Mark a user's honor/rank as granted/claimed.

    Note: the current `UserHonor` model has `reward_granted` boolean. For
    more detailed tracking (claimed_at, claimed_by), add fields to the model
    and a DB migration. This endpoint marks `reward_granted=True` for the
    user's honor record.
    """
    uh = db.query(UserHonor).filter_by(user_id=user.id, rank_id=payload.rank_id).first()
    if not uh:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Honor not found for user")

    if uh.reward_granted:
        return {"ok": True, "message": "Reward already marked as granted", "rank": uh.rank.name, "reward": uh.rank.reward_description}

    uh.reward_granted = True
    db.add(uh)
    db.commit()

    return {"ok": True, "message": "Reward marked as granted", "rank": uh.rank.name, "reward": uh.rank.reward_description}
