from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
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
from backend.database.models.withholding import WithholdingTaxConfig, WithholdingRecord
from pydantic import BaseModel
from typing import Optional
from datetime import date

router = APIRouter(prefix="/wallet", tags=["Wallet"])


def _apply_withholding(db: Session, user: User, gross_amount: float, release_type: str, today_year: int) -> float:
    """
    Calculate and record withholding taxes (ReteFuente + ReteICA) for Colombian users.
    Returns the net amount after deductions.
    """
    country = (user.country or '').strip()
    city = (user.city or '').strip()
    is_colombia = 'colombia' in country.lower()

    if not is_colombia or gross_amount <= 0:
        return gross_amount

    # Try to find the user's approved KYC record with their custom tax profile
    from backend.database.models.compliance_record import ComplianceRecord
    record = db.query(ComplianceRecord).filter(
        ComplianceRecord.user_id == user.id,
        ComplianceRecord.status == 'approved'
    ).first()

    # 1. ReteFuente (national — applies to all Colombia)
    if record:
        retefuente_pct = record.retefuente_rate if record.apply_retefuente else 0.0
    else:
        # Fallback to general database configuration
        retefuente_cfg = db.query(WithholdingTaxConfig).filter(
            WithholdingTaxConfig.country == 'Colombia',
            WithholdingTaxConfig.city == None,
            WithholdingTaxConfig.tax_type == 'retefuente',
            WithholdingTaxConfig.active == True
        ).first()
        retefuente_pct = retefuente_cfg.percentage if retefuente_cfg else 6.0
        
    retefuente_amount = round(gross_amount * retefuente_pct / 100, 4)

    # 2. ReteICA (municipal — only if city matches a config or is set in approved KYC)
    reteica_pct = 0.0
    if record:
        reteica_pct = record.reteica_rate if record.apply_reteica else 0.0
    else:
        # Fallback to municipal database configuration
        if city:
            reteica_cfg = db.query(WithholdingTaxConfig).filter(
                WithholdingTaxConfig.country == 'Colombia',
                WithholdingTaxConfig.city.ilike(city),
                WithholdingTaxConfig.tax_type == 'reteica',
                WithholdingTaxConfig.active == True
            ).first()
            if reteica_cfg:
                reteica_pct = reteica_cfg.percentage
                
    reteica_amount = round(gross_amount * reteica_pct / 100, 4)

    total_withheld = round(retefuente_amount + reteica_amount, 4)
    net_amount = round(gross_amount - total_withheld, 4)

    # Save record
    withholding_record = WithholdingRecord(
        user_id=user.id,
        country=country,
        city=city or None,
        fiscal_year=today_year,
        release_type=release_type,
        gross_amount=gross_amount,
        retefuente_pct=retefuente_pct,
        retefuente_amount=retefuente_amount,
        reteica_pct=reteica_pct,
        reteica_amount=reteica_amount,
        total_withheld=total_withheld,
        net_amount=net_amount
    )
    db.add(withholding_record)
    print(f"[WITHHOLDING] User {user.id} ({country}/{city}): gross={gross_amount:.4f} retefuente={retefuente_amount:.4f} ({retefuente_pct}%) reteica={reteica_amount:.4f} ({reteica_pct}%) net={net_amount:.4f}", flush=True)
    return net_amount


@router.get("/check-duplicates")
def check_duplicates(key: str, fix: bool = False, db: Session = Depends(get_db)):
    from fastapi import HTTPException
    
    import os
    expected_debug_key = os.getenv("ADMIN_DEBUG_SECRET_KEY")
    if not expected_debug_key or key != expected_debug_key:
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
        
        now = datetime.now()
        
        # Matrix y Viajes (Día 11+) -> Cutoff: Día 11 del mes actual 00:01:00
        cutoff_matrix = datetime(today_year, today_month, 11, 0, 1, 0)
        if now >= cutoff_matrix:
            cutoff = cutoff_matrix
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

        # Binario Millonario (Día 21+) -> Cutoff: Día 21 del mes actual 00:01:00
        cutoff_millionaire = datetime(today_year, today_month, 21, 0, 1, 0)
        if now >= cutoff_millionaire:
             cutoff = cutoff_millionaire
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

        # Cierre General y Unilevel (Día 01+) -> Cutoff: Día 01 del mes actual 00:01:00
        cutoff_general = datetime(today_year, today_month, 1, 0, 1, 0)
        if now >= cutoff_general:
            cutoff = cutoff_general
            
            # Binary Normal
            bin_gen = db.query(func.sum(BinaryCommission.commission_amount))\
                .filter(BinaryCommission.user_id == user.id, 
                        BinaryCommission.type != 'millionaire_level_bonus',
                        BinaryCommission.created_at <= cutoff).scalar() or 0.0
            
            # Binary Global
            bin_global = db.query(func.sum(BinaryGlobalCommission.commission_amount))\
                .filter(BinaryGlobalCommission.user_id == user.id,
                        BinaryGlobalCommission.paid_at <= cutoff).scalar() or 0.0
            
            uni_gen = db.query(func.sum(UnilevelCommission.commission_amount))\
                .filter(UnilevelCommission.user_id == user.id, UnilevelCommission.created_at <= cutoff).scalar() or 0.0
                
            spon_gen = db.query(func.sum(SponsorshipCommission.commission_amount))\
                .filter(SponsorshipCommission.sponsor_id == user.id, SponsorshipCommission.created_at <= cutoff).scalar() or 0.0
                
            pool_gen = db.query(func.sum(GlobalPoolPayout.amount))\
                .filter(GlobalPoolPayout.user_id == user.id, GlobalPoolPayout.created_at <= cutoff).scalar() or 0.0
            
            # Rank (Qualified)
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

    # 4. Unilevel Commissions (normal + Comercios Aliados / TEI RIDE)
    unilevel_commissions = db.query(UnilevelCommission).filter(
        UnilevelCommission.user_id == user.id,
        UnilevelCommission.type.in_([
            'unilevel',
            'physical_unilevel',
            'physical_cashback',
            'physical_direct_sponsor',
            'physical_merchant_sponsor'
        ])
    ).all()
    unilevel_total = sum(c.commission_amount for c in unilevel_commissions)
    unilevel_data = [{
        "amount": c.commission_amount,
        "level": c.level,
        "type": c.type,
        "sale_amount": c.sale_amount,
        "date": c.created_at
    } for c in unilevel_commissions]

    # 5. Matching Bonus (50% de comisiones de directos)
    matching_commissions = db.query(UnilevelCommission).filter(
        UnilevelCommission.user_id == user.id,
        UnilevelCommission.type.in_(['matching', 'physical_matching'])
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
        "bank_balance": user.bank_balance or 0,          # 🟡 Caja Fuerte
        "verified_balance": user.verified_balance or 0,  # 🟢 Banco (requiere KYC + $50)
        "is_kyc_verified": user.is_kyc_verified or False,
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
    import os
    expected_debug_key = os.getenv("ADMIN_DEBUG_SECRET_KEY")
    if not expected_debug_key or key != expected_debug_key:
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
        "bank_balance": user.bank_balance,
        "verified_balance": user.verified_balance,
        "purchase_balance": user.purchase_balance,
        "total_earnings": user.total_earnings,
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
    import os
    expected_debug_key = os.getenv("ADMIN_DEBUG_SECRET_KEY")
    if not expected_debug_key or key != expected_debug_key:
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
    import os
    expected_debug_key = os.getenv("ADMIN_DEBUG_SECRET_KEY")
    if not expected_debug_key or key != expected_debug_key:
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
    import os
    expected_debug_key = os.getenv("ADMIN_DEBUG_SECRET_KEY")
    if not expected_debug_key or key != expected_debug_key:
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
    - active_window: bool (if today is within 13-16, 23-26, 3-6)
    - max_withdrawable: float (user.verified_balance)
    - message: string
    """
    today = datetime.now().day
    
    # Windows: 13-16, 23-26, 3-6 (Retiros días 13, 23 y 03)
    is_active = (13 <= today <= 16) or (23 <= today <= 26) or (3 <= today <= 6)
    
    msg = "Retiros Habilitados"
    if not is_active:
        # Calculate next window
        if today < 3: next_date = "3"
        elif today < 13: next_date = "13"
        elif today < 23: next_date = "23"
        else: next_date = "3 del próximo mes"
        msg = f"Próxima fecha de retiro: Día {next_date}"

    return {
        "active_window": is_active,
        "message": msg,
        "max_withdrawable": float(current_user.verified_balance or 0.0)
    }

@router.get("/fix-bank-zero")
def fix_bank_zero(key: str, db: Session = Depends(get_db)):
    """
    Emergency Fix: If Released Balance > 0 but Bank Balance is 0,
    restore Bank Balance to match Released Balance.
    """
    import os
    expected_debug_key = os.getenv("ADMIN_DEBUG_SECRET_KEY")
    if not expected_debug_key or key != expected_debug_key:
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
    pin: str


# ==========================================
# TRANSFERENCIA CAJA FUERTE → BANCO
# ==========================================

BANK_TRANSFER_MINIMUM_USD = 11.0  # Mínimo para transferir al Banco y retirar a Banco Personal ($49,500 COP)
BANK_WITHDRAWAL_MINIMUM_USD = 11.0  # Mínimo de retiro a Banco Personal ($11 USD / $49,500 COP)
P2P_TRANSFER_MINIMUM_USD = 3.0  # Mínimo para transferir entre usuarios de la plataforma ($3 USD / $13,500 COP)
P2P_DAILY_MAX_USD = 600.0  # Límite máximo diario para transferencias entre usuarios ($600 USD / $2,700,000 COP)
COP_EXCHANGE_RATE = 4500.0


def _calculate_system_usage_fee_usd(amount_usd: float) -> float:
    """
    Calcula la Tarifa por Uso del Sistema escalonada (en USD) según el monto en COP (Tasa 1 USD = 4500 COP):
      - Hasta $200.000 COP (<= $44.44 USD): $0.00 USD (Gratis)
      - Mayor a $200.000 COP hasta $1.200.000 COP: +$0.50 USD ($2.250 COP)
      - Mayor a $1.200.000 COP hasta $2.000.000 COP: +$1.10 USD ($4.950 COP)
      - Mayor a $2.000.000 COP: +$2.20 USD ($9.900 COP)
    """
    amount_cop = round((amount_usd or 0.0) * COP_EXCHANGE_RATE)
    if amount_cop > 2000000:
        return 2.20
    elif amount_cop > 1200000:
        return 1.10
    elif amount_cop > 200000:
        return 0.50
    return 0.0


@router.post("/transfer-to-bank")
def transfer_to_bank(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Transfiere el saldo de Caja Fuerte (bank_balance) al Banco (verified_balance).
    Requisitos:
      1. KYC aprobado (is_kyc_verified = True)
      2. bank_balance >= $11 USD
    Las retenciones (ReteFuente + ReteICA) se aplican aquí.
    """
    from fastapi import HTTPException
    current_user = db.query(User).filter(User.id == current_user.id).with_for_update().first()

    # 1. Check KYC
    if not current_user.is_kyc_verified:
        raise HTTPException(
            status_code=400,
            detail="Debes completar y tener aprobado tu KYC antes de usar el Banco."
        )

    gross = round(current_user.bank_balance or 0.0, 4)

    # 2. Check minimum
    if round(gross, 2) < BANK_TRANSFER_MINIMUM_USD:
        raise HTTPException(
            status_code=400,
            detail=f"El saldo en Caja Fuerte debe ser de al menos ${BANK_TRANSFER_MINIMUM_USD:.2f} USD ($49.500 COP) para transferir al Banco. "
                   f"Tu saldo actual es ${gross:.2f} USD."
        )

    # 3. Apply withholding (ReteFuente + ReteICA)
    today_year = datetime.now().year
    net_amount = _apply_withholding(db, current_user, gross, 'vault_to_bank', today_year)

    # 4. Move funds
    current_user.bank_balance = 0.0
    current_user.verified_balance = round((current_user.verified_balance or 0.0) + net_amount, 4)

    db.commit()
    db.refresh(current_user)

    withheld = round(gross - net_amount, 4)

    return {
        "message": "✅ Fondos transferidos al Banco exitosamente.",
        "gross_amount": gross,
        "withheld": withheld,
        "net_transferred": net_amount,
        "new_verified_balance": current_user.verified_balance,
    }


@router.get("/release-status")
def get_release_status(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Check availability to RELEASE funds to Bank Balance.
    Day 11: Matrix & Trips
    Day 21: Millionaire
    Day 01: General & Unilevel
    """
    import math
    from backend.database.models.wallet_transfer import WalletTransfer
    today = datetime.now()
    day = today.day
    
    active_window = None
    available_to_release = 0.0
    source_name = ""
    cutoff = None
    
    # 1. Determine Window
    if day == 11:
        active_window = "matrix"
        source_name = "Ganancias de Matrices y Viajes"
        cutoff = datetime(today.year, today.month, 11, 0, 1, 0)
    elif day == 21:
        active_window = "millionaire"
        source_name = "Bono Binario Millonario"
        cutoff = datetime(today.year, today.month, 21, 0, 1, 0)
    elif day == 1:
        active_window = "general"
        source_name = "Ganancias Generales y Unilevel"
        cutoff = datetime(today.year, today.month, 1, 0, 1, 0)
        
    # 2. Calculate Available to Release
    if active_window:
        total_earned_source = 0.0
        already_released = 0.0
        
        if active_window == "matrix":
            total_earned_source = db.query(func.sum(MatrixCommission.amount))\
                .filter(MatrixCommission.user_id == current_user.id, MatrixCommission.created_at <= cutoff).scalar() or 0.0
            already_released = current_user.released_matrix or 0.0
                
        elif active_window == "millionaire":
            total_earned_source = db.query(func.sum(BinaryCommission.commission_amount))\
                .filter(BinaryCommission.user_id == current_user.id, 
                        BinaryCommission.type == 'millionaire_level_bonus',
                        BinaryCommission.created_at <= cutoff).scalar() or 0.0
            already_released = current_user.released_millionaire or 0.0
                        
        elif active_window == "general":
            # Binary Normal
            bin_gen = db.query(func.sum(BinaryCommission.commission_amount))\
                .filter(BinaryCommission.user_id == current_user.id, 
                        BinaryCommission.type != 'millionaire_level_bonus',
                        BinaryCommission.created_at <= cutoff).scalar() or 0.0
            # Binary Global
            bin_global = db.query(func.sum(BinaryGlobalCommission.commission_amount))\
                .filter(BinaryGlobalCommission.user_id == current_user.id,
                        BinaryGlobalCommission.paid_at <= cutoff).scalar() or 0.0
            # Unilevel
            uni_gen = db.query(func.sum(UnilevelCommission.commission_amount))\
                .filter(UnilevelCommission.user_id == current_user.id,
                        UnilevelCommission.created_at <= cutoff).scalar() or 0.0
            # Sponsorship
            spon_gen = db.query(func.sum(SponsorshipCommission.commission_amount))\
                .filter(SponsorshipCommission.sponsor_id == current_user.id,
                        SponsorshipCommission.created_at <= cutoff).scalar() or 0.0
            # Global Pool
            pool_gen = db.query(func.sum(GlobalPoolPayout.amount))\
                .filter(GlobalPoolPayout.user_id == current_user.id,
                        GlobalPoolPayout.created_at <= cutoff).scalar() or 0.0
            # Ranks
            rank_gen = sum(qr.rank.reward_amount for qr in db.query(UserQualifiedRank)
                           .filter(UserQualifiedRank.user_id == current_user.id, UserQualifiedRank.achieved_at <= cutoff).all() 
                           if qr.rank and qr.rank.reward_amount)
            
            total_earned_source = bin_gen + bin_global + uni_gen + spon_gen + pool_gen + rank_gen
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
        if day < 11: next_date = 11
        elif day < 21: next_date = 21
        else: next_date = "1 del próximo mes"
        
        msg = f"Liberación de fondos cerrada. Próxima fecha: día {next_date} a las 00:01."

    # Fetch bank details if verified
    bank_name = None
    bank_account_number = None
    bank_account_type = None
    
    if current_user.is_kyc_verified:
        from backend.database.models.compliance_record import ComplianceRecord
        record = db.query(ComplianceRecord).filter(ComplianceRecord.user_id == current_user.id).first()
        if record:
            bank_name = record.bank_name
            bank_account_number = record.bank_account_number
            bank_account_type = record.bank_account_type

    now_utc = datetime.utcnow()
    is_pin_locked = bool(current_user.pin_locked_until and current_user.pin_locked_until > now_utc)
    pin_locked_hours = max(1, math.ceil((current_user.pin_locked_until - now_utc).total_seconds() / 3600)) if is_pin_locked else 0

    # Calculate 24h P2P transfers sent by this user
    since_24h = now_utc - timedelta(hours=24)
    transferred_today_usd = float(
        db.query(func.sum(WalletTransfer.amount)).filter(
            WalletTransfer.sender_id == current_user.id,
            WalletTransfer.transfer_type == "p2p",
            WalletTransfer.status == "completed",
            WalletTransfer.created_at >= since_24h
        ).scalar() or 0.0
    )
    transferred_today_usd = round(transferred_today_usd, 2)
    remaining_daily_transfer_usd = round(max(0.0, P2P_DAILY_MAX_USD - transferred_today_usd), 2)

    verified_bal = float(f"{current_user.verified_balance or 0.0:.2f}")
    vault_bal = float(f"{current_user.bank_balance or 0.0:.2f}")
    avail_bal = float(f"{current_user.available_balance or 0.0:.2f}")

    return {
        "current_date": today.strftime("%Y-%m-%d"),
        "active_window": active_window,
        "available_to_release": float(f"{available_to_release:.2f}"),
        "bank_balance": verified_bal,
        "verified_balance": verified_bal,
        "vault_balance": vault_bal,
        "available_balance": avail_bal,
        "transferable_balance": float(f"{verified_bal + avail_bal:.2f}"),
        "min_withdrawal_usd": BANK_WITHDRAWAL_MINIMUM_USD,
        "min_transfer_usd": P2P_TRANSFER_MINIMUM_USD,
        "max_daily_transfer_usd": P2P_DAILY_MAX_USD,
        "transferred_today_usd": transferred_today_usd,
        "remaining_daily_transfer_usd": remaining_daily_transfer_usd,
        "kyc_verified": current_user.is_kyc_verified,
        "has_transaction_pin": bool(current_user.transaction_pin),
        "is_pin_locked": is_pin_locked,
        "pin_locked_hours": pin_locked_hours,
        "message": msg,
        "verified_bank_name": bank_name,
        "verified_bank_account_number": bank_account_number,
        "verified_bank_account_type": bank_account_type
    }

@router.post("/release")
def release_funds(
    data: ReleaseRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from fastapi import HTTPException
    current_user = db.query(User).filter(User.id == current_user.id).with_for_update().first()
    
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
        current_user.available_balance = max(0.0, (current_user.available_balance or 0.0) - amount)
        
        if window == "matrix":
            current_user.released_matrix = (current_user.released_matrix or 0.0) + amount
        elif window == "millionaire":
            current_user.released_millionaire = (current_user.released_millionaire or 0.0) + amount
        elif window == "general":
            current_user.released_general = (current_user.released_general or 0.0) + amount
            
        db.commit()
        
        return {"message": f"Se han liberado ${amount:,.2f} a tu Caja Fuerte.", "new_bank_balance": current_user.bank_balance}

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
    import math
    current_user = db.query(User).filter(User.id == current_user.id).with_for_update().first()

    # 0. Validación de Bloqueo por Intentos Fallidos de Segunda Clave (Máximo 3 intentos / 24 Horas)
    now_utc = datetime.utcnow()
    pin_locked_until = getattr(current_user, "pin_locked_until", None)
    if pin_locked_until and pin_locked_until > now_utc:
        remaining_seconds = (pin_locked_until - now_utc).total_seconds()
        remaining_hours = max(1, math.ceil(remaining_seconds / 3600))
        remaining_mins = max(1, math.ceil(remaining_seconds / 60))
        time_msg = f"{remaining_hours} hora(s)" if remaining_hours > 1 else f"{remaining_mins} minuto(s)"
        raise HTTPException(
            status_code=403,
            detail=f"Seguridad Activada: Tu función de retiros ha sido bloqueada temporalmente por registrar 3 intentos fallidos con tu Segunda Clave. Podrás intentar nuevamente en {time_msg}."
        )

    # Si el tiempo de bloqueo ya expiró, restablecer contador de intentos
    if pin_locked_until and pin_locked_until <= now_utc:
        current_user.pin_failed_attempts = 0
        current_user.pin_locked_until = None
        db.commit()

    from backend.routers.auth import pwd_context
    if not current_user.transaction_pin:
        raise HTTPException(status_code=400, detail="Debes configurar tu Segunda Clave de Retiros (PIN) en la sección de Seguridad antes de retirar.")
    if not data.pin or not data.pin.strip():
        raise HTTPException(status_code=400, detail="La Segunda Clave de Retiros es requerida para validar la transacción.")
    if not pwd_context.verify(data.pin.strip(), current_user.transaction_pin):
        failed_count = (getattr(current_user, "pin_failed_attempts", 0) or 0) + 1
        current_user.pin_failed_attempts = failed_count
        if failed_count >= 3:
            current_user.pin_locked_until = now_utc + timedelta(hours=24)
            db.commit()
            raise HTTPException(
                status_code=403,
                detail="Has superado el límite de 3 intentos fallidos con tu Segunda Clave. Por seguridad de tu cuenta, los retiros han sido bloqueados temporalmente por 24 horas."
            )
        else:
            attempts_left = 3 - failed_count
            db.commit()
            raise HTTPException(
                status_code=401,
                detail=f"Segunda Clave incorrecta. Te queda(n) {attempts_left} intento(s) antes de que la función de retiros sea bloqueada por 24 horas."
            )

    # Si la clave fue correcta, reiniciar contador de fallos
    if getattr(current_user, "pin_failed_attempts", 0):
        current_user.pin_failed_attempts = 0
        current_user.pin_locked_until = None
        db.commit()

    # 0. Date Validation
    today = datetime.now()
    day = today.day
    if not ((13 <= day <= 16) or (23 <= day <= 26) or (3 <= day <= 6)):
        raise HTTPException(
            status_code=400,
            detail=f"Las solicitudes de retiro solo están habilitadas en las ventanas: 13-16, 23-26 y 03-06. Hoy es día {day}."
        )

    # KYC Check
    if not current_user.is_kyc_verified:
        raise HTTPException(
            status_code=400, 
            detail="Debes verificar tu identidad (KYC) antes de solicitar un retiro. Sube tus documentos en 'Mi Perfil'."
        )

    # Minimum Amount Check ($11 USD / $49,500 COP)
    if round(data.amount, 2) < BANK_WITHDRAWAL_MINIMUM_USD:
        raise HTTPException(
            status_code=400, 
            detail=f"El monto mínimo de retiro a Banco Personal es de ${BANK_WITHDRAWAL_MINIMUM_USD:.2f} USD ($49.500 COP)."
        )

    # 1. Validate against BANK BALANCE (verified_balance) + Tiered System Usage Fee
    if data.amount <= 0:
        raise HTTPException(status_code=400, detail="El monto debe ser mayor a 0.")
        
    verified_bal = round(current_user.verified_balance or 0.0, 2)
    req_amount = round(data.amount, 2)
    system_fee_usd = _calculate_system_usage_fee_usd(req_amount)
    total_required_usd = round(req_amount + system_fee_usd, 2)

    if req_amount > verified_bal:
        raise HTTPException(status_code=400, detail=f"Saldo en Banco insuficiente (${verified_bal:.2f} USD). Asegúrate de tener los fondos en Banco listos para retirar.")

    try:
        # Si el usuario tiene saldo para cubrir monto + tarifa del sistema, se cobra la tarifa adicional.
        # Si el usuario ingresó exactamente todo su saldo disponible y no alcanza para la tarifa aparte,
        # se descuenta la tarifa del monto retirado para que pueda retirar el 100% de su saldo sin bloqueo.
        if total_required_usd <= verified_bal:
            actual_deduct = min(round(data.amount + system_fee_usd, 4), current_user.verified_balance or 0.0)
            withdrawal_amount = round(data.amount, 2)
        else:
            actual_deduct = current_user.verified_balance or 0.0
            withdrawal_amount = round(verified_bal - system_fee_usd, 2)
            if withdrawal_amount < BANK_WITHDRAWAL_MINIMUM_USD:
                raise HTTPException(
                    status_code=400,
                    detail=f"Saldo insuficiente para cubrir el monto de retiro (${req_amount:.2f} USD) más la tarifa de uso del sistema (+${system_fee_usd:.2f} USD). Total requerido: ${total_required_usd:.2f} USD."
                )
        
        # Deduct pending POS Cash commissions if user is a merchant
        from backend.database.models.merchant import Merchant
        from backend.database.models.physical_transaction import PhysicalTransaction
        
        merchant_profile = db.query(Merchant).filter(Merchant.user_id == current_user.id).first()
        if merchant_profile:
            pending_txs = db.query(PhysicalTransaction).filter(
                PhysicalTransaction.merchant_id == merchant_profile.id,
                PhysicalTransaction.status == "pending_merchant_payment"
            ).all()
            
            total_pending_cop = sum(tx.commission_amount for tx in pending_txs)
            total_pending_usd = total_pending_cop / 4500.0
            
            if total_pending_usd > 0:
                if withdrawal_amount >= total_pending_usd:
                    withdrawal_amount = round(withdrawal_amount - total_pending_usd, 2)
                    # Mark as paid
                    for tx in pending_txs:
                        tx.status = "paid_by_merchant"
                        tx.paid_at = datetime.now()
                else:
                    raise HTTPException(status_code=400, detail=f"Tu deuda de comisiones por ventas en efectivo (${total_pending_usd:.2f} USD) supera el monto que intentas retirar. Por favor liquida tu deuda primero o aumenta el monto de retiro.")

        # Deduct from verified_balance (Banco)
        current_user.verified_balance = max(0.0, round((current_user.verified_balance or 0.0) - actual_deduct, 4))
        
        # Fetch compliance record for verified bank details
        from backend.database.models.compliance_record import ComplianceRecord
        kyc_record = db.query(ComplianceRecord).filter(ComplianceRecord.user_id == current_user.id).first()
        
        verified_payment_info = ""
        if kyc_record and kyc_record.bank_name and kyc_record.bank_account_number:
            verified_payment_info = (
                f"Banco: {kyc_record.bank_name} | "
                f"Cuenta: {kyc_record.bank_account_type or 'Ahorros'} No. {kyc_record.bank_account_number} | "
                f"Titular: {current_user.name} | "
                f"NIT/CC: {kyc_record.rut_nit or current_user.document_id}"
            )
        else:
            verified_payment_info = data.payment_info or "Información bancaria no encontrada."

        if system_fee_usd > 0:
            verified_payment_info += f" | Tarifa uso sistema: ${system_fee_usd:.2f} USD"

        # Create Request
        req = WithdrawalRequest(
            user_id=current_user.id,
            amount=withdrawal_amount,
            source_type="bank_withdrawal",
            status="pending",
            payment_info=verified_payment_info
        )
        db.add(req)
        db.commit()
        
        fee_msg = f" (Tarifa de uso del sistema aplicada: +${system_fee_usd:.2f} USD)." if system_fee_usd > 0 else "."
        return {
            "message": f"Solicitud de retiro por ${withdrawal_amount:.2f} USD enviada exitosamente{fee_msg} Se encuentra en validación y se hará efectiva en tu cuenta en un plazo de hasta 24 horas.",
            "new_bank_balance": current_user.verified_balance,
            "system_fee_usd": system_fee_usd,
            "withdrawal_amount": withdrawal_amount
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

class WalletMsg(BaseModel):
    orderId: int
    pin: str
    payment_source: Optional[str] = None

@router.post("/pay-order")
def pay_order(
    payload: WalletMsg,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from fastapi import HTTPException
    from backend.routers.auth import pwd_context
    from backend.database.models.order import Order
    from backend.database.models.payment_transaction import PaymentTransaction
    from backend.mlm.services.payment_service import process_successful_payment

    import math
    current_user = db.query(User).filter(User.id == current_user.id).with_for_update().first()

    # 1. Verify PIN with 3-attempt 24h lockout
    now_utc = datetime.utcnow()
    pin_locked_until = getattr(current_user, "pin_locked_until", None)
    if pin_locked_until and pin_locked_until > now_utc:
        remaining_seconds = (pin_locked_until - now_utc).total_seconds()
        remaining_hours = max(1, math.ceil(remaining_seconds / 3600))
        raise HTTPException(
            status_code=403,
            detail=f"Seguridad Activada: Las transacciones con Segunda Clave están bloqueadas por 3 intentos fallidos. Intenta nuevamente en {remaining_hours} hora(s)."
        )
    if pin_locked_until and pin_locked_until <= now_utc:
        current_user.pin_failed_attempts = 0
        current_user.pin_locked_until = None
        db.commit()

    if not current_user.transaction_pin:
        raise HTTPException(status_code=400, detail="No tienes configurada tu Segunda Clave (PIN de Transacciones).")
    
    if not payload.pin or not pwd_context.verify(payload.pin.strip(), current_user.transaction_pin):
        failed_count = (getattr(current_user, "pin_failed_attempts", 0) or 0) + 1
        current_user.pin_failed_attempts = failed_count
        if failed_count >= 3:
            current_user.pin_locked_until = now_utc + timedelta(hours=24)
            db.commit()
            raise HTTPException(
                status_code=403,
                detail="Has superado el límite de 3 intentos fallidos con tu Segunda Clave. Por seguridad, las transacciones han sido bloqueadas por 24 horas."
            )
        attempts_left = 3 - failed_count
        db.commit()
        raise HTTPException(status_code=400, detail=f"Segunda Clave (PIN de transacciones) incorrecta. Te queda(n) {attempts_left} intento(s).")

    if getattr(current_user, "pin_failed_attempts", 0):
        current_user.pin_failed_attempts = 0
        current_user.pin_locked_until = None
        db.commit()

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
    amount_to_deduct = order.total_usd

    # SAFETY: Force recalculation if total_usd is missing or zero
    if amount_to_deduct <= 0 and order.total_cop > 0:
         amount_to_deduct = order.total_cop / 4500.0
    
    if amount_to_deduct <= 0:
         raise HTTPException(status_code=400, detail="Monto del pedido inválido (0 USD). Contacte soporte.")

    source = (payload.payment_source or getattr(order, "payment_method", "") or "wallet_bank").lower()
    loyalty_bal = float(current_user.purchase_balance or 0.0)
    verified_bal = float(current_user.verified_balance or 0.0)
    vault_bal = float(current_user.bank_balance or 0.0)

    if source in ["loyalty_bag", "bolsa_fidelizacion", "purchase_balance"]:
        if round(loyalty_bal, 2) < round(amount_to_deduct, 2):
            raise HTTPException(
                status_code=400,
                detail=f"Saldo insuficiente en Bolsa de Fidelización TEI. Tienes ${loyalty_bal:.2f} USD (${loyalty_bal*4500:,.0f} COP) y necesitas ${amount_to_deduct:.2f} USD (${amount_to_deduct*4500:,.0f} COP)."
            )
    else:
        total_usable = round(verified_bal + vault_bal + loyalty_bal, 2)
        if total_usable < round(amount_to_deduct, 2):
            raise HTTPException(status_code=400, detail=f"Saldo insuficiente en Banco TEI. Tienes ${total_usable:.2f} USD, necesitas ${amount_to_deduct:.2f} USD.")

    try:
        provider_used = "wallet_bank"
        if source in ["loyalty_bag", "bolsa_fidelizacion", "purchase_balance"]:
            current_user.purchase_balance = max(0.0, round(loyalty_bal - amount_to_deduct, 4))
            provider_used = "loyalty_bag"
        else:
            # 4. Deduct Balance (prioritize verified_balance, then bank_balance, then purchase_balance)
            if verified_bal >= amount_to_deduct:
                current_user.verified_balance = max(0.0, round(verified_bal - amount_to_deduct, 4))
            elif (verified_bal + vault_bal) >= amount_to_deduct:
                rem = round(amount_to_deduct - verified_bal, 4)
                current_user.verified_balance = 0.0
                current_user.bank_balance = max(0.0, round(vault_bal - rem, 4))
            else:
                rem = round(amount_to_deduct - verified_bal - vault_bal, 4)
                current_user.verified_balance = 0.0
                current_user.bank_balance = 0.0
                current_user.purchase_balance = max(0.0, round(loyalty_bal - rem, 4))
        
        # 5. Create Transaction Record
        tx = PaymentTransaction(
            order_id=order.id,
            provider=provider_used,
            amount=amount_to_deduct,
            currency="USD",
            status="approved",
            metadata_json={"deducted_usd": amount_to_deduct, "original_cop": order.total_cop, "source": provider_used}
        )
        db.add(tx)
        db.commit()
        db.refresh(tx)
        
        # 6. Process Payment (Trigger Commissions, Update Order Status)
        process_successful_payment(db, order.id, tx.id)
        
        return {
            "success": True,
            "message": "Pago realizado con éxito con Bolsa de Fidelización TEI." if provider_used == "loyalty_bag" else "Pago realizado con éxito.",
            "new_balance": current_user.verified_balance,
            "new_loyalty_balance": current_user.purchase_balance
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/debug-fix-currency")
def run_fix_currency_cleanup(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    """
    Temporary endpoint to fix currency commission issues.
    Admin only.
    """
    if not getattr(current_user, "is_admin", False): 
         raise HTTPException(status_code=403, detail="Admin only")
         
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
    if not getattr(current_user, "is_admin", False): 
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


# ==========================================
# RETENCIÓN EN LA FUENTE — ENDPOINTS USUARIO
# ==========================================

@router.get("/withholding/history")
def get_withholding_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Returns the full withholding deduction history for the current user."""
    records = db.query(WithholdingRecord).filter(
        WithholdingRecord.user_id == current_user.id
    ).order_by(WithholdingRecord.created_at.desc()).all()

    return [
        {
            "id": r.id,
            "fiscal_year": r.fiscal_year,
            "release_type": r.release_type,
            "gross_amount": r.gross_amount,
            "retefuente_pct": r.retefuente_pct,
            "retefuente_amount": r.retefuente_amount,
            "reteica_pct": r.reteica_pct,
            "reteica_amount": r.reteica_amount,
            "total_withheld": r.total_withheld,
            "net_amount": r.net_amount,
            "city": r.city,
            "country": r.country,
            "date": r.created_at,
        }
        for r in records
    ]


@router.get("/withholding/certificate/{year}")
def get_withholding_certificate(
    year: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns the annual withholding summary for the user.
    Available from January of the following fiscal year.
    Used by the frontend to render the downloadable certificate.
    """
    from datetime import datetime
    current_year = datetime.now().year

    # Certificate only available for completed fiscal years
    if year >= current_year:
        from fastapi import HTTPException
        raise HTTPException(
            status_code=400,
            detail=f"El certificado del año {year} estará disponible a partir de enero del {year + 1}."
        )

    records = db.query(WithholdingRecord).filter(
        WithholdingRecord.user_id == current_user.id,
        WithholdingRecord.fiscal_year == year
    ).order_by(WithholdingRecord.created_at.asc()).all()

    total_gross = sum(r.gross_amount for r in records)
    total_retefuente = sum(r.retefuente_amount for r in records)
    total_reteica = sum(r.reteica_amount for r in records)
    total_withheld = sum(r.total_withheld for r in records)
    total_net = sum(r.net_amount for r in records)

    return {
        "fiscal_year": year,
        "user": {
            "id": current_user.id,
            "name": current_user.name,
            "document_id": current_user.document_id,
            "email": current_user.email,
            "country": current_user.country,
            "city": current_user.city,
        },
        "company": {
            "name": "TEI S.A.S. — Tu Empresa Internacional",
            "nit": "902045325-4",
            "address": "Colombia",
        },
        "summary": {
            "total_gross_income": round(total_gross, 2),
            "total_retefuente": round(total_retefuente, 2),
            "total_reteica": round(total_reteica, 2),
            "total_withheld": round(total_withheld, 2),
            "total_net_received": round(total_net, 2),
        },
        "transactions": [
            {
                "date": r.created_at,
                "release_type": r.release_type,
                "gross_amount": r.gross_amount,
                "retefuente_pct": r.retefuente_pct,
                "retefuente_amount": r.retefuente_amount,
                "reteica_pct": r.reteica_pct,
                "reteica_amount": r.reteica_amount,
                "net_amount": r.net_amount,
            }
            for r in records
        ],
        "generated_at": datetime.now().isoformat(),
    }


# ==========================================
# AUTOMATED CASHFLOW CRON
# ==========================================

def _verify_cron_or_admin(
    request: __import__("fastapi").Request,
    current_user: Optional[User] = Depends(
        __import__("backend.utils.auth", fromlist=["get_current_user_optional"]).get_current_user_optional
    ),
):
    import os
    from fastapi import HTTPException
    cron_secret = os.getenv("CRON_SECRET")
    req_secret = request.headers.get("x-cron-secret")
    is_cloud_scheduler = request.headers.get("x-cloudscheduler") == "true" or "Google-Cloud-Scheduler" in request.headers.get("user-agent", "")
    is_admin = bool(current_user and getattr(current_user, "is_admin", False))
    if is_admin or is_cloud_scheduler or (cron_secret and req_secret == cron_secret):
        return True
    raise HTTPException(status_code=403, detail="Not authorized to run cron job")

@router.post("/cron/process-releases")
def cron_process_releases(db: Session = Depends(get_db), _auth: bool = Depends(_verify_cron_or_admin)):
    """
    Cron job para ejecutarse periódicamente (programado para los días 11, 21 y 01 a las 00:01).
    Procesa todas las comisiones pendientes y las transfiere a Caja Fuerte si es día 11, 21 o 01.
    Si el usuario tiene KYC y supera el mínimo, transfiere automáticamente de Caja Fuerte a Banco (cobrando impuestos).
    """
    today = datetime.now()
    day = today.day
    
    if day not in [11, 21, 1]:
        return {"message": f"Hoy es día {day}. No es fecha de corte (11, 21, 01). No hay acción requerida."}
        
    active_window = "matrix" if day == 11 else "millionaire" if day == 21 else "general"
    cutoff = datetime(today.year, today.month, day, 0, 1, 0)
    
    users = db.query(User).all()
    processed_count = 0
    auto_transferred = 0
    
    for current_user in users:
        # 1. Liberar a Caja Fuerte
        total_earned_source = 0.0
        already_released = 0.0
        
        if active_window == "matrix":
            total_earned_source = db.query(func.sum(MatrixCommission.amount))\
                .filter(MatrixCommission.user_id == current_user.id, MatrixCommission.created_at <= cutoff).scalar() or 0.0
            already_released = current_user.released_matrix or 0.0
                
        elif active_window == "millionaire":
            total_earned_source = db.query(func.sum(BinaryCommission.commission_amount))\
                .filter(BinaryCommission.user_id == current_user.id, 
                        BinaryCommission.type == 'millionaire_level_bonus',
                        BinaryCommission.created_at <= cutoff).scalar() or 0.0
            already_released = current_user.released_millionaire or 0.0
                        
        elif active_window == "general":
            bin_gen = db.query(func.sum(BinaryCommission.commission_amount))\
                .filter(BinaryCommission.user_id == current_user.id, 
                        BinaryCommission.type != 'millionaire_level_bonus',
                        BinaryCommission.created_at <= cutoff).scalar() or 0.0
            bin_global = db.query(func.sum(BinaryGlobalCommission.commission_amount))\
                .filter(BinaryGlobalCommission.user_id == current_user.id,
                        BinaryGlobalCommission.paid_at <= cutoff).scalar() or 0.0
            uni_gen = db.query(func.sum(UnilevelCommission.commission_amount))\
                .filter(UnilevelCommission.user_id == current_user.id,
                        UnilevelCommission.created_at <= cutoff).scalar() or 0.0
            spon_gen = db.query(func.sum(SponsorshipCommission.commission_amount))\
                .filter(SponsorshipCommission.sponsor_id == current_user.id,
                        SponsorshipCommission.created_at <= cutoff).scalar() or 0.0
            pool_gen = db.query(func.sum(GlobalPoolPayout.amount))\
                .filter(GlobalPoolPayout.user_id == current_user.id,
                        GlobalPoolPayout.created_at <= cutoff).scalar() or 0.0
            rank_gen = sum(qr.rank.reward_amount for qr in db.query(UserQualifiedRank)
                           .filter(UserQualifiedRank.user_id == current_user.id, UserQualifiedRank.achieved_at <= cutoff).all() 
                           if qr.rank and qr.rank.reward_amount)
            
            total_earned_source = bin_gen + bin_global + uni_gen + spon_gen + pool_gen + rank_gen
            already_released = current_user.released_general or 0.0

        available_to_release = total_earned_source - already_released
        if available_to_release < 0: available_to_release = 0
        
        available_to_release = min(available_to_release, current_user.available_balance or 0.0)
        
        if available_to_release > 0:
            current_user.bank_balance = round((current_user.bank_balance or 0.0) + available_to_release, 4)
            current_user.available_balance = max(0.0, round((current_user.available_balance or 0.0) - available_to_release, 4))
            
            if active_window == "matrix":
                current_user.released_matrix = (current_user.released_matrix or 0.0) + available_to_release
            elif active_window == "millionaire":
                current_user.released_millionaire = (current_user.released_millionaire or 0.0) + available_to_release
            elif active_window == "general":
                current_user.released_general = (current_user.released_general or 0.0) + available_to_release
            
            processed_count += 1

        # 2. Transferir a Banco automáticamente si cumple KYC y monto mínimo ($11 USD)
        if current_user.is_kyc_verified and round(current_user.bank_balance or 0, 2) >= BANK_TRANSFER_MINIMUM_USD:
            gross = round(current_user.bank_balance, 4)
            net_amount = _apply_withholding(db, current_user, gross, 'vault_to_bank', today.year)
            
            current_user.bank_balance = 0.0
            current_user.verified_balance = round((current_user.verified_balance or 0.0) + net_amount, 4)
            auto_transferred += 1

    try:
        db.commit()
    except Exception as e:
        db.rollback()
        return {"error": str(e)}

    return {
        "message": f"Cron ejecutado exitosamente para el día {day} ({active_window}).",
        "users_released_to_vault": processed_count,
        "users_auto_transferred_to_bank": auto_transferred
    }
from pydantic import BaseModel

class TransferCreate(BaseModel):
    recipient_identifier: str
    amount: float
    pin: str

def _find_target_user_by_identifier(db: Session, raw_query: str):
    q = (raw_query or "").strip()
    if not q:
        return None
    if q.startswith("@"):
        q = q[1:].strip()
    target = db.query(User).filter(func.lower(User.username) == q.lower()).first()
    if not target and q.isdigit():
        target = db.query(User).filter(User.id == int(q)).first()
    if not target:
        target = db.query(User).filter(User.document_id == q).first()
    if not target:
        target = db.query(User).filter(func.lower(User.email) == q.lower()).first()
    return target

@router.get("/lookup_user")
def lookup_user_for_transfer(query: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    from fastapi import HTTPException
    target_user = _find_target_user_by_identifier(db, query)
    
    if not target_user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado. Verifica el Usuario (username), Cédula, Correo o ID.")
    
    if target_user.id == current_user.id:
        raise HTTPException(status_code=400, detail="No puedes transferir saldo a tu propia cuenta.")
        
    return {
        "id": target_user.id,
        "username": target_user.username,
        "name": target_user.name or "Usuario TEI"
    }

@router.post("/transfer")
def process_wallet_transfer(
    data: TransferCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from fastapi import HTTPException
    from backend.routers.auth import pwd_context
    from backend.database.models.wallet_transfer import WalletTransfer
    import math
    current_user = db.query(User).filter(User.id == current_user.id).with_for_update().first()
    
    # 0. Validación de Bloqueo por Intentos Fallidos de Segunda Clave (Máximo 3 intentos / 24 Horas)
    now_utc = datetime.utcnow()
    pin_locked_until = getattr(current_user, "pin_locked_until", None)
    if pin_locked_until and pin_locked_until > now_utc:
        remaining_seconds = (pin_locked_until - now_utc).total_seconds()
        remaining_hours = max(1, math.ceil(remaining_seconds / 3600))
        remaining_mins = max(1, math.ceil(remaining_seconds / 60))
        time_msg = f"{remaining_hours} hora(s)" if remaining_hours > 1 else f"{remaining_mins} minuto(s)"
        raise HTTPException(
            status_code=403,
            detail=f"Seguridad Activada: Las transacciones y retiros están bloqueados temporalmente por registrar 3 intentos fallidos con tu Segunda Clave. Podrás intentar nuevamente en {time_msg}."
        )

    if pin_locked_until and pin_locked_until <= now_utc:
        current_user.pin_failed_attempts = 0
        current_user.pin_locked_until = None
        db.commit()

    if not current_user.transaction_pin:
        raise HTTPException(status_code=400, detail="Debes configurar tu Segunda Clave (Clave de Transacciones / PIN) en la sección de Seguridad primero.")
        
    if not data.pin or not data.pin.strip():
        raise HTTPException(status_code=400, detail="Debes ingresar tu Segunda Clave (Clave de Transacciones) para autorizar la transferencia.")

    if not pwd_context.verify(data.pin.strip(), current_user.transaction_pin):
        failed_count = (getattr(current_user, "pin_failed_attempts", 0) or 0) + 1
        current_user.pin_failed_attempts = failed_count
        if failed_count >= 3:
            current_user.pin_locked_until = now_utc + timedelta(hours=24)
            db.commit()
            raise HTTPException(
                status_code=403,
                detail="Has superado el límite de 3 intentos fallidos con tu Segunda Clave. Por seguridad, los retiros y transferencias han sido bloqueados por 24 horas."
            )
        else:
            attempts_left = 3 - failed_count
            db.commit()
            raise HTTPException(
                status_code=401,
                detail=f"Segunda Clave incorrecta. Te queda(n) {attempts_left} intento(s) antes del bloqueo de seguridad por 24 horas."
            )

    if getattr(current_user, "pin_failed_attempts", 0):
        current_user.pin_failed_attempts = 0
        current_user.pin_locked_until = None
        db.commit()

    if data.amount <= 0:
        raise HTTPException(status_code=400, detail="El monto debe ser mayor a cero.")

    req_amount = round(data.amount, 2)

    if req_amount < P2P_TRANSFER_MINIMUM_USD:
        raise HTTPException(
            status_code=400,
            detail=f"El monto mínimo para transferir entre usuarios de la plataforma es de ${P2P_TRANSFER_MINIMUM_USD:.2f} USD ($13.500 COP)."
        )

    if req_amount > P2P_DAILY_MAX_USD:
        raise HTTPException(
            status_code=400,
            detail=f"El límite máximo por transacción y diario entre usuarios es de ${P2P_DAILY_MAX_USD:.2f} USD ($2.700.000 COP)."
        )

    # Validar tope acumulado diario (últimas 24 horas)
    since_24h = now_utc - timedelta(hours=24)
    transferred_last_24h = float(
        db.query(func.sum(WalletTransfer.amount)).filter(
            WalletTransfer.sender_id == current_user.id,
            WalletTransfer.transfer_type == "p2p",
            WalletTransfer.status == "completed",
            WalletTransfer.created_at >= since_24h
        ).scalar() or 0.0
    )
    remaining_daily_usd = round(max(0.0, P2P_DAILY_MAX_USD - transferred_last_24h), 2)
    if round(transferred_last_24h + req_amount, 2) > P2P_DAILY_MAX_USD:
        remaining_cop = int(round(remaining_daily_usd * COP_EXCHANGE_RATE))
        raise HTTPException(
            status_code=400,
            detail=(
                f"Superas el límite máximo diario de transferencias entre usuarios ($600.00 USD / $2.700.000 COP). "
                f"Hoy ya has transferido ${transferred_last_24h:.2f} USD. "
                f"Tu cupo disponible por hoy es de ${remaining_daily_usd:.2f} USD (${remaining_cop:,} COP)."
            )
        )
        
    target_user = _find_target_user_by_identifier(db, data.recipient_identifier)
        
    if not target_user:
        raise HTTPException(status_code=404, detail="Usuario destinatario no encontrado.")
        
    if target_user.id == current_user.id:
        raise HTTPException(status_code=400, detail="No puedes transferir saldo a ti mismo.")
        
    sender_verified = round(current_user.verified_balance or 0.0, 4)
    sender_available = round(current_user.available_balance or 0.0, 4)
    total_transferable = round(sender_verified + sender_available, 2)

    system_fee_usd = _calculate_system_usage_fee_usd(req_amount)
    total_to_deduct = round(data.amount + system_fee_usd, 4)
    total_required_rounded = round(req_amount + system_fee_usd, 2)

    if total_transferable < total_required_rounded:
        if system_fee_usd > 0:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"Saldo insuficiente para cubrir el monto a transferir (${req_amount:.2f} USD) "
                    f"más la tarifa de uso del sistema (+${system_fee_usd:.2f} USD). "
                    f"Total requerido: ${total_required_rounded:.2f} USD | Disponible: ${total_transferable:.2f} USD."
                )
            )
        raise HTTPException(
            status_code=400,
            detail=f"Saldo insuficiente para transferir. Tienes ${total_transferable:.2f} USD disponible."
        )
        
    # Deduct total_to_deduct (monto + tarifa de uso del sistema) from Banco (verified_balance) first, then available_balance if needed
    if round(sender_verified, 2) >= total_required_rounded:
        actual_deduct = min(total_to_deduct, sender_verified)
        current_user.verified_balance = max(0.0, round(sender_verified - actual_deduct, 4))
    else:
        remainder = round(total_to_deduct - sender_verified, 4)
        current_user.verified_balance = 0.0
        current_user.available_balance = max(0.0, round(sender_available - remainder, 4))

    # Credit recipient's Banco (verified_balance) with the exact amount sent (recipient receives 100%)
    target_user.verified_balance = round((target_user.verified_balance or 0.0) + data.amount, 4)
    
    # Record transfer
    transfer_record = WalletTransfer(
        sender_id=current_user.id,
        recipient_id=target_user.id,
        amount=round(data.amount, 2),
        status="completed",
        transfer_type="p2p"
    )
    db.add(transfer_record)
    db.commit()
    db.refresh(transfer_record)
    
    fee_text = f" (Tarifa de uso del sistema: +${system_fee_usd:.2f} USD)" if system_fee_usd > 0 else ""
    return {
        "success": True, 
        "message": f"Transferencia de ${data.amount:.2f} USD a @{target_user.username} completada con éxito{fee_text}.",
        "new_balance": current_user.verified_balance,
        "system_fee_usd": system_fee_usd,
        "total_deducted_usd": total_required_rounded
    }
from datetime import timedelta

@router.get("/transfers/history")
def get_transfer_history(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    from backend.database.models.wallet_transfer import WalletTransfer
    
    transfers = db.query(WalletTransfer, User.username).outerjoin(
        User, (User.id == WalletTransfer.recipient_id) | (User.id == WalletTransfer.sender_id)
    ).filter(
        (WalletTransfer.sender_id == current_user.id) | (WalletTransfer.recipient_id == current_user.id)
    ).order_by(WalletTransfer.created_at.desc()).limit(100).all()
    
    # We need to properly map the username of the counterparty
    results = []
    for tx, counterparty_username in transfers: # This query might not map perfectly, doing it safely:
        pass
        
    # Safe query:
    all_txs = db.query(WalletTransfer).filter(
        (WalletTransfer.sender_id == current_user.id) | (WalletTransfer.recipient_id == current_user.id)
    ).order_by(WalletTransfer.created_at.desc()).limit(100).all()
    
    for tx in all_txs:
        is_sender = tx.sender_id == current_user.id
        counterparty_id = tx.recipient_id if is_sender else tx.sender_id
        counterparty = db.query(User).filter(User.id == counterparty_id).first()
        
        results.append({
            "id": tx.id,
            "type": "transfer_sent" if is_sender else "transfer_received",
            "amount": tx.amount,
            "date": tx.created_at.isoformat(),
            "counterparty": counterparty.username if counterparty else "Unknown",
            "status": tx.status
        })
        
    return results

@router.post("/cron/cleanup-history")
def cleanup_transaction_history(db: Session = Depends(get_db), _auth: bool = Depends(_verify_cron_or_admin)):
    from backend.database.models.wallet_transfer import WalletTransfer
    import datetime
    
    cutoff_date = datetime.datetime.utcnow() - datetime.timedelta(days=365)
    
    # Delete wallet transfers older than 365 days
    deleted_count = db.query(WalletTransfer).filter(WalletTransfer.created_at < cutoff_date).delete()
    db.commit()
    
    return {"success": True, "deleted_transfers": deleted_count}
from pydantic import BaseModel

class POSRequestCreate(BaseModel):
    customer_identifier: str
    amount: float

class POSApproveRequest(BaseModel):
    pin: str


from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError

pos_oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

def get_pos_merchant_user_id(token: str = Depends(pos_oauth2_scheme), db: Session = Depends(get_db)) -> int:
    from backend.utils.auth import SECRET_KEY, ALGORITHM
    from backend.database.models.merchant import Merchant
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        from fastapi import HTTPException
        raise HTTPException(status_code=401, detail="Invalid token")
        
    role = payload.get("role")
    if role == "merchant":
        merchant_id = payload.get("merchant_id")
        merchant = db.query(Merchant).filter(Merchant.id == merchant_id).first()
        from fastapi import HTTPException
        if not merchant or not merchant.user_id:
            raise HTTPException(status_code=401, detail="Merchant not found or not linked to user")
        return merchant.user_id
        
    user_id = payload.get("user_id")
    if user_id:
        return user_id
        
    from fastapi import HTTPException
    raise HTTPException(status_code=401, detail="Invalid token payload")

@router.post("/pos/request")
def create_pos_request(
    data: POSRequestCreate,
    db: Session = Depends(get_db),
    merchant_user_id: int = Depends(get_pos_merchant_user_id)
):
    from fastapi import HTTPException
    from backend.database.models.payment_request import PaymentRequest
    
    # Must be a merchant/driver (Implicitly verified by auth dependency or by the fact they have access)
        
    if data.amount <= 0:
        raise HTTPException(status_code=400, detail="Monto inválido.")
        
    target_user = None
    if data.customer_identifier.isdigit():
        target_user = db.query(User).filter(User.id == int(data.customer_identifier)).first()
    if not target_user:
        target_user = db.query(User).filter(User.username == data.customer_identifier).first()
        
    if not target_user:
        raise HTTPException(status_code=404, detail="Cliente no encontrado.")
        
    req = PaymentRequest(
        merchant_id=merchant_user_id,
        customer_id=target_user.id,
        amount=data.amount,
        status="pending"
    )
    db.add(req)
    db.commit()
    db.refresh(req)
    
    return {"success": True, "request_id": req.id}

@router.get("/pos/status/{req_id}")
def check_pos_status(req_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    from fastapi import HTTPException
    from backend.database.models.payment_request import PaymentRequest
    
    req = db.query(PaymentRequest).filter(PaymentRequest.id == req_id, PaymentRequest.merchant_id == current_user.id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Solicitud no encontrada.")
        
    return {"status": req.status}

@router.get("/pos/pending")
def get_pending_pos_requests(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    from backend.database.models.payment_request import PaymentRequest
    reqs = db.query(PaymentRequest).filter(PaymentRequest.customer_id == current_user.id, PaymentRequest.status == "pending").all()
    
    results = []
    for r in reqs:
        merchant = db.query(User).filter(User.id == r.merchant_id).first()
        results.append({
            "id": r.id,
            "merchant_name": merchant.name or merchant.username,
            "amount": r.amount,
            "date": r.created_at.isoformat()
        })
    return results

@router.post("/pos/approve/{req_id}")
def approve_pos_request(
    req_id: int,
    data: POSApproveRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from fastapi import HTTPException
    from backend.routers.auth import pwd_context
    from backend.database.models.payment_request import PaymentRequest
    from backend.database.models.wallet_transfer import WalletTransfer
    from backend.database.models.merchant import Merchant
    
    req = db.query(PaymentRequest).filter(PaymentRequest.id == req_id, PaymentRequest.customer_id == current_user.id).first()
    if not req or req.status != "pending":
        raise HTTPException(status_code=404, detail="Solicitud no válida o ya procesada.")
        
    import math
    current_user = db.query(User).filter(User.id == current_user.id).with_for_update().first()
    now_utc = datetime.utcnow()
    pin_locked_until = getattr(current_user, "pin_locked_until", None)
    if pin_locked_until and pin_locked_until > now_utc:
        remaining_hours = max(1, math.ceil((pin_locked_until - now_utc).total_seconds() / 3600))
        raise HTTPException(status_code=403, detail=f"Seguridad Activada: Transacciones bloqueadas por 3 intentos fallidos. Intenta en {remaining_hours} hora(s).")
    if pin_locked_until and pin_locked_until <= now_utc:
        current_user.pin_failed_attempts = 0
        current_user.pin_locked_until = None
        db.commit()

    if not current_user.transaction_pin:
        raise HTTPException(status_code=400, detail="Debes configurar tu Clave de Transacciones (PIN) en Seguridad primero.")
        
    if not data.pin or not pwd_context.verify(data.pin.strip(), current_user.transaction_pin):
        failed_count = (getattr(current_user, "pin_failed_attempts", 0) or 0) + 1
        current_user.pin_failed_attempts = failed_count
        if failed_count >= 3:
            current_user.pin_locked_until = now_utc + timedelta(hours=24)
            db.commit()
            raise HTTPException(status_code=403, detail="Has superado el límite de 3 intentos fallidos con tu Segunda Clave. Bloqueo por 24 horas activado.")
        db.commit()
        raise HTTPException(status_code=401, detail=f"Clave de transacciones incorrecta. Te queda(n) {3 - failed_count} intento(s).")

    if getattr(current_user, "pin_failed_attempts", 0):
        current_user.pin_failed_attempts = 0
        current_user.pin_locked_until = None
        db.commit()
        
    if (current_user.available_balance or 0.0) < req.amount:
        raise HTTPException(status_code=400, detail="Saldo insuficiente.")
        
    merchant_user = db.query(User).filter(User.id == req.merchant_id).first()
    merchant_profile = db.query(Merchant).filter(Merchant.user_id == req.merchant_id).first()
    
    commission_margin = getattr(merchant_profile, 'commission_margin', 20.0) if merchant_profile else 20.0
    tei_commission = req.amount * (commission_margin / 100.0)
    net_amount = req.amount - tei_commission
    
    # Update balances
    current_user.available_balance -= req.amount
    if not merchant_user.available_balance: merchant_user.available_balance = 0.0
    merchant_user.available_balance += net_amount
    
    req.status = "approved"
    
    # Record transfer in history
    transfer_record = WalletTransfer(
        sender_id=current_user.id,
        recipient_id=merchant_user.id,
        amount=req.amount,
        status="completed",
        transfer_type="pos_payment"
    )
    db.add(transfer_record)
    db.commit()
    
    return {"success": True, "message": "Pago exitoso"}

@router.post("/pos/reject/{req_id}")
def reject_pos_request(
    req_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from fastapi import HTTPException
    from backend.database.models.payment_request import PaymentRequest
    
    req = db.query(PaymentRequest).filter(PaymentRequest.id == req_id, PaymentRequest.customer_id == current_user.id).first()
    if not req or req.status != "pending":
        raise HTTPException(status_code=404, detail="Solicitud no válida o ya procesada.")
        
    req.status = "rejected"
    db.commit()
    return {"success": True, "message": "Solicitud rechazada"}
