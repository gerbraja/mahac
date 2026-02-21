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
    
    # Use member.id as fallback if global_position is NULL
    display_position = member.global_position if member.global_position is not None else member.id
    
    return {
        "status": "active" if member.is_active else "pre_registered",
        "global_position": display_position,
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
    
    # Cycle logic: 28th to 27th (Colombia Time)
    now = datetime.now()
    if now.day >= 28:
        cycle_start = datetime(now.year, now.month, 28)
    else:
        # Previous month
        if now.month == 1:
            cycle_start = datetime(now.year - 1, 12, 28)
        else:
            cycle_start = datetime(now.year, now.month - 1, 28)
    
    for level in range(1, 22):  # Levels 1-21
        # Count ACTIVE members at this level in user's network
        level_members = db.execute(text("""
            WITH RECURSIVE downline AS (
                SELECT id, user_id, upline_id, 0 as depth
                FROM binary_global_members
                WHERE user_id = :user_id
                
                UNION ALL
                
                SELECT m.id, m.user_id, m.upline_id, d.depth + 1
                FROM binary_global_members m
                INNER JOIN downline d ON m.upline_id = d.id
                WHERE d.depth < :target_level
            )
            SELECT COUNT(d.id) as count
            FROM downline d
            JOIN binary_global_members m ON d.id = m.id
            WHERE d.depth = :target_level AND m.is_active = true
        """), {"user_id": user_id, "target_level": level}).fetchone()
        
        count = level_members[0] if level_members else 0
        total_members_in_network += count
        
        # Calculate earnings for this level (only odd levels pay)
        pays = level % 2 == 1 and level >= 3
        commission_rate = 1.00 if level >= 15 else 0.50
        
        # Get actual earnings from this level this cycle
        earned_this_year = 0.0
        
        if pays:
            earnings = db.query(func.sum(BinaryGlobalCommission.commission_amount)).filter(
                BinaryGlobalCommission.user_id == user_id,
                BinaryGlobalCommission.level == level,
                BinaryGlobalCommission.paid_at >= cycle_start
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
    total_this_year = db.query(func.sum(BinaryGlobalCommission.commission_amount)).filter(
        BinaryGlobalCommission.user_id == user_id,
        BinaryGlobalCommission.paid_at >= cycle_start
    ).scalar()
    
    total_all_time = db.query(func.sum(BinaryGlobalCommission.commission_amount)).filter(
        BinaryGlobalCommission.user_id == user_id
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





@router.post("/debug-fix-commissions/{user_id}")
def debug_fix_commissions(user_id: int, db: Session = Depends(get_db)):
    """
    Debug endpoint to check and fix missing commissions for a user in Binary Global.
    Scans odd levels >= 3 and ensures a commission record exists for each active member.
    """
    from backend.database.models.binary_global import BinaryGlobalMember, BinaryGlobalCommission
    from datetime import datetime
    
    # 1. Get Root Member
    root_member = db.query(BinaryGlobalMember).filter(BinaryGlobalMember.user_id == user_id).first()
    if not root_member:
        raise HTTPException(status_code=404, detail="User not found in Binary Global")
    
    current_year = datetime.utcnow().year
    fixed_count = 0
    details = []

    # 2. Iterate odd levels from 3 to 21
    for level in range(3, 22, 2): # 3, 5, 7, ... 21
        # Find all members at this level (relative depth)
        
        # Recursive query to find descendants at specific depth
        level_members = db.execute(text("""
            WITH RECURSIVE downline AS (
                SELECT id, user_id, upline_id, 0 as depth
                FROM binary_global_members
                WHERE id = :root_id
                
                UNION ALL
                
                SELECT m.id, m.user_id, m.upline_id, d.depth + 1
                FROM binary_global_members m
                INNER JOIN downline d ON m.upline_id = d.id
                WHERE d.depth < :target_level
            )
            SELECT d.id, d.user_id, m.is_active 
            FROM downline d
            JOIN binary_global_members m ON d.id = m.id
            WHERE d.depth = :target_level
        """), {"root_id": root_member.id, "target_level": level}).fetchall()

        if not level_members:
            continue
            
        commission_rate = 1.00 if level >= 15 else 0.50
        
        for m in level_members:
            # m[0]=id, m[1]=user_id, m[2]=is_active
            descendant_member_id = m[0]
            is_active = m[2]
            
            if not is_active:
                continue # SKIP INACTIVE MEMBERS
            
            # Check if commission exists
            exists = db.query(BinaryGlobalCommission).filter(
                BinaryGlobalCommission.user_id == user_id,
                BinaryGlobalCommission.member_id == descendant_member_id,
                BinaryGlobalCommission.year == current_year
            ).first()
            
            if not exists:
                # FIX: Create missing commission
                new_comm = BinaryGlobalCommission(
                    user_id=user_id,
                    member_id=descendant_member_id,
                    level=level,
                    commission_amount=commission_rate,
                    year=current_year,
                    paid_at=datetime.utcnow()
                )
                db.add(new_comm)
                fixed_count += 1
                details.append(f"Fixed missing commission from member {descendant_member_id} at level {level} (${commission_rate})")
    
    if fixed_count > 0:
        db.commit()
        return {"status": "fixed", "count": fixed_count, "details": details}
    else:
        return {"status": "ok", "message": "No missing commissions found", "details": []}

@router.delete("/debug-clean-inactive-commissions")
def debug_clean_inactive_commissions(db: Session = Depends(get_db)):
    """
    Removes commissions paid for inactive members (cleanup of previous bug).
    """
    from backend.database.models.binary_global import BinaryGlobalMember, BinaryGlobalCommission
    
    # Find commissions where member is NOT active
    bad_commissions = db.query(BinaryGlobalCommission).join(
        BinaryGlobalMember, BinaryGlobalCommission.member_id == BinaryGlobalMember.id
    ).filter(BinaryGlobalMember.is_active == False).all()
    
    deleted_count = 0
    details = []
    
    for c in bad_commissions:
        db.delete(c)
        deleted_count += 1
        details.append(f"Deleted Comm ID {c.id} for Member {c.member_id} (Inactive)")
        
    if deleted_count > 0:
        db.commit()
    
    return {"status": "cleaned", "count": deleted_count, "details": details}

@router.get("/debug-binary-levels/{user_id}")

def debug_binary_levels(user_id: int, db: Session = Depends(get_db)):
    """
    Debug endpoint to list members at specific levels (3, 4, 5, 6) 
    to verify their depth relative to the user.
    """
    from backend.database.models.binary_global import BinaryGlobalMember
    from backend.database.models.user import User
    
    root_member = db.query(BinaryGlobalMember).filter(BinaryGlobalMember.user_id == user_id).first()
    if not root_member:
        raise HTTPException(status_code=404, detail="User not found in Binary Global")
    
    results = {}
    
    # Check levels 3, 4, 5, 6
    for level in [3, 4, 5, 6]:
        level_members = db.execute(text("""
            WITH RECURSIVE downline AS (
                SELECT id, user_id, upline_id, 0 as depth
                FROM binary_global_members
                WHERE id = :root_id
                
                UNION ALL
                
                SELECT m.id, m.user_id, m.upline_id, d.depth + 1
                FROM binary_global_members m
                INNER JOIN downline d ON m.upline_id = d.id
                WHERE d.depth < :target_level
            )
            SELECT d.user_id, u.username
            FROM downline d
            JOIN users u ON d.user_id = u.id
            WHERE d.depth = :target_level
        """), {"root_id": root_member.id, "target_level": level}).fetchall()
        
        # Format: "Username (ID)"
        members_list = [f"{m.username} ({m.user_id})" for m in level_members]
        results[f"Level {level}"] = members_list
        
    return results


@router.get("/debug-trace/{username}")
def debug_trace_upline(username: str, db: Session = Depends(get_db)):
    """
    Traces the upline chain from a given username up to the root.
    Returns the list of ancestors with their depth.
    """
    from backend.database.models.binary_global import BinaryGlobalMember
    from backend.database.models.user import User
    
    # Get Target User
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail=f"User {username} not found")
        
    member = db.query(BinaryGlobalMember).filter(BinaryGlobalMember.user_id == user.id).first()
    if not member:
        raise HTTPException(status_code=404, detail="User not in Binary Global")
        
    chain = []
    current_member = member
    depth = 0
    
    while current_member:
        # Get username
        u = db.query(User).filter(User.id == current_member.user_id).first()
        uname = u.username if u else "Unknown"
        
        chain.append({
            "depth": depth,
            "user_id": current_member.user_id,
            "username": uname,
            "member_id": current_member.id,
            "upline_id": current_member.upline_id
        })
        
        if not current_member.upline_id:
            break
            
        # Move up
        current_member = db.query(BinaryGlobalMember).filter(BinaryGlobalMember.id == current_member.upline_id).first()
        depth += 1
        
        if depth > 100: # Safety break
            break
            
    return {"chain": chain}


@router.get("/debug-map-users")
def debug_map_users(db: Session = Depends(get_db)):
    """
    Debug endpoint to list IDs for key users to verifying mapping.
    """
    from backend.database.models.binary_global import BinaryGlobalMember
    from backend.database.models.user import User
    
    targets = ["admin", "Sembradores", "Gerbraja", "Gerbraja1", "Dianismarcas", "AlexisBM", "Mafecitasilva", "Danicr", "Mercam"]
    results = []
    
    for t in targets:
        user = db.query(User).filter(User.username == t).first()
        if not user:
            results.append({"username": t, "status": "NOT FOUND"})
            continue
            
        mem = db.query(BinaryGlobalMember).filter(BinaryGlobalMember.user_id == user.id).first()
        
        results.append({
            "username": t,
            "user_id": user.id,
            "member_id": mem.id if mem else None,
            "upline_id": mem.upline_id if mem else None
        })
        
    return results






