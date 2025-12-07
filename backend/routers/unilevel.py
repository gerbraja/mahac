from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func
from backend.database.connection import get_db
from backend.mlm.services.unilevel_service import calculate_unilevel_commissions
from backend.database.models.unilevel import UnilevelMember, UnilevelCommission
from backend.database.models.user import User

router = APIRouter(prefix="/api/unilevel", tags=["Unilevel"])


class UnilevelRequest(BaseModel):
    seller_id: int
    sale_amount: float
    max_levels: int = 7


@router.post("/calculate", response_model=List[dict])
def generate_commission(payload: UnilevelRequest, db: Session = Depends(get_db)):
    """Accept JSON body with seller_id and sale_amount and return serialized commissions.

    Example body:
    {
      "seller_id": 2,
      "sale_amount": 100.0,
      "max_levels": 7
    }
    """
    try:
        commissions = calculate_unilevel_commissions(db, payload.seller_id, payload.sale_amount, payload.max_levels)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

    # Serialize SQLAlchemy objects into plain dicts for JSON response
    result = []
    for c in commissions:
        created = getattr(c, 'created_at', None)
        result.append({
            'id': getattr(c, 'id', None),
            'user_id': c.user_id,
            'sale_amount': float(c.sale_amount) if c.sale_amount is not None else None,
            'commission_amount': float(c.commission_amount) if c.commission_amount is not None else None,
            'level': c.level,
            'type': c.type,
            'created_at': created.isoformat() if created is not None else None,
        })

    return result


@router.get("/status/{user_id}")
def get_unilevel_status(user_id: int, db: Session = Depends(get_db)):
    """
    Get user's status in the Unilevel network
    """
    member = db.query(UnilevelMember).filter(
        UnilevelMember.user_id == user_id
    ).first()
    
    if not member:
        return {"status": "not_registered", "user_id": user_id}
    
    # Get sponsor info
    sponsor_info = None
    if member.sponsor:
        sponsor_user = db.query(User).filter(User.id == member.sponsor.user_id).first()
        sponsor_info = {
            "id": member.sponsor.user_id,
            "name": sponsor_user.name if sponsor_user else "Unknown",
            "email": sponsor_user.email if sponsor_user else None
        }
    
    return {
        "status": "active",
        "user_id": user_id,
        "member_id": member.id,
        "level": member.level,
        "sponsor": sponsor_info
    }


@router.get("/stats/{user_id}")
def get_unilevel_stats(user_id: int, db: Session = Depends(get_db)):
    """
    Get detailed statistics for user's Unilevel network
    """
    member = db.query(UnilevelMember).filter(
        UnilevelMember.user_id == user_id
    ).first()
    
    if not member:
        return {
            "user_id": user_id,
            "total_earnings": 0,
            "monthly_earnings": 0,
            "total_downline": 0,
            "active_downline": 0,
            "total_volume": 0,
            "levels": {}
        }
    
    # Get total earnings
    total_earnings = db.query(func.sum(UnilevelCommission.commission_amount)).filter(
        UnilevelCommission.user_id == user_id
    ).scalar() or 0
    
    # Get monthly earnings (current month)
    from datetime import datetime
    current_month = datetime.now().month
    current_year = datetime.now().year
    
    monthly_earnings = db.query(func.sum(UnilevelCommission.commission_amount)).filter(
        UnilevelCommission.user_id == user_id,
        func.extract('month', UnilevelCommission.created_at) == current_month,
        func.extract('year', UnilevelCommission.created_at) == current_year
    ).scalar() or 0
    
    # Get downline count recursively (using WITH RECURSIVE)
    downline_query = """
        WITH RECURSIVE downline AS (
            SELECT id, user_id, sponsor_id, level, 1 as depth
            FROM unilevel_members
            WHERE sponsor_id = :member_id
            
            UNION ALL
            
            SELECT m.id, m.user_id, m.sponsor_id, m.level, d.depth + 1
            FROM unilevel_members m
            INNER JOIN downline d ON m.sponsor_id = d.id
            WHERE d.depth < 7
        )
        SELECT COUNT(*) as total, depth
        FROM downline
        GROUP BY depth
    """
    
    downline_result = db.execute(downline_query, {"member_id": member.id}).fetchall()
    
    total_downline = sum([row[0] for row in downline_result])
    
    # For now, assume all downline is active (can be enhanced later)
    active_downline = total_downline
    
    # Get total volume (sum of all commissions' sale_amount)
    total_volume = db.query(func.sum(UnilevelCommission.sale_amount)).filter(
        UnilevelCommission.user_id == user_id
    ).scalar() or 0
    
    # Get stats by level
    levels_stats = {}
    for level_num in range(1, 8):
        # Count members at this level
        level_commissions = db.query(UnilevelCommission).filter(
            UnilevelCommission.user_id == user_id,
            UnilevelCommission.level == level_num
        ).all()
        
        level_earnings = sum([c.commission_amount for c in level_commissions])
        level_volume = sum([c.sale_amount for c in level_commissions])
        
        # Count unique downline members at this level
        unique_sellers = len(set([c.seller_id if hasattr(c, 'seller_id') else 0 for c in level_commissions]))
        
        levels_stats[level_num] = {
            "total_members": unique_sellers if unique_sellers > 0 else (total_downline // 7 if total_downline > 0 else 0),
            "active_members": unique_sellers if unique_sellers > 0 else (active_downline // 7 if active_downline > 0 else 0),
            "total_earnings": float(level_earnings),
            "total_volume": float(level_volume)
        }
    
    return {
        "user_id": user_id,
        "total_earnings": float(total_earnings),
        "monthly_earnings": float(monthly_earnings),
        "total_downline": total_downline,
        "active_downline": active_downline,
        "total_volume": float(total_volume),
        "levels": levels_stats
    }
