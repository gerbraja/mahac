from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from backend.database.models.unilevel import UnilevelMember, UnilevelCommission
from backend.database.models.user import User

def process_monthly_closing(db: Session):
    """
    Executes the Monthly Closing process (e.g., on the 27th).
    
    Logic:
    1. Identify the period (e.g., current month).
    2. For each user in the Unilevel Network:
       - Sum their total 'unilevel' commissions earned in this period.
       - Calculate 50% Matching Bonus.
       - Pay this bonus to their Direct Sponsor.
    """
    
    # Define period: Start of current month to now
    now = datetime.utcnow()
    start_of_month = datetime(now.year, now.month, 1)
    
    # Get all Unilevel Members
    members = db.query(UnilevelMember).all()
    
    results = []
    
    for member in members:
        # 1. Calculate total unilevel earnings for this member in the period
        total_earnings = db.query(func.sum(UnilevelCommission.commission_amount)).filter(
            UnilevelCommission.user_id == member.user_id,
            UnilevelCommission.type == 'unilevel',
            UnilevelCommission.created_at >= start_of_month
        ).scalar() or 0.0
        
        if total_earnings > 0:
            # 2. Calculate Matching Bonus (50%)
            matching_bonus = float(total_earnings) * 0.50
            
            # 3. Calculate Crypto Loyalty Bonus (10%)
            crypto_bonus = float(total_earnings) * 0.10
            
            # 4. Find Sponsor
            if member.sponsor:
                sponsor_id = member.sponsor.user_id
                
                # 5. Create Commission Records
                
                # A) Matching Bonus (Fiat/Cash)
                comm_match = UnilevelCommission(
                    user_id=sponsor_id,
                    sale_amount=float(total_earnings),
                    commission_amount=matching_bonus,
                    level=1,
                    type="matching_monthly_closing",
                    created_at=now
                )
                db.add(comm_match)
                
                # B) Crypto Bonus (Tokens)
                comm_crypto = UnilevelCommission(
                    user_id=sponsor_id,
                    sale_amount=float(total_earnings),
                    commission_amount=crypto_bonus,
                    level=1,
                    type="crypto_bonus",
                    created_at=now
                )
                db.add(comm_crypto)
                
                # 6. Update Sponsor Balances
                sponsor_user = db.query(User).filter(User.id == sponsor_id).with_for_update().first()
                if sponsor_user:
                    # Update Fiat Balance
                    sponsor_user.available_balance = (sponsor_user.available_balance or 0.0) + matching_bonus
                    sponsor_user.monthly_earnings = (sponsor_user.monthly_earnings or 0.0) + matching_bonus
                    sponsor_user.total_earnings = (sponsor_user.total_earnings or 0.0) + matching_bonus
                    
                    # Update Crypto Balance
                    sponsor_user.crypto_balance = (sponsor_user.crypto_balance or 0.0) + crypto_bonus
                
                results.append({
                    "beneficiary_id": member.user_id,
                    "sponsor_id": sponsor_id,
                    "base_earnings": total_earnings,
                    "matching_bonus": matching_bonus,
                    "crypto_bonus": crypto_bonus
                })
    
    db.commit()
    return results

def process_global_pool(db: Session):
    """
    Calculate and distribute the Global Pool Bonus (10% of Global PV).
    7% of the Pool is shared among each Diamond Rank level.
    """
    from backend.database.models.order import Order
    from backend.database.models.qualified_rank import QualifiedRank, UserQualifiedRank
    from backend.database.models.global_pool import GlobalPoolCommission
    from backend.database.models.user import User
    from sqlalchemy import func
    from datetime import datetime, timedelta

    now = datetime.utcnow()
    start_date = now - timedelta(days=30) # Rough approximation
    
    # Sum PV of paid orders
    total_pv = db.query(func.sum(Order.total_pv)).filter(
        Order.status == "paid",
        Order.created_at >= start_date
    ).scalar() or 0.0
    
    pool_amount = total_pv * 0.10 # 10% of Global PV
    
    results = {
        "total_pv": total_pv,
        "pool_amount": pool_amount,
        "distributions": []
    }

    if pool_amount <= 0:
        return results

    # Distribute to Diamond Ranks
    diamond_ranks = [
        "Diamante", "Diamante Azul", "Diamante Rojo", "Diamante Negro", 
        "Diamante Corona", "Corona Azul", "Corona Roja", "Corona Negra"
    ]
    
    for rank_name in diamond_ranks:
        rank = db.query(QualifiedRank).filter(QualifiedRank.name == rank_name).first()
        if not rank:
            continue
            
        qualified_users = db.query(UserQualifiedRank).filter(UserQualifiedRank.rank_id == rank.id).all()
        count = len(qualified_users)
        
        if count > 0:
            share_pool = pool_amount * 0.07 # 7% of the Pool
            amount_per_user = share_pool / count
            
            for uqr in qualified_users:
                comm = GlobalPoolCommission(
                    user_id=uqr.user_id,
                    amount=amount_per_user,
                    pool_total=pool_amount,
                    rank_name=rank_name,
                    period=now.strftime("%Y-%m")
                )
                db.add(comm)
                
                user = db.query(User).filter(User.id == uqr.user_id).with_for_update().first()
                if user:
                    user.total_earnings = (user.total_earnings or 0.0) + amount_per_user
                    user.available_balance = (user.available_balance or 0.0) + amount_per_user
            
            results["distributions"].append({
                "rank": rank_name,
                "count": count,
                "share_pool": share_pool,
                "amount_per_user": amount_per_user
            })
    
    db.commit()
    return results
