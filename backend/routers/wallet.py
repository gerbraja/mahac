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
from backend.database.models.global_pool import GlobalPoolPayout, GlobalPoolDistribution
from backend.database.models.sponsorship import SponsorshipCommission
from backend.database.models.binary import BinaryCommission
# from backend.database.models.binary_millionaire import MillionaireCommission
from backend.database.models.unilevel import UnilevelCommission
from backend.database.models.binary_global import BinaryGlobalCommission
from backend.database.models.matrix import MatrixCommission
from backend.database.models.withdrawal import WithdrawalRequest
# from backend.database.models.forced_matrix import MatrixReward
from backend.database.models.special_bonuses import SpecialBonus, TravelBonus, BonusType, BonusStatus
from pydantic import BaseModel
from typing import Optional
from datetime import date

router = APIRouter(prefix="/wallet", tags=["Wallet"])

# ... (omitted check_duplicates) ...

@router.get("/check-duplicates")
def check_duplicates(key: str, fix: bool = False, db: Session = Depends(get_db)):
    from fastapi import HTTPException
    
    if key != "secure_debug_2025":
        raise HTTPException(status_code=403, detail="Forbidden")
    
    # query duplicates
    # Use raw sql or sqlalchemy group by
    from sqlalchemy import func
    
    # Find sponsor_id, new_member_id with count > 1
    subq = db.query(
        SponsorshipCommission.sponsor_id, 
        SponsorshipCommission.new_member_id, 
        func.count('*').label('cnt')
    ).group_by(
        SponsorshipCommission.sponsor_id, 
        SponsorshipCommission.new_member_id
    ).having(func.count('*') > 1).all()
    
    duplicates = []
    
    for row in subq:
        sponsor_id = row.sponsor_id
        new_member_id = row.new_member_id
        count = row.cnt
        
        duplicates.append({
            "sponsor_id": sponsor_id,
            "new_member_id": new_member_id,
            "count": count
        })
        
        if fix:
            # Fetch all entries
            entries = db.query(SponsorshipCommission).filter(
                SponsorshipCommission.sponsor_id == sponsor_id,
                SponsorshipCommission.new_member_id == new_member_id
            ).order_by(SponsorshipCommission.id).all()
            
            # Keep first
            if len(entries) > 1:
                to_delete = entries[1:]
                
                user = db.query(User).filter(User.id == sponsor_id).first()
                
                for item in to_delete:
                    amount = item.commission_amount or 0.0
                    
                    # Deduct from balance 
                    if user and user.available_balance:
                         user.available_balance -= amount
                         if user.available_balance < 0:
                             user.available_balance = 0
                        
                    db.delete(item)
                    
                db.commit()
            
    return {"found_groups": len(duplicates), "duplicates": duplicates, "fixed": fix}

@router.get("/summary")
def get_wallet_summary(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    # 0. Auto-Release Logic (Triggered on View)
    # Check if today is a payment day (or after) and move funds if eligible
    try:
        today_day = datetime.now().day
        today_month = datetime.now().month
        today_year = datetime.now().year
        
        auto_release_made = False
        
        # Matrix (Day 7+) -> Cutoff: Day 7 of current month 23:59:59
        if today_day >= 7:
            cutoff = datetime(today_year, today_month, 7, 23, 59, 59)
            matrix_total = db.query(func.sum(MatrixCommission.amount))\
                .filter(MatrixCommission.user_id == user.id, MatrixCommission.created_at <= cutoff).scalar() or 0.0
            
            pending_matrix = matrix_total - (user.released_matrix or 0.0)
            pending_matrix = min(pending_matrix, user.available_balance or 0.0)
            
            if pending_matrix > 0:
                user.bank_balance = (user.bank_balance or 0.0) + pending_matrix
                user.released_matrix = (user.released_matrix or 0.0) + pending_matrix
                user.available_balance -= pending_matrix 
                if user.available_balance < 0: user.available_balance = 0
                auto_release_made = True

        # Millionaire (Day 17+) -> Cutoff: Day 17 of current month 23:59:59
        if today_day >= 17:
             cutoff = datetime(today_year, today_month, 17, 23, 59, 59)
             millionaire_total = db.query(func.sum(BinaryCommission.commission_amount))\
                .filter(BinaryCommission.user_id == user.id, 
                        BinaryCommission.type == 'millionaire_level_bonus',
                        BinaryCommission.created_at <= cutoff).scalar() or 0.0
                        
             pending_millionaire = millionaire_total - (user.released_millionaire or 0.0)
             pending_millionaire = min(pending_millionaire, user.available_balance or 0.0)
             
             if pending_millionaire > 0:
                user.bank_balance = (user.bank_balance or 0.0) + pending_millionaire
                user.released_millionaire = (user.released_millionaire or 0.0) + pending_millionaire
                user.available_balance -= pending_millionaire
                if user.available_balance < 0: user.available_balance = 0
                auto_release_made = True

        # General (Day 27+) -> Cutoff: Day 27 of current month 23:59:59
        if today_day >= 27:
            cutoff = datetime(today_year, today_month, 27, 23, 59, 59)
            
            # Binary Normal
            bin_gen = db.query(func.sum(BinaryCommission.commission_amount))\
                .filter(BinaryCommission.user_id == user.id, 
                        BinaryCommission.type != 'millionaire_level_bonus',
                        BinaryCommission.created_at <= cutoff).scalar() or 0.0
            
            # Binary Global (uses paid_at or created_at? model says paid_at for global, but let's check model. Usually created_at is safe or paid_at)
            # Checking model: BinaryGlobalCommission has paid_at. 
            bin_global = db.query(func.sum(BinaryGlobalCommission.commission_amount))\
                .filter(BinaryGlobalCommission.user_id == user.id,
                        BinaryGlobalCommission.paid_at <= cutoff).scalar() or 0.0
            
            uni_gen = db.query(func.sum(UnilevelCommission.commission_amount))\
                .filter(UnilevelCommission.user_id == user.id, UnilevelCommission.created_at <= cutoff).scalar() or 0.0
                
            spon_gen = db.query(func.sum(SponsorshipCommission.commission_amount))\
                .filter(SponsorshipCommission.sponsor_id == user.id, SponsorshipCommission.created_at <= cutoff).scalar() or 0.0
                
            pool_gen = db.query(func.sum(GlobalPoolPayout.amount))\
                .filter(GlobalPoolPayout.user_id == user.id, GlobalPoolPayout.created_at <= cutoff).scalar() or 0.0
            
            # Rank (Qualified) - achieved_at?
            rank_gen = sum(qr.rank.reward_amount for qr in db.query(UserQualifiedRank)
                           .filter(UserQualifiedRank.user_id == user.id, UserQualifiedRank.achieved_at <= cutoff).all() 
                           if qr.rank and qr.rank.reward_amount)
            
            total_general = bin_gen + bin_global + uni_gen + spon_gen + pool_gen + rank_gen
            pending_general = total_general - (user.released_general or 0.0)
            pending_general = min(pending_general, user.available_balance or 0.0)
            
            if pending_general > 0:
                user.bank_balance = (user.bank_balance or 0.0) + pending_general
                user.released_general = (user.released_general or 0.0) + pending_general
                user.available_balance -= pending_general
                if user.available_balance < 0: user.available_balance = 0
                auto_release_made = True
                
        if auto_release_made:
            db.commit()
            db.refresh(user)
            
    except Exception as e:
        print(f"Auto-release error: {e}")
        db.rollback()

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

    # 2. Binary Global Commissions (Standard Binary + Global 2x2)
    binary_commissions = db.query(BinaryCommission).filter(
        BinaryCommission.user_id == user.id,
        BinaryCommission.type != 'millionaire_level_bonus'
    ).all()
    binary_global_commissions = db.query(BinaryGlobalCommission).filter(
        BinaryGlobalCommission.user_id == user.id
    ).all()
    
    binary_total = sum(c.commission_amount for c in binary_commissions) + sum(c.commission_amount for c in binary_global_commissions)
    
    binary_data = [{
        "amount": c.commission_amount,
        "type": c.type,
        "level": c.level,
        "date": c.created_at
    } for c in binary_commissions]
    
    # Merge global commissions into the list
    for bg in binary_global_commissions:
        binary_data.append({
            "amount": bg.commission_amount,
            "type": "binary_global_2x2",
            "level": bg.level,
            "date": bg.paid_at
        })
    
    # Sort by date desc
    binary_data.sort(key=lambda x: x["date"], reverse=True)

    # 3. Binary Millionaire Commissions
    millionaire_commissions = db.query(BinaryCommission).filter(
        BinaryCommission.user_id == user.id,
        BinaryCommission.type == 'millionaire_level_bonus'
    ).all()
    millionaire_total = sum(c.commission_amount for c in millionaire_commissions)
    millionaire_data = [{
        "amount": c.commission_amount,
        "level": c.level,
        "date": c.created_at
    } for c in millionaire_commissions]

    # 4. Unilevel Commissions (normal)
    unilevel_commissions = db.query(UnilevelCommission).filter(
        UnilevelCommission.user_id == user.id,
        UnilevelCommission.type == 'unilevel'
    ).all()
    unilevel_total = sum(c.commission_amount for c in unilevel_commissions)
    unilevel_data = [{
        "amount": c.commission_amount,
        "level": c.level,
        "sale_amount": c.sale_amount,
        "date": c.created_at
    } for c in unilevel_commissions]

    # 5. Matching Bonus (50% de comisiones de directos)
    matching_commissions = db.query(UnilevelCommission).filter(
        UnilevelCommission.user_id == user.id,
        UnilevelCommission.type == 'matching'
    ).all()
    matching_total = sum(c.commission_amount for c in matching_commissions)
    matching_data = [{
        "amount": c.commission_amount,
        "sale_amount": c.sale_amount,
        "date": c.created_at
    } for c in matching_commissions]

    # 6. Forced Matrix Rewards
    matrix_commissions = db.query(MatrixCommission).filter(MatrixCommission.user_id == user.id).all()
    matrix_total = sum(c.amount for c in matrix_commissions)
    matrix_data = [{
        "amount": c.amount,
        "matrix_level": c.matrix_id, # Using matrix_id as level/type identifier
        "reward_type": c.reason,
        "date": c.created_at
    } for c in matrix_commissions]

    # 7. Qualified Ranks Bonuses (Bonos por Matrices Cerradas)
    qualified_ranks = db.query(UserQualifiedRank).filter(UserQualifiedRank.user_id == user.id).all()
    qualified_total = sum(qr.rank.reward_amount for qr in qualified_ranks if qr.rank and qr.rank.reward_amount)
    qualified_data = [{
        "rank": qr.rank.name,
        "reward": qr.rank.reward_amount,
        "date": qr.achieved_at
    } for qr in qualified_ranks if qr.rank]

    # 8. Honor Ranks Bonuses (Bonos por Rangos de Honor)
    honor_ranks = db.query(UserHonor).filter(UserHonor.user_id == user.id).all()
    honor_data = [{
        "rank": hr.rank.name,
        "reward": hr.rank.reward_description,
        "date": hr.achieved_at
    } for hr in honor_ranks if hr.rank]

    # 9. Global Pool Commissions
    # Join Payout -> Distribution to get rank info
    pool_commissions = db.query(GlobalPoolPayout, GlobalPoolDistribution).join(
        GlobalPoolDistribution, GlobalPoolPayout.distribution_id == GlobalPoolDistribution.id
    ).filter(GlobalPoolPayout.user_id == user.id).all()
    
    pool_total = sum(pc[0].amount for pc in pool_commissions)
    pool_data = [{
        "amount": pc[0].amount,
        "rank": pc[1].rank_name,
        "period": pc[1].distribution_date.strftime("%Y-%m"), 
        "date": pc[0].created_at
    } for pc in pool_commissions]

    # 10. Sponsorship Commissions ($9.7 per direct referral)
    sponsorship_commissions = db.query(SponsorshipCommission).filter(
        SponsorshipCommission.sponsor_id == user.id
    ).all()
    sponsorship_total = sum(sc.commission_amount for sc in sponsorship_commissions if sc.status == 'paid')
    sponsorship_data = []
    for sc in sponsorship_commissions:
        new_member = db.query(User).filter(User.id == sc.new_member_id).first()
        sponsorship_data.append({
            "amount": sc.commission_amount,
            "new_member_name": new_member.name if new_member else "Unknown",
            "package_amount": sc.package_amount,
            "date": sc.created_at,
            "status": sc.status
        })

    # 11. Calculate Total Earnings from all sources
    total_earnings = (
        binary_total +
        millionaire_total +
        unilevel_total +
        matching_total +
        matrix_total +
        qualified_total +
        pool_total +
        sponsorship_total
    )

    # 11. Special Bonuses (Productos, Auto, Apartamento, Viajes)
    special_bonuses = db.query(SpecialBonus).filter(SpecialBonus.user_id == user.id).all()
    
    # Separar por tipo
    product_bonuses = [b for b in special_bonuses if b.bonus_type == BonusType.PRODUCT_PURCHASE]
    car_bonuses = [b for b in special_bonuses if b.bonus_type == BonusType.CAR_PURCHASE]
    apartment_bonuses = [b for b in special_bonuses if b.bonus_type == BonusType.APARTMENT_PURCHASE]
    travel_bonuses_special = [b for b in special_bonuses if b.bonus_type == BonusType.TRAVEL]
    
    # Totales de bonos especiales
    product_bonus_total = sum(b.bonus_value for b in product_bonuses if b.status in [BonusStatus.ACTIVE, BonusStatus.PENDING])
    car_bonus_total = sum(b.bonus_value for b in car_bonuses if b.status in [BonusStatus.ACTIVE, BonusStatus.PENDING])
    apartment_bonus_total = sum(b.bonus_value for b in apartment_bonuses if b.status in [BonusStatus.ACTIVE, BonusStatus.PENDING])
    
    # Bonos de viajes (detallado)
    travel_bonuses_detail = db.query(TravelBonus).filter(TravelBonus.user_id == user.id).all()
    total_trips = sum(tb.trips_count for tb in travel_bonuses_detail)
    trips_used = sum(tb.trips_used for tb in travel_bonuses_detail)
    trips_available = total_trips - trips_used
    
    special_bonuses_data = {
        "product_purchase": {
            "total_value": float(product_bonus_total),
            "bonuses": [{
                "id": b.id,
                "value": b.bonus_value,
                "status": b.status,
                "description": b.description,
                "awarded_for": b.awarded_for,
                "awarded_at": b.awarded_at,
                "expires_at": b.expires_at
            } for b in product_bonuses],
            "count": len(product_bonuses)
        },
        "car_purchase": {
            "total_value": float(car_bonus_total),
            "bonuses": [{
                "id": b.id,
                "value": b.bonus_value,
                "status": b.status,
                "description": b.description,
                "awarded_for": b.awarded_for,
                "awarded_at": b.awarded_at
            } for b in car_bonuses],
            "count": len(car_bonuses)
        },
        "apartment_purchase": {
            "total_value": float(apartment_bonus_total),
            "bonuses": [{
                "id": b.id,
                "value": b.bonus_value,
                "status": b.status,
                "description": b.description,
                "awarded_for": b.awarded_for,
                "awarded_at": b.awarded_at
            } for b in apartment_bonuses],
            "count": len(apartment_bonuses)
        },
        "travel": {
            "total_trips": total_trips,
            "trips_used": trips_used,
            "trips_available": trips_available,
            "bonuses": [{
                "id": tb.id,
                "trips_count": tb.trips_count,
                "trips_used": tb.trips_used,
                "trips_remaining": tb.trips_count - tb.trips_used,
                "destination_category": tb.destination_category,
                "estimated_value_per_trip": tb.estimated_value_per_trip,
                "status": tb.status,
                "awarded_at": tb.awarded_at,
                "expires_at": tb.expires_at
            } for tb in travel_bonuses_detail],
            "count": len(travel_bonuses_detail)
        }
    }

    return {
        "available_balance": user.available_balance or 0,
        "bank_balance": user.bank_balance or 0,
        "purchase_balance": user.purchase_balance or 0,
        "crypto_balance": user.crypto_balance or 0,
        "frozen_crypto_balance": frozen_sum,
        "frozen_details": frozen_details,
        "total_earnings": total_earnings,
        
        # Special Bonuses
        "special_bonuses": special_bonuses_data,
        
        # Earnings breakdown by source
        "earnings_by_source": {
            "binary_global": {
                "total": float(binary_total),
                "transactions": binary_data,
                "count": len(binary_commissions) + len(binary_global_commissions)
            },
            "binary_millionaire": {
                "total": float(millionaire_total),
                "transactions": millionaire_data,
                "count": len(millionaire_commissions)
            },
            "unilevel": {
                "total": float(unilevel_total),
                "transactions": unilevel_data,
                "count": len(unilevel_commissions)
            },
            "matching_bonus": {
                "total": float(matching_total),
                "transactions": matching_data,
                "count": len(matching_commissions)
            },
            "forced_matrix": {
                "total": float(matrix_total),
                "transactions": matrix_data,
                "count": len(matrix_commissions)
            },
            "qualified_ranks": {
                "total": float(qualified_total),
                "bonuses": qualified_data,
                "count": len(qualified_ranks)
            },
            "honor_ranks": {
                "bonuses": honor_data,
                "count": len(honor_ranks)
            },
            "global_pool": {
                "total": float(pool_total),
                "transactions": pool_data,
                "count": len(pool_commissions)
            },
            "sponsorship": {
                "total": float(sponsorship_total),
                "transactions": sponsorship_data,
                "count": len(sponsorship_commissions)
            }
        },
        
        # Legacy fields for compatibility
        "qualified_ranks": qualified_data,
        "honor_ranks": honor_data,
        "global_pool": pool_data
    }

@router.get("/debug-inspector")
def debug_wallet_inspector(key: str, username: str = "admin", db: Session = Depends(get_db)):
    if key != "secure_debug_2025":
        return {"error": "Invalid key"}
    
    user = db.query(User).filter(User.username == username).first()
    if not user:
        return {"error": "User not found"}

    # Raw Sums
    binary_sum = db.query(func.sum(BinaryCommission.commission_amount)).filter(BinaryCommission.user_id == user.id).scalar() or 0
    unilevel_sum = db.query(func.sum(UnilevelCommission.commission_amount)).filter(UnilevelCommission.user_id == user.id).scalar() or 0
    matrix_sum = db.query(func.sum(MatrixCommission.amount)).filter(MatrixCommission.user_id == user.id).scalar() or 0
    sponsor_sum = db.query(func.sum(SponsorshipCommission.commission_amount)).filter(SponsorshipCommission.sponsor_id == user.id).scalar() or 0
    
    # Base Response
    res = {
        "_version": "v3",
        "user": user.username,
        "balance_available": user.available_balance,
        "balance_crypto": user.crypto_balance,
        "raw_sums": {
            "binary": binary_sum,
            "binary_global": db.query(func.sum(BinaryGlobalCommission.commission_amount)).filter(BinaryGlobalCommission.user_id == user.id).scalar() or 0,
            "unilevel": unilevel_sum,
            "matrix": matrix_sum,
            "sponsor": sponsor_sum,
            "total_calc": binary_sum + unilevel_sum + matrix_sum + sponsor_sum
        },
        "sample_binary": [{"amount": c.commission_amount, "type": c.type, "date": str(c.created_at)} for c in db.query(BinaryCommission).filter(BinaryCommission.user_id == user.id).limit(10).all()],
        "sample_unilevel": [{"amount": c.commission_amount, "type": c.type} for c in db.query(UnilevelCommission).filter(UnilevelCommission.user_id == user.id).limit(5).all()],
        "sample_sponsorship": []
    }
    
    # Deep Debug Sponsorship
    try:
        spon_comm = db.query(SponsorshipCommission).filter(SponsorshipCommission.sponsor_id == user.id).limit(5).all()
        for sc in spon_comm:
            nm = db.query(User).filter(User.id == sc.new_member_id).first()
            if not nm:
                nm_name = "Unknown (User ID: {})".format(sc.new_member_id)
            else:
                nm_name = nm.name if nm.name else nm.username
                
            debug_entry = {
                "amount": sc.commission_amount,
                "status": sc.status,
                "nm_id": sc.new_member_id,
                "nm_name": nm_name
            }
            res["sample_sponsorship"].append(debug_entry)
    except Exception as e:
        res["sample_sponsorship"].append({"error": str(e)})

    return res

@router.get("/fix-duplicates")
def fix_duplicates(key: str, username: str, db: Session = Depends(get_db)):
    if key != "secure_debug_2025":
        return {"error": "Invalid key"}
    
    try:
        user = db.query(User).filter(User.username == username).first()
        if not user:
            return {"error": "User not found"}
            
        # Ensure balance is float
        if user.available_balance is None:
            user.available_balance = 0.0
            
        # Logic: Keep FIRST id for unique combination of (amount, type, date)
        deleted_count = 0
        
        # 1. Binary Duplicates
        all_binary = db.query(BinaryCommission).filter(BinaryCommission.user_id == user.id).order_by(BinaryCommission.id).all()
        seen = set()
        to_delete = []
        
        for c in all_binary:
            # Key: amount + type
            key = (c.commission_amount, c.type)
            if key in seen:
                to_delete.append(c.id)
            else:
                seen.add(key)
                
        if to_delete:
            db.query(BinaryCommission).filter(BinaryCommission.id.in_(to_delete)).delete(synchronize_session=False)
            deleted_count = len(to_delete)
            
            # Recalculate User Balance
            total_deleted_value = sum(c.commission_amount for c in all_binary if c.id in to_delete)
            user.available_balance -= float(total_deleted_value)
            if user.available_balance < 0: 
                user.available_balance = 0.0
            
            db.commit()
        
        return {
            "message": "Duplicates fixed",
            "deleted_count": deleted_count,
            "new_balance": user.available_balance
        }
    except Exception as e:
        db.rollback()
        import traceback
        return {"error": str(e), "trace": traceback.format_exc()}

@router.get("/fix-millionaire-currency")
def fix_millionaire_currency(key: str, db: Session = Depends(get_db)):
    """
    Migration: Divide 'millionaire_level_bonus' commissions by 4500.
    These were accidentally stored as COP but treated as USD.
    """
    if key != "secure_debug_2025":
        return {"error": "Invalid key"}
    
    try:
        # 1. Find all inflated commissions
        # We assume anything > 10 USD (which would be 45,000 COP) is suspicious for this specific bonus type
        bad_commissions = db.query(BinaryCommission).filter(
            BinaryCommission.type == 'millionaire_level_bonus',
            BinaryCommission.commission_amount > 10  
        ).all()
        
        updated_count = 0
        users_affected = set()
        
        for c in bad_commissions:
            old_amount = c.commission_amount
            new_amount = old_amount / 4500.0
            
            # Update commission
            c.commission_amount = new_amount
            updated_count += 1
            
            # Update User Balance
            user = db.query(User).filter(User.id == c.user_id).first()
            if user:
                # We need to subtract the difference
                diff = old_amount - new_amount
                user.available_balance = (user.available_balance or 0.0) - diff
                if user.available_balance < 0: user.available_balance = 0.0
                
                user.total_earnings = (user.total_earnings or 0.0) - diff
                users_affected.add(user.username)
        
        db.commit()
        
        return {
            "message": "Millionaire currency fixed",
            "count": updated_count,
            "users_affected": list(users_affected)
        }
            
    except Exception as e:
        db.rollback()
@router.get("/sync-balance")
def sync_user_balance(key: str, username: str, db: Session = Depends(get_db)):
    """
    Force recalculate user's available_balance based on the sum of all their commissions.
    Removes 'phantom' balance.
    """
    if key != "secure_debug_2025":
        return {"error": "Invalid key"}
    
    user = db.query(User).filter(User.username == username).first()
    if not user:
        return {"error": "User not found"}
        
    try:
        # Sum all sources
        binary_sum = db.query(func.sum(BinaryCommission.commission_amount)).filter(BinaryCommission.user_id == user.id).scalar() or 0
        binary_global_sum = db.query(func.sum(BinaryGlobalCommission.commission_amount)).filter(BinaryGlobalCommission.user_id == user.id).scalar() or 0
        unilevel_sum = db.query(func.sum(UnilevelCommission.commission_amount)).filter(UnilevelCommission.user_id == user.id).scalar() or 0
        matrix_sum = db.query(func.sum(MatrixCommission.amount)).filter(MatrixCommission.user_id == user.id).scalar() or 0
        sponsor_sum = db.query(func.sum(SponsorshipCommission.commission_amount)).filter(SponsorshipCommission.sponsor_id == user.id).scalar() or 0
        # Add other sources if they pay to available_balance (e.g. Pool, Matching, Ranks)
        # Note: Unilevel table handles Matching via 'type'. 
        global_pool_sum = db.query(func.sum(GlobalPoolPayout.amount)).filter(GlobalPoolPayout.user_id == user.id).scalar() or 0
        
        # Qualified/Honor ranks might be just records or paid? Assuming paid if in wallet.
        # Checking implementation: QualifiedRank has 'reward_amount'.
        qualified_sum = 0
        q_ranks = db.query(UserQualifiedRank).filter(UserQualifiedRank.user_id == user.id).all()
        for qr in q_ranks:
            if qr.rank and qr.rank.reward_amount:
                qualified_sum += qr.rank.reward_amount

        total_real_earnings = binary_sum + binary_global_sum + unilevel_sum + matrix_sum + sponsor_sum + global_pool_sum + qualified_sum
        
        old_balance = user.available_balance
        
        # Update User
        # NOTE: We assume 'available_balance' == 'total_earnings' - 'withdrawals'.
        # If there are withdrawals, we must account for them.
        # For now, assuming no withdrawals in this dev phase.
        user.available_balance = total_real_earnings
        user.total_earnings = total_real_earnings
        
        db.commit()
        
        return {
            "message": "Balance synced",
            "old_balance": old_balance,
            "new_balance": user.available_balance,
            "breakdown": {
                "binary": binary_sum,
                "unilevel": unilevel_sum,
                "matrix": matrix_sum,
                "sponsor": sponsor_sum,
                "pool": global_pool_sum,
                "ranks": qualified_sum
            }
        }
    except Exception as e:
        db.rollback()
        return {"error": str(e)}

@router.get("/withdrawal-status")
def get_withdrawal_status(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Returns the status of withdrawals:
    - active_window: bool (if today is within 7-10, 17-20, 27-30)
    - max_withdrawable: float (user.bank_balance)
    - message: string
    """
    today = datetime.now().day
    
    # Windows: 7-10, 17-20, 27-30
    is_active = (7 <= today <= 10) or (17 <= today <= 20) or (27 <= today <= 30)
    
    msg = "Retiros Habilitados"
    if not is_active:
        # Calculate next window
        if today < 7: next_date = "7"
        elif today < 17: next_date = "17"
        elif today < 27: next_date = "27"
        else: next_date = "7 del próximo mes"
        msg = f"Próxima fecha de pago: Día {next_date}"

    return {
        "active_window": is_active,
        "message": msg,
        "max_withdrawable": float(current_user.bank_balance or 0.0)
    }

@router.get("/fix-bank-zero")
def fix_bank_zero(key: str, db: Session = Depends(get_db)):
    """
    Emergency Fix: If Released Balance > 0 but Bank Balance is 0,
    restore Bank Balance to match Released Balance.
    """
    if key != "secure_debug_2025":
        return {"error": "Invalid key"}
    
    try:
        users = db.query(User).all()
        fixed_count = 0
        details = []
        
        for user in users:
            released_total = (user.released_general or 0.0) + \
                             (user.released_matrix or 0.0) + \
                             (user.released_millionaire or 0.0)
            
            # If we have released funds history, they should be in the bank (if not withdrawn).
            # If Bank is 0, they are missing.
            if released_total > 0 and (user.bank_balance or 0.0) < released_total:
                old_bank = user.bank_balance
                user.bank_balance = released_total
                fixed_count += 1
                details.append(f"{user.username}: ${old_bank} -> ${released_total}")
        
        db.commit()
        return {
            "message": f"Fixed Bank Balances for {fixed_count} users",
            "details": details
        }
    except Exception as e:
        db.rollback()
        return {"error": str(e)}


# ==========================================
# WITHDRAWAL LOGIC (Ciclos de Retiro - RELEASE & ACCUMULATE)
# ==========================================

class ReleaseStatus(BaseModel):
    current_date: str
    active_window: Optional[str] # matrix, millionaire, general, or None
    available_to_release: float
    bank_balance: float
    message: str
    
class ReleaseRequest(BaseModel):
    confirm: bool

class WithdrawalCreate(BaseModel):
    amount: float
    payment_info: str

@router.get("/release-status")
def get_release_status(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Check availability to RELEASE funds to Bank Balance.
    Day 7: Matrix
    Day 17: Millionaire
    Day 27: General
    """
    today = datetime.now()
    day = today.day
    
    active_window = None
    available_to_release = 0.0
    source_name = ""
    
    # 1. Determine Window
    if day == 7:
        active_window = "matrix"
        source_name = "Ganancias de Matrices"
    elif day == 17:
        active_window = "millionaire"
        source_name = "Bono Binario Millonario"
    elif day == 27:
        active_window = "general"
        source_name = "Ganancias Generales"
        
    # 2. Calculate Available to Release
    if active_window:
        total_earned_source = 0.0
        already_released = 0.0
        
        if active_window == "matrix":
            total_earned_source = db.query(func.sum(MatrixCommission.amount))\
                .filter(MatrixCommission.user_id == current_user.id).scalar() or 0.0
            already_released = current_user.released_matrix or 0.0
                
        elif active_window == "millionaire":
            total_earned_source = db.query(func.sum(BinaryCommission.commission_amount))\
                .filter(BinaryCommission.user_id == current_user.id, 
                        BinaryCommission.type == 'millionaire_level_bonus').scalar() or 0.0
            already_released = current_user.released_millionaire or 0.0
                        
        elif active_window == "general":
            # Binary Normal
            bin_gen = db.query(func.sum(BinaryCommission.commission_amount))\
                .filter(BinaryCommission.user_id == current_user.id, 
                        BinaryCommission.type != 'millionaire_level_bonus').scalar() or 0.0
            # Unilevel
            uni_gen = db.query(func.sum(UnilevelCommission.commission_amount))\
                .filter(UnilevelCommission.user_id == current_user.id).scalar() or 0.0
            spon_gen = db.query(func.sum(SponsorshipCommission.commission_amount))\
                .filter(SponsorshipCommission.sponsor_id == current_user.id).scalar() or 0.0
            # Global Pool
            pool_gen = db.query(func.sum(GlobalPoolPayout.amount))\
                .filter(GlobalPoolPayout.user_id == current_user.id).scalar() or 0.0
            # Ranks
            rank_gen = 0.0
            q_ranks = db.query(UserQualifiedRank).filter(UserQualifiedRank.user_id == current_user.id).all()
            for qr in q_ranks:
                if qr.rank and qr.rank.reward_amount:
                     rank_gen += qr.rank.reward_amount
            
            total_earned_source = bin_gen + uni_gen + spon_gen + pool_gen + rank_gen + (db.query(func.sum(BinaryGlobalCommission.commission_amount)).filter(BinaryGlobalCommission.user_id == current_user.id).scalar() or 0.0)
            already_released = current_user.released_general or 0.0

        # Delta
        available_to_release = total_earned_source - already_released
        if available_to_release < 0: available_to_release = 0
        
        # Security cap: Cannot release more than global wallet balance
        available_to_release = min(available_to_release, current_user.available_balance or 0.0)
        
        if available_to_release > 0:
            msg = f"Hoy es día {day}. Puedes LIBERAR {source_name}."
        else:
            msg = f"Hoy es día {day}. No tienes nuevas ganancias de {source_name} para liberar."
            
    else:
        # Check when is next
        if day < 7: next_date = 7
        elif day < 17: next_date = 17
        elif day < 27: next_date = 27
        else: next_date = 7 # Next month
        
        msg = f"Liberación de fondos cerrada. Próxima fecha: día {next_date}."

    return {
        "current_date": today.strftime("%Y-%m-%d"),
        "active_window": active_window,
        "available_to_release": float(f"{available_to_release:.2f}"),
        "bank_balance": float(f"{current_user.bank_balance or 0.0:.2f}"),
        "kyc_verified": current_user.is_kyc_verified,
        "message": msg
    }

@router.post("/release")
def release_funds(
    data: ReleaseRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from fastapi import HTTPException
    
    # KYC Check
    if not current_user.is_kyc_verified:
        raise HTTPException(
            status_code=400, 
            detail="Debes verificar tu identidad (KYC) antes de liberar fondos. Sube tus documentos en 'Mi Perfil'."
        )

    status = get_release_status(db, current_user)
    amount = status["available_to_release"]
    window = status["active_window"]
    
    if not window or amount <= 0:
         raise HTTPException(status_code=400, detail="No hay fondos disponibles para liberar hoy.")
         
    try:
        # Move funds logic
        current_user.bank_balance = (current_user.bank_balance or 0.0) + amount
        
        if window == "matrix":
            current_user.released_matrix = (current_user.released_matrix or 0.0) + amount
        elif window == "millionaire":
            current_user.released_millionaire = (current_user.released_millionaire or 0.0) + amount
        elif window == "general":
            current_user.released_general = (current_user.released_general or 0.0) + amount
            
        db.commit()
        
        return {"message": f"Se han liberado ${amount:,.2f} a tu Saldo Bancario.", "new_bank_balance": current_user.bank_balance}

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/withdraw")
def request_withdrawal(
    data: WithdrawalCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from fastapi import HTTPException

    # KYC Check
    if not current_user.is_kyc_verified:
        raise HTTPException(
            status_code=400, 
            detail="Debes verificar tu identidad (KYC) antes de solicitar un retiro. Sube tus documentos en 'Mi Perfil'."
        )

    # Minimum Amount Check ($50 USD)
    if data.amount < 50:
        raise HTTPException(
            status_code=400, 
            detail="El monto mínimo de retiro es $50.00 USD."
        )

    # 1. Validate against BANK BALANCE
    if data.amount <= 0:
        raise HTTPException(status_code=400, detail="El monto debe ser mayor a 0.")
        
    if data.amount > (current_user.bank_balance or 0):
        raise HTTPException(status_code=400, detail=f"Saldo Bancario insuficiente (${current_user.bank_balance}). Libera fondos primero.")
    
    # 2. Validate against GLOBAL Balance
    if data.amount > (current_user.available_balance or 0):
        raise HTTPException(status_code=400, detail="Saldo global insuficiente. Has gastado tus fondos liberados.")

    try:
        # Deduct from BOTH
        current_user.available_balance -= data.amount
        current_user.bank_balance -= data.amount
        
        # Create Request
        req = WithdrawalRequest(
            user_id=current_user.id,
            amount=data.amount,
            source_type="bank_withdrawal",
            status="pending",
            payment_info=data.payment_info
        )
        db.add(req)
        db.commit()
        
        return {"message": "Solicitud de retiro enviada exitosamente. Espera la confirmación del administrador.", "new_bank_balance": current_user.bank_balance}
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

class WalletMsg(BaseModel):
    orderId: int
    pin: str

@router.post("/pay-order")
def pay_order(
    payload: WalletMsg,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from fastapi import HTTPException
    from argon2 import PasswordHasher
    from backend.database.models.order import Order
    from backend.database.models.payment_transaction import PaymentTransaction
    from backend.mlm.services.payment_service import process_successful_payment

    # 1. Verify PIN
    if not current_user.transaction_pin:
        raise HTTPException(status_code=400, detail="No tienes configurada una contraseña de transacción (PIN).")
    
    try:
        ph = PasswordHasher()
        ph.verify(current_user.transaction_pin, payload.pin)
    except Exception:
         raise HTTPException(status_code=400, detail="Pin de transacción incorrecto.")

    # 2. Get Order
    order = db.query(Order).filter(Order.id == payload.orderId).with_for_update().first()
    if not order:
        raise HTTPException(status_code=404, detail="Pedido no encontrado.")
    
    if order.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="No autorizado.")

    # Check status
    if order.status in ["paid", "completado", "enviado", "pendiente_envio"]:
        raise HTTPException(status_code=400, detail="Este pedido ya ha sido pagado.")

    # 3. Check Balance
    # Use total_usd as available_balance is in USD
    amount_to_deduct = order.total_usd

    # SAFETY: Force recalculation if total_usd is missing or zero
    if amount_to_deduct <= 0 and order.total_cop > 0:
         amount_to_deduct = order.total_cop / 3800.0
    
    if amount_to_deduct <= 0:
         raise HTTPException(status_code=400, detail="Monto del pedido inválido (0 USD). Contacte soporte.")

    # Use bank_balance (Saldo Disponible) instead of global available_balance
    current_balance = current_user.bank_balance or 0.0

    if current_balance < amount_to_deduct:
        raise HTTPException(status_code=400, detail=f"Saldo insuficiente en Banco. Tienes ${current_balance:.2f} USD, necesitas ${amount_to_deduct:.2f} USD.")

    try:
        # 4. Deduct Balance
        current_user.bank_balance = current_balance - amount_to_deduct
        
        # 5. Create Transaction Record
        tx = PaymentTransaction(
            order_id=order.id,
            provider="wallet_bank",
            amount=amount_to_deduct,
            currency="USD",
            status="approved",
            metadata_json={"deducted_usd": amount_to_deduct, "original_cop": order.total_cop}
        )
        db.add(tx)
        db.commit()
        db.refresh(tx)
        
        # 6. Process Payment (Trigger Commissions, Update Order Status)
        # process_successful_payment commits internally
        process_successful_payment(db, order.id, tx.id)
        
        return {"success": True, "message": "Pago realizado con éxito.", "new_balance": current_user.available_balance}

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/debug-fix-currency")
def run_fix_currency_cleanup(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    """
    Temporary endpoint to fix currency commission issues.
    Admin only.
    """
    if not getattr(current_user, "is_admin", True): 
         pass
         
    try:
        from backend.fix_currency_commissions import fix_commissions
        fix_commissions(db)
        return {"message": "Cleanup executed successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/debug-migrate-product")
def run_product_migration(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    """
    Temporary endpoint to run product table migration.
    Admin only.
    """
    if not getattr(current_user, "is_admin", True): 
         raise HTTPException(status_code=403, detail="Admin only")
         
    try:
        from sqlalchemy import text
        # Run raw SQL to ensure column exists
        db.execute(text("ALTER TABLE products ADD COLUMN IF NOT EXISTS direct_bonus_pv INTEGER DEFAULT 0"))
        db.commit()
        return {"message": "Migration executed successfully"}
    except Exception as e:
        db.rollback()
        # If error implies column exists, ignore
        if "already exists" in str(e):
             return {"message": "Column already exists"}
        raise HTTPException(status_code=500, detail=str(e))


