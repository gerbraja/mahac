from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List
from sqlalchemy.orm import Session
from sqlalchemy import func, text
from backend.database.models.activation import ActivationLog
from backend.database.connection import get_db
from backend.mlm.services.binary_service import register_in_binary_global, activate_binary_global, check_expirations
from backend.mlm.services.arrival_service import apply_arrival_bonus_rules
from backend.mlm.services.activation_service import process_activation
from backend.database.models.user import User

router = APIRouter(prefix="/binary", tags=["Binary"])


class BinaryRequest(BaseModel):
    seller_id: int
    package_amount: float
    signup_percent: float | None = None


@router.post("/pre-register/{user_id}")
def pre_register_user(user_id: int, db: Session = Depends(get_db)):
    """Pre-register a user in the Binary Global 2x2 plan."""
    try:
        member = register_in_binary_global(db, user_id)
        return {
            "message": "User pre-registered successfully",
            "global_position": member.global_position,
            "activation_deadline": member.activation_deadline
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/activate-global/{user_id}")
def activate_global_user(user_id: int, db: Session = Depends(get_db)):
    """Activate a user in the Binary Global plan (confirm payment)."""
    try:
        activate_binary_global(db, user_id)
        return {"message": "User activated in Binary Global"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/run-expirations")
def run_expiration_check(db: Session = Depends(get_db)):
    """Manually trigger expiration check for testing."""
    try:
        check_expirations(db)
        return {"message": "Expiration check completed"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/global/{user_id}")
def get_global_status(user_id: int, db: Session = Depends(get_db)):
    """Get user status in Binary Global 2x2."""
    from backend.database.models.binary_global import BinaryGlobalMember
    member = db.query(BinaryGlobalMember).filter(BinaryGlobalMember.user_id == user_id).first()
    if not member:
        return {"status": "not_registered"}
    
    return {
        "status": "active" if member.is_active else "pre_registered",
        "global_position": member.global_position,
        "activation_deadline": member.activation_deadline.isoformat() if member.activation_deadline else None,
        "earning_deadline": member.earning_deadline.isoformat() if member.earning_deadline else None,
        "activated_at": member.activated_at.isoformat() if member.activated_at else None,
        "registered_at": member.registered_at.isoformat() if member.registered_at else None,
        "position": member.position,
        "upline_id": member.upline_id,
        "is_active": member.is_active
    }

@router.get("/global/stats/{user_id}")
def get_global_stats(user_id: int, db: Session = Depends(get_db)):
    """Get detailed statistics for user's Binary Global network."""
    from backend.database.models.binary_global import BinaryGlobalMember, BinaryGlobalCommission
    from datetime import datetime
    
    member = db.query(BinaryGlobalMember).filter(BinaryGlobalMember.user_id == user_id).first()
    if not member:
        return {"error": "User not registered in Binary Global"}
    
    # Calculate level statistics
    level_stats = []
    total_members_in_network = 0
    
    for level in range(1, 22):  # Levels 1-21
        # Count members at this level in user's network
        level_members = db.execute(text("""
            WITH RECURSIVE downline AS (
                SELECT id, user_id, upline_id, 1 as depth
                FROM binary_global_members
                WHERE user_id = :user_id
                
                UNION ALL
                
                SELECT m.id, m.user_id, m.upline_id, d.depth + 1
                FROM binary_global_members m
                INNER JOIN downline d ON m.upline_id = d.id
                WHERE d.depth < :target_level
            )
            SELECT COUNT(*) as count
            FROM downline
            WHERE depth = :target_level
        """), {"user_id": user_id, "target_level": level}).fetchone()
        
        count = level_members[0] if level_members else 0
        total_members_in_network += count
        
        # Calculate earnings for this level (only odd levels pay)
        pays = level % 2 == 1 and level >= 3
        commission_rate = 1.00 if level >= 15 else 0.50
        
        # Get actual earnings from this level this year
        year_start = datetime(datetime.now().year, 1, 1)
        earned_this_year = 0.0
        
        if pays:
            earnings = db.query(func.sum(BinaryGlobalCommission.amount)).filter(
                BinaryGlobalCommission.receiver_id == user_id,
                BinaryGlobalCommission.level == level,
                BinaryGlobalCommission.created_at >= year_start
            ).scalar()
            earned_this_year = float(earnings) if earnings else 0.0
        
        level_stats.append({
            "level": level,
            "pays": pays,
            "commission_per_person": commission_rate if pays else 0.0,
            "possible_members": 2 ** level,
            "active_members": count,
            "earned_this_year": earned_this_year,
            "potential_max": (2 ** level * commission_rate) if pays else 0.0
        })
    
    # Calculate total earnings
    total_this_year = db.query(func.sum(BinaryGlobalCommission.amount)).filter(
        BinaryGlobalCommission.receiver_id == user_id,
        BinaryGlobalCommission.created_at >= year_start
    ).scalar()
    
    total_all_time = db.query(func.sum(BinaryGlobalCommission.amount)).filter(
        BinaryGlobalCommission.receiver_id == user_id
    ).scalar()
    
    # Count left and right direct children
    left_member = db.query(BinaryGlobalMember).filter(
        BinaryGlobalMember.upline_id == member.id,
        BinaryGlobalMember.position == 'left'
    ).first()
    
    right_member = db.query(BinaryGlobalMember).filter(
        BinaryGlobalMember.upline_id == member.id,
        BinaryGlobalMember.position == 'right'
    ).first()
    
    # Count total in left and right subtrees
    left_count = 0
    right_count = 0
    
    if left_member:
        left_subtree = db.execute(text("""
            WITH RECURSIVE downline AS (
                SELECT id FROM binary_global_members WHERE id = :member_id
                UNION ALL
                SELECT m.id FROM binary_global_members m
                INNER JOIN downline d ON m.upline_id = d.id
            )
            SELECT COUNT(*) FROM downline
        """), {"member_id": left_member.id}).fetchone()
        left_count = left_subtree[0] if left_subtree else 0
    
    if right_member:
        right_subtree = db.execute(text("""
            WITH RECURSIVE downline AS (
                SELECT id FROM binary_global_members WHERE id = :member_id
                UNION ALL
                SELECT m.id FROM binary_global_members m
                INNER JOIN downline d ON m.upline_id = d.id
            )
            SELECT COUNT(*) FROM downline
        """), {"member_id": right_member.id}).fetchone()
        right_count = right_subtree[0] if right_subtree else 0
    
    return {
        "level_stats": level_stats,
        "total_earnings_this_year": float(total_this_year) if total_this_year else 0.0,
        "total_earnings_all_time": float(total_all_time) if total_all_time else 0.0,
        "total_network_members": total_members_in_network,
        "left_line_count": left_count,
        "right_line_count": right_count
    }


class ArrivalRequest(BaseModel):
    new_user_id: int
    plan_file: str | None = None


@router.post("/arrival", response_model=List[dict])
def arrival_trigger(payload: ArrivalRequest, db: Session = Depends(get_db)):
    """Trigger arrival bonus processing for a newly entered member.

    Example body:
    { "new_user_id": 42, "plan_file": "binario_global/plan_template.yml" }
    """
    plan_file = payload.plan_file or "binario_global/plan_template.yml"
    try:
        commissions = apply_arrival_bonus_rules(db, payload.new_user_id, plan_file=plan_file)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

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


class ActivationRequest(BaseModel):
    user_id: int
    package_amount: float
    signup_percent: float | None = None
    plan_file: str | None = None


@router.post("/activate", response_model=dict)
def activate_user(payload: ActivationRequest, db: Session = Depends(get_db)):
    """Activate a user by registering a package purchase. This will:
    - distribute signup/package commissions according to plan (binary distribution)
    - apply arrival bonus rules for ancestors (if any)
    Returns both lists of created commissions.
    """
    # Delegate activation processing to the service which performs the atomic work
    try:
        result = process_activation(db, payload.user_id, payload.package_amount, signup_percent=payload.signup_percent or None, plan_file=payload.plan_file or None)
    except ValueError as e:
        db.rollback()
        raise HTTPException(status_code=404, detail=str(e))
    except Exception:
        db.rollback()
        raise
    def serialize_list(lst):
        out = []
        for c in lst:
            created = getattr(c, 'created_at', None)
            out.append({
                'id': getattr(c, 'id', None),
                'user_id': c.user_id,
                'sale_amount': float(c.sale_amount) if c.sale_amount is not None else None,
                'commission_amount': float(c.commission_amount) if c.commission_amount is not None else None,
                'level': c.level,
                'type': c.type,
                'created_at': created.isoformat() if created is not None else None,
            })
        return out

    # If the service indicated it was already activated, return that
    if result.get('already_activated'):
        return {
            'already_activated': True,
            'membership_number': result.get('membership_number'),
            'membership_code': result.get('membership_code'),
        }

    return {
        'signup_commissions': serialize_list(result.get('signup_commissions', [])),
        'arrival_commissions': serialize_list(result.get('arrival_commissions', [])),
        'membership_number': result.get('membership_number'),
        'membership_code': result.get('membership_code'),
    }
