from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime
from backend.database.connection import get_db
from backend.utils.auth import get_current_user
from backend.database.models.user import User
from backend.database.models.frozen_balance import FrozenBalance
from backend.database.models.qualified_rank import UserQualifiedRank
from backend.database.models.honor_rank import UserHonor
from backend.database.models.global_pool import GlobalPoolCommission

router = APIRouter(prefix="/wallet", tags=["Wallet"])

@router.get("/summary")
def get_wallet_summary(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    # 1. Frozen Balance Sum & Details
    frozen_records = db.query(FrozenBalance).filter(
        FrozenBalance.user_id == user.id,
        FrozenBalance.status == "locked"
    ).all()
    
    frozen_sum = sum(r.amount for r in frozen_records)
    
    frozen_details = [{
        "amount": r.amount,
        "frozen_until": r.frozen_until,
        "reason": r.reason,
        "days_remaining": (r.frozen_until - datetime.utcnow()).days
    } for r in frozen_records]

    # 2. Qualified Ranks History
    qualified_ranks = db.query(UserQualifiedRank).filter(UserQualifiedRank.user_id == user.id).all()
    ranks_data = [{
        "rank": qr.rank.name,
        "reward": qr.rank.reward_amount,
        "date": qr.achieved_at
    } for qr in qualified_ranks]

    # 3. Honor Ranks History
    honor_ranks = db.query(UserHonor).filter(UserHonor.user_id == user.id).all()
    honors_data = [{
        "rank": hr.rank.name,
        "reward": hr.rank.reward_description,
        "date": hr.achieved_at
    } for hr in honor_ranks]

    # 4. Global Pool History
    pool_commissions = db.query(GlobalPoolCommission).filter(GlobalPoolCommission.user_id == user.id).all()
    pool_data = [{
        "amount": pc.amount,
        "rank": pc.rank_name,
        "period": pc.period,
        "date": pc.created_at
    } for pc in pool_commissions]

    return {
        "available_balance": user.available_balance,
        "purchase_balance": user.purchase_balance,
        "crypto_balance": user.crypto_balance,
        "frozen_crypto_balance": frozen_sum,
        "frozen_details": frozen_details,
        "total_earnings": user.total_earnings,
        "qualified_ranks": ranks_data,
        "honor_ranks": honors_data,
        "global_pool": pool_data
    }
