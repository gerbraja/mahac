from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import func, text
from datetime import datetime
from backend.database.connection import get_db
from backend.mlm.services.binary_millionaire_service import register_in_millionaire, distribute_millionaire_commissions
from backend.database.models.binary_millionaire import BinaryMillionaireMember
from backend.database.models.binary import BinaryCommission

router = APIRouter(prefix="/api/binary-millionaire", tags=["Binary Millionaire"])

class JoinRequest(BaseModel):
    user_id: int
    amount: float # Cost of entry/package

@router.post("/join")
def join_millionaire(payload: JoinRequest, db: Session = Depends(get_db)):
    """Join the Millionaire Binary Plan.
    1. Places user in the Global 2x2 tree.
    2. Distributes commissions to upline (Levels 1-27).
    """
    try:
        member = register_in_millionaire(db, payload.user_id)
        distribute_millionaire_commissions(db, member, payload.amount)
        return {
            "message": "Joined Millionaire Plan successfully",
            "global_position": member.global_position
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/tree/{user_id}")
def get_millionaire_tree(user_id: int, db: Session = Depends(get_db)):
    """Get the immediate 2x2 structure for a user."""
    root = db.query(BinaryMillionaireMember).filter(BinaryMillionaireMember.user_id == user_id).first()
    if not root:
        return {"error": "User not found in Millionaire Plan"}
    
    def build_tree(node, depth=0):
        if depth > 2: return None
        children = db.query(BinaryMillionaireMember).filter(BinaryMillionaireMember.upline_id == node.id).all()
        return {
            "user_id": node.user_id,
            "position": node.position,
            "children": [build_tree(c, depth+1) for c in children]
        }

    return build_tree(root)

@router.get("/status/{user_id}")
def get_millionaire_status(user_id: int, db: Session = Depends(get_db)):
    """Get user status in Binary Millionaire plan."""
    member = db.query(BinaryMillionaireMember).filter(
        BinaryMillionaireMember.user_id == user_id
    ).first()
    
    if not member:
        return {"status": "not_registered"}
    
    return {
        "status": "active" if member.is_active else "inactive",
        "global_position": member.global_position,
        "position": member.position,
        "upline_id": member.upline_id,
        "is_active": member.is_active,
        "created_at": member.created_at.isoformat() if member.created_at else None
    }

@router.get("/stats/{user_id}")
def get_millionaire_stats(user_id: int, db: Session = Depends(get_db)):
    """Get detailed statistics for user's Binary Millionaire network."""
    member = db.query(BinaryMillionaireMember).filter(
        BinaryMillionaireMember.user_id == user_id
    ).first()
    
    if not member:
        return {"error": "User not registered in Binary Millionaire"}
    
    # Calculate level statistics (only odd levels 1-27)
    level_stats = []
    odd_levels = [1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27]
    
    for level in odd_levels:
        # Count members at this level
        level_members = db.execute(text("""
            WITH RECURSIVE downline AS (
                SELECT id, user_id, upline_id, 1 as depth
                FROM binary_millionaire_members
                WHERE user_id = :user_id
                
                UNION ALL
                
                SELECT m.id, m.user_id, m.upline_id, d.depth + 1
                FROM binary_millionaire_members m
                INNER JOIN downline d ON m.upline_id = d.id
                WHERE d.depth < :target_level
            )
            SELECT COUNT(*) as count
            FROM downline
            WHERE depth = :target_level
        """), {"user_id": user_id, "target_level": level}).fetchone()
        
        count = level_members[0] if level_members else 0
        
        # Get commission percentage
        if level <= 9:
            percent = 3.0
        elif level <= 17:
            percent = 2.0
        elif level <= 23:
            percent = 1.0
        else:  # 25, 27
            percent = 0.5
        
        # Get earnings from this level
        year_start = datetime(datetime.now().year, 1, 1)
        earned = db.query(func.sum(BinaryCommission.commission_amount)).filter(
            BinaryCommission.user_id == user_id,
            BinaryCommission.level == level,
            BinaryCommission.type == "millionaire_level_bonus",
            BinaryCommission.created_at >= year_start
        ).scalar() or 0.0
        
        # Total PV at this level (stored in sale_amount)
        total_pv = db.query(func.sum(BinaryCommission.sale_amount)).filter(
            BinaryCommission.user_id == user_id,
            BinaryCommission.level == level,
            BinaryCommission.type == "millionaire_level_bonus",
            BinaryCommission.created_at >= year_start
        ).scalar() or 0.0
        
        level_stats.append({
            "level": level,
            "percent": percent,
            "active_members": count,
            "total_pv": int(total_pv),
            "earned_amount": float(earned)
        })
    
    # Calculate total earnings
    total_this_year = db.query(func.sum(BinaryCommission.commission_amount)).filter(
        BinaryCommission.user_id == user_id,
        BinaryCommission.type == "millionaire_level_bonus",
        BinaryCommission.created_at >= year_start
    ).scalar() or 0.0
    
    total_all_time = db.query(func.sum(BinaryCommission.commission_amount)).filter(
        BinaryCommission.user_id == user_id,
        BinaryCommission.type == "millionaire_level_bonus"
    ).scalar() or 0.0
    
    # Total PV
    total_pv = db.query(func.sum(BinaryCommission.sale_amount)).filter(
        BinaryCommission.user_id == user_id,
        BinaryCommission.type == "millionaire_level_bonus"
    ).scalar() or 0.0
    
    # Count left and right lines
    left_member = db.query(BinaryMillionaireMember).filter(
        BinaryMillionaireMember.upline_id == member.id,
        BinaryMillionaireMember.position == 'left'
    ).first()
    
    right_member = db.query(BinaryMillionaireMember).filter(
        BinaryMillionaireMember.upline_id == member.id,
        BinaryMillionaireMember.position == 'right'
    ).first()
    
    left_count = 0
    right_count = 0
    
    if left_member:
        left_subtree = db.execute(text("""
            WITH RECURSIVE downline AS (
                SELECT id FROM binary_millionaire_members WHERE id = :member_id
                UNION ALL
                SELECT m.id FROM binary_millionaire_members m
                INNER JOIN downline d ON m.upline_id = d.id
            )
            SELECT COUNT(*) FROM downline
        """), {"member_id": left_member.id}).fetchone()
        left_count = left_subtree[0] if left_subtree else 0
    
    if right_member:
        right_subtree = db.execute(text("""
            WITH RECURSIVE downline AS (
                SELECT id FROM binary_millionaire_members WHERE id = :member_id
                UNION ALL
                SELECT m.id FROM binary_millionaire_members m
                INNER JOIN downline d ON m.upline_id = d.id
            )
            SELECT COUNT(*) FROM downline
        """), {"member_id": right_member.id}).fetchone()
        right_count = right_subtree[0] if right_subtree else 0
    
    return {
        "level_stats": level_stats,
        "total_earnings_this_year": float(total_this_year),
        "total_earnings_all_time": float(total_all_time),
        "total_pv": int(total_pv),
        "left_line_count": left_count,
        "right_line_count": right_count
    }

