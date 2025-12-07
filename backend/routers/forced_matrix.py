"""
Forced Matrix Router
Handles the 9-level forced matrix system (Consumidor to Diamante Azul)
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, text
from backend.database.connection import get_db
from backend.database.models.forced_matrix import ForcedMatrixMember, ForcedMatrixCycle
from datetime import datetime
from typing import Optional

router = APIRouter(
    prefix="/api/forced-matrix",
    tags=["Forced Matrix"]
)

# Matrix configuration from plan_template.yml
MATRIX_CONFIG = {
    1: {"name": "CONSUMIDOR", "amount": 77, "reentry": 27, "next": 2, "usd": 77, "crypto": 0, "bonus": None},
    2: {"name": "BRONCE", "amount": 277, "reentry": 77, "next": 3, "usd": 277, "crypto": 0, "bonus": None},
    3: {"name": "PLATA", "amount": 877, "reentry": 277, "next": 4, "usd": 877, "crypto": 0, "bonus": 147},
    4: {"name": "ORO", "amount": 3000, "reentry": 877, "next": 5, "usd": 1500, "crypto": 1500, "bonus": 500},
    5: {"name": "PLATINO", "amount": 9700, "reentry": 3000, "next": 6, "usd": 4850, "crypto": 4850, "bonus": 1700},
    6: {"name": "RUBÍ", "amount": 25000, "reentry": 9700, "next": 7, "usd": 12500, "crypto": 12500, "bonus": 4000},
    7: {"name": "ESMERALDA", "amount": 77000, "reentry": 25000, "next": 8, "usd": 38500, "crypto": 38500, "bonus": 7700},
    8: {"name": "DIAMANTE", "amount": 270000, "reentry": 80000, "next": 9, "usd": 135000, "crypto": 135000, "bonus": 47000},
    9: {"name": "DIAMANTE AZUL", "amount": 970000, "reentry": 270000, "next": None, "usd": 485000, "crypto": 485000, "bonus": 77000}
}


@router.get("/status/{user_id}")
def get_forced_matrix_status(user_id: int, db: Session = Depends(get_db)):
    """
    Get user's status across all 9 matrices
    """
    memberships = db.query(ForcedMatrixMember).filter(
        ForcedMatrixMember.user_id == user_id,
        ForcedMatrixMember.is_active == True
    ).all()
    
    if not memberships:
        return {"status": "not_registered", "matrices": []}
    
    result = {
        "status": "active",
        "user_id": user_id,
        "matrices": []
    }
    
    for member in memberships:
        config = MATRIX_CONFIG.get(member.matrix_level, {})
        result["matrices"].append({
            "level": member.matrix_level,
            "name": config.get("name", "Unknown"),
            "global_position": member.global_position,
            "position": member.position,
            "cycles_completed": member.cycles_completed,
            "created_at": member.created_at.isoformat() if member.created_at else None,
            "last_cycle_at": member.last_cycle_at.isoformat() if member.last_cycle_at else None
        })
    
    return result


@router.get("/stats/{user_id}")
def get_forced_matrix_stats(user_id: int, db: Session = Depends(get_db)):
    """
    Get detailed statistics for all matrices
    """
    stats = {
        "user_id": user_id,
        "matrices": [],
        "totals": {
            "total_earned_usd": 0.0,
            "total_earned_crypto": 0.0,
            "total_bonuses": 0.0,
            "total_cycles": 0
        }
    }
    
    for level in range(1, 10):  # 9 matrices
        config = MATRIX_CONFIG[level]
        
        # Get user's membership in this matrix
        member = db.query(ForcedMatrixMember).filter(
            ForcedMatrixMember.user_id == user_id,
            ForcedMatrixMember.matrix_level == level
        ).first()
        
        if not member:
            stats["matrices"].append({
                "level": level,
                "name": config["name"],
                "status": "not_joined",
                "cycles": 0,
                "earned_usd": 0.0,
                "earned_crypto": 0.0,
                "bonuses": 0.0,
                "active_members": 0
            })
            continue
        
        # Count cycles and earnings
        cycles = db.query(ForcedMatrixCycle).filter(
            ForcedMatrixCycle.user_id == user_id,
            ForcedMatrixCycle.matrix_level == level
        ).all()
        
        total_usd = sum(float(c.reward_usd or 0) for c in cycles)
        total_crypto = sum(float(c.reward_crypto or 0) for c in cycles)
        total_bonus = sum(float(c.one_time_bonus or 0) for c in cycles)
        
        # Count active members in this matrix under this user
        # Using recursive CTE to count downline
        active_count = db.execute(text("""
            WITH RECURSIVE downline AS (
                SELECT id, user_id FROM forced_matrix_members 
                WHERE user_id = :user_id AND matrix_level = :level
                
                UNION ALL
                
                SELECT m.id, m.user_id FROM forced_matrix_members m
                INNER JOIN downline d ON m.upline_id = d.id
                WHERE m.matrix_level = :level AND m.is_active = 1
            )
            SELECT COUNT(*) FROM downline WHERE user_id != :user_id
        """), {"user_id": user_id, "level": level}).scalar() or 0
        
        stats["matrices"].append({
            "level": level,
            "name": config["name"],
            "status": "active" if member.is_active else "inactive",
            "cycles": len(cycles),
            "earned_usd": total_usd,
            "earned_crypto": total_crypto,
            "bonuses": total_bonus,
            "active_members": active_count,
            "current_position": member.global_position
        })
        
        # Add to totals
        stats["totals"]["total_earned_usd"] += total_usd
        stats["totals"]["total_earned_crypto"] += total_crypto
        stats["totals"]["total_bonuses"] += total_bonus
        stats["totals"]["total_cycles"] += len(cycles)
    
    return stats


@router.post("/join/{matrix_level}")
def join_forced_matrix(
    matrix_level: int,
    user_id: int,
    upline_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """
    Register user in a specific matrix level
    """
    if matrix_level not in MATRIX_CONFIG:
        raise HTTPException(status_code=400, detail="Invalid matrix level")
    
    # Check if already registered
    existing = db.query(ForcedMatrixMember).filter(
        ForcedMatrixMember.user_id == user_id,
        ForcedMatrixMember.matrix_level == matrix_level
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Already registered in this matrix")
    
    # Find next available position
    total_members = db.query(func.count(ForcedMatrixMember.id)).filter(
        ForcedMatrixMember.matrix_level == matrix_level
    ).scalar() or 0
    
    new_member = ForcedMatrixMember(
        user_id=user_id,
        matrix_level=matrix_level,
        upline_id=upline_id,
        global_position=total_members + 1,
        position="left" if total_members % 2 == 0 else "right",
        cycles_completed=0,
        is_active=True
    )
    
    db.add(new_member)
    db.commit()
    db.refresh(new_member)
    
    config = MATRIX_CONFIG[matrix_level]
    
    return {
        "success": True,
        "matrix_level": matrix_level,
        "matrix_name": config["name"],
        "global_position": new_member.global_position,
        "position": new_member.position,
        "message": f"Successfully joined {config['name']} matrix at position #{new_member.global_position}"
    }


@router.post("/cycle/{matrix_level}")
def record_matrix_cycle(
    matrix_level: int,
    user_id: int,
    db: Session = Depends(get_db)
):
    """
    Record a cycle completion and calculate rewards
    """
    if matrix_level not in MATRIX_CONFIG:
        raise HTTPException(status_code=400, detail="Invalid matrix level")
    
    member = db.query(ForcedMatrixMember).filter(
        ForcedMatrixMember.user_id == user_id,
        ForcedMatrixMember.matrix_level == matrix_level
    ).first()
    
    if not member:
        raise HTTPException(status_code=404, detail="Not registered in this matrix")
    
    config = MATRIX_CONFIG[matrix_level]
    
    # Create cycle record
    cycle = ForcedMatrixCycle(
        user_id=user_id,
        matrix_level=matrix_level,
        matrix_name=config["name"],
        total_reward=config["amount"],
        reward_usd=config["usd"],
        reward_crypto=config["crypto"],
        one_time_bonus=config["bonus"] if member.cycles_completed == 0 else None,
        reentry_amount=config["reentry"],
        next_matrix_id=config["next"],
        cycle_number=member.cycles_completed + 1
    )
    
    # Update member
    member.cycles_completed += 1
    member.last_cycle_at = datetime.now()
    
    db.add(cycle)
    db.commit()
    db.refresh(cycle)
    
    return {
        "success": True,
        "matrix_level": matrix_level,
        "matrix_name": config["name"],
        "cycle_number": cycle.cycle_number,
        "rewards": {
            "total": float(cycle.total_reward),
            "usd": float(cycle.reward_usd),
            "crypto": float(cycle.reward_crypto),
            "bonus": float(cycle.one_time_bonus) if cycle.one_time_bonus else 0.0
        },
        "reentry_amount": float(cycle.reentry_amount),
        "next_matrix": cycle.next_matrix_id,
        "message": f"Cycle #{cycle.cycle_number} completed in {config['name']} matrix!"
    }
