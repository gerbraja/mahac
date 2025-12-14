from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func
from backend.database.connection import get_db
from backend.mlm.services.unilevel_service import calculate_unilevel_commissions
from backend.database.models.unilevel import UnilevelMember, UnilevelCommission
from backend.database.models.user import User
from backend.database.models.sponsorship import SponsorshipCommission

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
        # Even if not in unilevel_members, calculate Quick Start Bonus
        quick_start_bonus = db.query(func.sum(SponsorshipCommission.commission_amount)).filter(
            SponsorshipCommission.sponsor_id == user_id
        ).scalar() or 0
        
        return {
            "user_id": user_id,
            "total_earnings": 0,
            "monthly_earnings": 0,
            "matching_bonus": 0,
            "quick_start_bonus": float(quick_start_bonus),
            "total_downline": 0,
            "active_downline": 0,
            "total_volume": 0,
            "levels": {}
        }
    
    # Get total earnings (excluding matching bonus)
    total_earnings = db.query(func.sum(UnilevelCommission.commission_amount)).filter(
        UnilevelCommission.user_id == user_id,
        UnilevelCommission.type == 'unilevel'
    ).scalar() or 0
    
    # Get matching bonus earnings
    matching_bonus = db.query(func.sum(UnilevelCommission.commission_amount)).filter(
        UnilevelCommission.user_id == user_id,
        UnilevelCommission.type == 'matching'
    ).scalar() or 0
    
    # Get Quick Start Bonus (Sponsorship Commissions)
    quick_start_bonus = db.query(func.sum(SponsorshipCommission.commission_amount)).filter(
        SponsorshipCommission.sponsor_id == user_id
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
    
    
    # Get downline count - count actual Unilevel members in the network
    def count_downline_recursive(sponsor_member_id, max_depth=7, current_depth=1):
        """Recursively count all downline members"""
        if current_depth > max_depth:
            return 0
        
        direct_members = db.query(UnilevelMember).filter(
            UnilevelMember.sponsor_id == sponsor_member_id
        ).all()
        
        count = len(direct_members)
        for direct_member in direct_members:
            count += count_downline_recursive(direct_member.id, max_depth, current_depth + 1)
        
        return count
    
    total_downline = count_downline_recursive(member.id)
    
    # Count active downline (users with status='active')
    def count_active_downline_recursive(sponsor_member_id, max_depth=7, current_depth=1):
        """Recursively count active downline members"""
        if current_depth > max_depth:
            return 0
        
        direct_members = db.query(UnilevelMember).filter(
            UnilevelMember.sponsor_id == sponsor_member_id
        ).all()
        
        count = 0
        for direct_member in direct_members:
            user = db.query(User).filter(User.id == direct_member.user_id).first()
            if user and user.status == 'active':
                count += 1
            count += count_active_downline_recursive(direct_member.id, max_depth, current_depth + 1)
        
        return count
    
    active_downline = count_active_downline_recursive(member.id)
    
    # Get total volume (sum of all unilevel commissions' sale_amount)
    total_volume = db.query(func.sum(UnilevelCommission.sale_amount)).filter(
        UnilevelCommission.user_id == user_id,
        UnilevelCommission.type == 'unilevel'
    ).scalar() or 0
    
    # Get stats by level
    levels_stats = {}
    for level_num in range(1, 8):
        # Count actual members at this level (direct downline only for level 1)
        if level_num == 1:
            # Direct downline: members whose sponsor is this user's member record
            members_at_level = db.query(UnilevelMember).filter(
                UnilevelMember.sponsor_id == member.id
            ).all()
        else:
            # For other levels, we need to traverse the tree
            # For simplicity, we'll use the commission records as a proxy
            members_at_level = []
        
        # Count active members at this level
        active_at_level = 0
        for member in members_at_level:
            user_obj = db.query(User).filter(User.id == member.user_id).first()
            if user_obj and user_obj.status == 'active':
                active_at_level += 1
        
        # Get commissions at this level
        level_commissions = db.query(UnilevelCommission).filter(
            UnilevelCommission.user_id == user_id,
            UnilevelCommission.level == level_num,
            UnilevelCommission.type == 'unilevel'
        ).all()
        
        level_earnings = sum([c.commission_amount for c in level_commissions])
        level_volume = sum([c.sale_amount for c in level_commissions])
        
        # Get matching bonus for this level (only level 1 has matching bonus)
        level_matching = 0
        if level_num == 1:
            level_matching = db.query(func.sum(UnilevelCommission.commission_amount)).filter(
                UnilevelCommission.user_id == user_id,
                UnilevelCommission.level == level_num,
                UnilevelCommission.type == 'matching'
            ).scalar() or 0
        
        levels_stats[level_num] = {
            "total_members": len(members_at_level),
            "active_members": active_at_level,
            "total_earnings": float(level_earnings),
            "total_volume": float(level_volume),
            "matching_bonus": float(level_matching)
        }
    
    return {
        "user_id": user_id,
        "total_earnings": float(total_earnings),
        "monthly_earnings": float(monthly_earnings),
        "matching_bonus": float(matching_bonus),
        "quick_start_bonus": float(quick_start_bonus),
        "total_downline": total_downline,
        "active_downline": active_downline,
        "total_volume": float(total_volume),
        "levels": levels_stats
    }


@router.get("/directs/{user_id}")
def get_directs(user_id: int, db: Session = Depends(get_db)):
    """
    Get all direct referred users (based on User.referred_by_id)
    """
    # Get all users directly referred by this user
    direct_referrals = db.query(User).filter(
        User.referred_by_id == user_id
    ).all()
    
    # Build directs list with user information
    directs_list = []
    for direct_user in direct_referrals:
        directs_list.append({
            "user_id": direct_user.id,
            "name": direct_user.name or "Unknown",
            "email": direct_user.email or None,
            "status": direct_user.status or "inactive",
            "username": direct_user.username or None,
            "membership_code": direct_user.membership_code or None
        })
    
    # Count total network (all downlines recursively)
    def count_all_referrals(user_id_to_count):
        count = 0
        referrals = db.query(User).filter(
            User.referred_by_id == user_id_to_count
        ).all()
        for referral in referrals:
            count += 1 + count_all_referrals(referral.id)
        return count
    
    total_network = count_all_referrals(user_id)
    
    return {
        "user_id": user_id,
        "total_directs": len(directs_list),
        "total_network": total_network,
        "directs": directs_list
    }
