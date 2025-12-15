"""
Forced Matrix Router (Legacy Adapter)
Handles the mapping between Frontend "Level 1-9" and Database "Matrix IDs" (27, 77, etc.)
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, text
from backend.database.connection import get_db
from backend.database.models.matrix import MatrixMember, MatrixCommission
from backend.mlm.services.matrix_service import MatrixService
from datetime import datetime
from typing import Optional

router = APIRouter(
    prefix="/api/forced-matrix",
    tags=["Forced Matrix"]
)

# MAPPING: Frontend Level -> Database Matrix ID
LEVEL_TO_ID = {
    1: 27,      # CONSUMIDOR ($77)
    2: 77,      # BRONCE ($277)
    3: 277,     # PLATA ($877)
    4: 877,     # ORO ($3000)
    5: 3000,    # PLATINO ($9700)
    6: 9700,    # RUBÍ ($25000)
    7: 25000,   # ESMERALDA ($77000)
    8: 77000,   # DIAMANTE ($270000)
    9: 270000   # DIAMANTE AZUL ($970000)
}

# Reverse mapping for lookups
ID_TO_LEVEL = {v: k for k, v in LEVEL_TO_ID.items()}

# Configuration for Frontend Display
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
    Get user's status across all 9 matrices (Mapped from DB IDs)
    """
    # Query all memberships for this user in Matrix table
    memberships = db.query(MatrixMember).filter(
        MatrixMember.user_id == user_id,
        MatrixMember.is_active == True
    ).all()
    
    if not memberships:
        return {"status": "not_registered", "matrices": []}
    
    result = {
        "status": "active",
        "user_id": user_id,
        "matrices": []
    }
    
    for member in memberships:
        # Map DB ID -> Frontend Level
        level = ID_TO_LEVEL.get(member.matrix_id)
        if not level:
            continue # Skip unknown matrix IDs
            
        config = MATRIX_CONFIG.get(level, {})
        
        result["matrices"].append({
            "matrix_level": level, # Frontend expects 'matrix_level'
            "name": config.get("name", "Unknown"),
            "global_position": member.id, # Using ID as position proxy if global_pos not stored
            "position": member.position,
            "cycles_completed": 0, # TODO: Implement cycles in MatrixMember if needed
            "is_active": member.is_active,
            "created_at": member.created_at.isoformat() if member.created_at else None,
            "last_cycle_at": None
        })
    
    return result

@router.get("/stats/{user_id}")
def get_forced_matrix_stats(user_id: int, db: Session = Depends(get_db)):
    """
    Get detailed statistics for all matrices (Mapped)
    """
    stats = {
        "user_id": user_id,
        "matrices": {}, # Frontend expects object keyed by ID or array? MatrixView.jsx: matrixStats.matrices?.[matrixId]
        "totals": {
            "total_earned_usd": 0.0,
            "total_earned_crypto": 0.0,
            "total_bonuses": 0.0,
            "total_cycles": 0
        }
    }
    # Fix: Frontend expects `matrices` to be an object keyed by Level ID (1, 2, 3...) based on `MatrixView.jsx` usage
    # "const statsData = matrixStats.matrices?.[matrixId] || {};"
    
    for level in range(1, 10):
        db_matrix_id = LEVEL_TO_ID.get(level)
        config = MATRIX_CONFIG[level]
        
        member = db.query(MatrixMember).filter(
            MatrixMember.user_id == user_id,
            MatrixMember.matrix_id == db_matrix_id
        ).first()
        
        if not member:
            continue
            
        # Count active members in this matrix under this user
        # 3x3 (2 levels) = direct children (3) + grandchildren (9) = 12 total
        # We need to count children + grandchildren
        
        # 1. Direct children
        children = db.query(MatrixMember).filter(MatrixMember.upline_id == member.id).all()
        active_count = len(children)
        
        # 2. Grandchildren
        for child in children:
            grand_children = db.query(MatrixMember).filter(MatrixMember.upline_id == child.id).all()
            active_count += len(grand_children)
            
        # Earnings (with error handling for missing table)
        earnings = 0.0
        try:
            earnings = db.query(func.sum(MatrixCommission.amount)).filter(
                MatrixCommission.user_id == user_id,
                MatrixCommission.matrix_id == db_matrix_id
            ).scalar() or 0.0
        except Exception as e:
            db.rollback()  # Rollback to clear aborted transaction
            print(f"Warning: Could not fetch matrix commissions for user {user_id}, matrix {db_matrix_id}: {e}")
            # Continue with 0 earnings
        
        stats["matrices"][str(level)] = {
            "level": level,
            "name": config["name"],
            "status": "active",
            "active_members": active_count, # 0-12
            "earned_usd": earnings, # Simplified: assume all cash for now
            "earned_crypto": 0.0,
            "total_earned_usd": earnings,
            "total_earned_crypto": 0.0
        }
        
        stats["totals"]["total_earned_usd"] += earnings

    return stats

