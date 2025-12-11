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
from backend.database.models.global_pool import GlobalPoolCommission
from backend.database.models.sponsorship import SponsorshipCommission
# from backend.database.models.binary import BinaryCommission
# from backend.database.models.binary_millionaire import MillionaireCommission
from backend.database.models.unilevel import UnilevelCommission
# from backend.database.models.forced_matrix import MatrixReward
from backend.database.models.special_bonuses import SpecialBonus, TravelBonus, BonusType, BonusStatus

router = APIRouter(prefix="/wallet", tags=["Wallet"])

@router.get("/summary")
def get_wallet_summary(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
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

    # 2. Binary Global Commissions (temporarily disabled)
    binary_total = 0
    binary_data = []
    binary_commissions = []
    # binary_commissions = db.query(BinaryCommission).filter(BinaryCommission.user_id == user.id).all()
    # binary_total = sum(c.commission_amount for c in binary_commissions)
    # binary_data = [{
    #     "amount": c.commission_amount,
    #     "type": c.commission_type,
    #     "level": c.level,
    #     "date": c.created_at
    # } for c in binary_commissions]

    # 3. Binary Millionaire Commissions (temporarily disabled)
    millionaire_total = 0
    millionaire_data = []
    millionaire_commissions = []
    # millionaire_commissions = db.query(MillionaireCommission).filter(MillionaireCommission.user_id == user.id).all()
    # millionaire_total = sum(c.commission_amount for c in millionaire_commissions)
    # millionaire_data = [{
    #     "amount": c.commission_amount,
    #     "level": c.level,
    #     "date": c.created_at
    # } for c in millionaire_commissions]

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

    # 6. Forced Matrix Rewards (temporarily disabled)
    matrix_total = 0
    matrix_data = []
    matrix_rewards = []
    # matrix_rewards = db.query(MatrixReward).filter(MatrixReward.user_id == user.id).all()
    # matrix_total = sum(r.reward_amount for r in matrix_rewards)
    # matrix_data = [{
    #     "amount": r.reward_amount,
    #     "matrix_level": r.matrix_level,
    #     "reward_type": r.reward_type,
    #     "date": r.created_at
    # } for r in matrix_rewards]

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
    pool_commissions = db.query(GlobalPoolCommission).filter(GlobalPoolCommission.user_id == user.id).all()
    pool_total = sum(pc.amount for pc in pool_commissions)
    pool_data = [{
        "amount": pc.amount,
        "rank": pc.rank_name,
        "period": pc.period,
        "date": pc.created_at
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
                "count": len(binary_commissions)
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
                "count": len(matrix_rewards)
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
