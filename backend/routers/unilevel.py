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
        # SELF-HEALING: Auto-register if missing
        try:
            user = db.query(User).filter(User.id == user_id).first()
            if not user:
                return {"status": "not_registered", "user_id": user_id}
                
            # Find sponsor's unilevel node
            sponsor_id = user.referred_by_id
            uni_sponsor = None
            if sponsor_id:
                uni_sponsor = db.query(UnilevelMember).filter(UnilevelMember.user_id == sponsor_id).first()
            
            new_uni = UnilevelMember(
                user_id=user.id,
                sponsor_id=uni_sponsor.id if uni_sponsor else None,
                level=(uni_sponsor.level + 1) if uni_sponsor else 1
            )
            db.add(new_uni)
            db.commit()
            db.refresh(new_uni)
            member = new_uni
            # Continue to return active status below...
        except Exception as e:
            print(f"Error auto-registering Unilevel: {e}")
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
    
    # Helper function to get members at specific level depth
    def get_members_at_level(sponsor_member_id, target_level, current_level=1):
        """Get all members at a specific level depth"""
        if current_level == target_level:
            # We've reached the target level, return these members
            return db.query(UnilevelMember).filter(
                UnilevelMember.sponsor_id == sponsor_member_id
            ).all()
        elif current_level < target_level:
            # Go deeper
            members = []
            direct_members = db.query(UnilevelMember).filter(
                UnilevelMember.sponsor_id == sponsor_member_id
            ).all()
            for direct_member in direct_members:
                members.extend(get_members_at_level(direct_member.id, target_level, current_level + 1))
            return members
        else:
            return []
    
    # Get stats by level
    levels_stats = {}
    for level_num in range(1, 8):
        # Get actual members at this level by traversing the tree
        members_at_level = get_members_at_level(member.id, level_num)
        
        # Count active members at this level
        active_at_level = 0
        for member_obj in members_at_level:
            user_obj = db.query(User).filter(User.id == member_obj.user_id).first()
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
    Get all direct referred users (based on User.referred_by_id).
    Each entry now includes rank progress data so the frontend can
    render Honor Rank and Qualification Rank progress bars without
    making extra API calls.
    """
    from backend.database.models.order import Order
    from backend.database.models.order_item import OrderItem
    from sqlalchemy import func as sqlfunc

    # Honor Rank thresholds (commission accumulated in USD)
    HONOR_RANKS = [
        {"name": "Silver",              "emoji": "🥈", "commission": 1_000},
        {"name": "Gold",                "emoji": "🥇", "commission": 4_700},
        {"name": "Platinum",            "emoji": "💎", "commission": 8_700},
        {"name": "Rubí",                "emoji": "💍", "commission": 19_700},
        {"name": "Esmeralda",           "emoji": "💚", "commission": 39_700},
        {"name": "Diamond",             "emoji": "✨", "commission": 77_700},
        {"name": "Blue Diamond",        "emoji": "🔷", "commission": 127_700},
        {"name": "Diamante Rojo",       "emoji": "🔴", "commission": 277_700},
        {"name": "Diamante Negro",      "emoji": "🖤", "commission": 477_700},
        {"name": "Diamante Corona",     "emoji": "👑", "commission": 777_700},
        {"name": "Diamante Corona Azul","emoji": "💠", "commission": 1_777_700},
        {"name": "Diamante Corona Rojo","emoji": "❤️‍🔥","commission": 7_777_700},
        {"name": "Diamante Corona Negro","emoji": "🏆", "commission": 37_777_700},
    ]

    # Qualification Rank thresholds (number of completed matrices)
    QUALIFICATION_RANKS = [
        {"name": "Consumidor", "emoji": "👤",  "matrix_id": 27},
        {"name": "Bronce",     "emoji": "🥉",  "matrix_id": 77},
        {"name": "Plata",      "emoji": "🥈",  "matrix_id": 277},
        {"name": "Oro",        "emoji": "🥇",  "matrix_id": 877},
        {"name": "Platino",    "emoji": "💎",  "matrix_id": 3_000},
        {"name": "Rubí",       "emoji": "💍",  "matrix_id": 9_700},
        {"name": "Esmeralda",  "emoji": "💚",  "matrix_id": 30_000},
        {"name": "Diamante",   "emoji": "✨",  "matrix_id": 100_000},
    ]

    # Get the current user's username and referral code for fallback lookup
    sponsor_user = db.query(User).filter(User.id == user_id).first()
    if not sponsor_user:
        return {
            "user_id": user_id,
            "total_directs": 0,
            "total_network": 0,
            "directs": [],
        }

    # Primary lookup: by referred_by_id (preferred, set for all new registrations)
    # Fallback: by referred_by text field matching the sponsor's username (legacy registrations)
    sponsor_username = (sponsor_user.username or "").lower().strip()
    sponsor_refcode = (sponsor_user.referral_code or "").lower().strip()

    from sqlalchemy import or_, func as sqlfunc2

    direct_referrals = db.query(User).filter(
        or_(
            User.referred_by_id == user_id,
            # Legacy fallback: referred_by field stored the sponsor's username as plain text
            sqlfunc2.lower(sqlfunc2.trim(User.referred_by)) == sponsor_username,
            sqlfunc2.lower(sqlfunc2.trim(User.referred_by)) == sponsor_refcode,
        )
    ).filter(User.id != user_id).all()  # Exclude self-reference just in case

    directs_list = []
    for du in direct_referrals:
        # ── Honor Rank: total lifetime earnings ──────────────
        total_earned = float(du.total_earnings or 0.0)

        # Current honor rank (highest threshold exceeded)
        current_honor = None
        next_honor = None
        for i, rank in enumerate(HONOR_RANKS):
            if total_earned >= rank["commission"]:
                current_honor = rank
            else:
                next_honor = rank
                break

        honor_progress_pct = 0.0
        if next_honor:
            prev_threshold = current_honor["commission"] if current_honor else 0
            span = next_honor["commission"] - prev_threshold
            honor_progress_pct = round(
                min(100, max(0, (total_earned - prev_threshold) / span * 100)), 1
            ) if span > 0 else 0

        # ── Qualification Rank: matrix completions ───────────────────────
        matrix_count = 0
        try:
            from backend.database.models.matrix import MatrixMember
            matrix_count = db.query(MatrixMember).filter(
                MatrixMember.user_id == du.id
            ).count()
        except Exception:
            pass

        current_qual = None
        next_qual = None
        for i, rank in enumerate(QUALIFICATION_RANKS):
            if matrix_count >= rank["matrix_id"]:
                current_qual = rank
            else:
                next_qual = rank
                break

        qual_progress_pct = 0.0
        if next_qual:
            prev_threshold = current_qual["matrix_id"] if current_qual else 0
            span = next_qual["matrix_id"] - prev_threshold
            qual_progress_pct = round(
                min(100, max(0, (matrix_count - prev_threshold) / span * 100)), 1
            ) if span > 0 else 0

        directs_list.append({
            "user_id": du.id,
            "name": du.name or "Unknown",
            "email": du.email or None,
            "status": du.status or "inactive",
            "username": du.username or None,
            "membership_code": du.membership_code or None,
            # Honor Rank progress
            "total_earned_usd": total_earned,
            "honor_rank": current_honor,
            "next_honor_rank": next_honor,
            "honor_progress_pct": honor_progress_pct,
            # Qualification Rank progress
            "matrix_count": matrix_count,
            "qualification_rank": current_qual,
            "next_qualification_rank": next_qual,
            "qualification_progress_pct": qual_progress_pct,
        })


    # Count total network (all downlines recursively)
    # Uses the same dual-lookup logic (referred_by_id OR legacy referred_by text)
    def count_all_referrals(uid):
        uid_user = db.query(User).filter(User.id == uid).first()
        if not uid_user:
            return 0
        u_name = (uid_user.username or "").lower().strip()
        u_ref = (uid_user.referral_code or "").lower().strip()
        referrals = db.query(User).filter(
            or_(
                User.referred_by_id == uid,
                sqlfunc2.lower(sqlfunc2.trim(User.referred_by)) == u_name,
                sqlfunc2.lower(sqlfunc2.trim(User.referred_by)) == u_ref,
            ),
            User.id != uid
        ).all()
        return sum(1 + count_all_referrals(r.id) for r in referrals)


    total_network = count_all_referrals(user_id)

    return {
        "user_id": user_id,
        "total_directs": len(directs_list),
        "total_network": total_network,
        "directs": directs_list,
    }

