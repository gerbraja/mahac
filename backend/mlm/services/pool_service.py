from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime
from backend.database.models.global_pool import GlobalPool, GlobalPoolDistribution, GlobalPoolPayout
from backend.database.models.user import User
from backend.database.models.qualified_rank import UserQualifiedRank, QualifiedRank

MASTER_POOL_NAME = "Master Pool"

def accumulate_global_pool(db: Session, amount: float):
    """
    Add 1% of the transaction amount to the Master Pool.
    Amount should be the Total Sales (Gross) of the order.
    """
    contribution = amount * 0.01
    
    pool = db.query(GlobalPool).filter_by(name=MASTER_POOL_NAME).with_for_update().first()
    if not pool:
        # Auto-create if missing (safety net)
        pool = GlobalPool(name=MASTER_POOL_NAME, total_accumulated=0.0, current_balance=0.0)
        db.add(pool)
    
    pool.total_accumulated += contribution
    pool.current_balance += contribution
    db.add(pool)
    
    # We commit in the caller (payment_service) to keep it atomic with the order
    
    print(f"🌍 Global Pool: Added ${contribution} (1% of ${amount}) to {MASTER_POOL_NAME}. New Balance: ${pool.current_balance}")
    return contribution

def get_qualified_users_for_rank(db: Session, rank_name: str) -> list[User]:
    """
    Get all users who hold a specific rank.
    In a real system, this might check 'Active Qualification' for the month.
    For now, we check 'Lifetime Rank' via UserQualifiedRank.
    """
    # Join UserQualifiedRank -> QualifiedRank
    users = db.query(User).join(UserQualifiedRank).join(QualifiedRank).filter(
        QualifiedRank.name == rank_name
    ).all()
    return users

def distribute_monthly_pools(db: Session):
    """
    Distribute 7% of the Master Pool to each Leadership Rank (Diamond -> Crown Diamond Black).
    Condition: At least one qualified user must exist for the rank.
    """
    pool = db.query(GlobalPool).filter_by(name=MASTER_POOL_NAME).with_for_update().first()
    if not pool or pool.current_balance <= 0:
        print("Global Pool empty or missing. No distribution.")
        return

    # Snapshot of the pool balance at this moment
    # Logic: "1% del 100% del Pozo"
    # Does this mean 1% of the CURRENT balance? Yes.
    base_pool_amount = pool.current_balance
    
    ranks_to_distribute = [
        "Diamante", 
        "Diamante Azul", 
        "Diamante Rojo", 
        "Diamante Negro",
        "Diamante Corona",
        "Diamante Corona Azul",
        "Diamante Corona Rojo",
        "Diamante Corona Negro"
    ]
    
    total_deducted = 0.0
    
    for rank in ranks_to_distribute:
        # Calculate 7% share of the Master Pool
        share_amount = base_pool_amount * 0.07 
        
        # Find Qualified Users
        # Optimization: verify actual rank names in DB match these strings
        candidates = get_qualified_users_for_rank(db, rank)
        
        if not candidates:
            print(f"Skipping {rank}: No qualified members.")
            continue
            
        count = len(candidates)
        amount_per_user = share_amount / count
        
        print(f"Distributing ${share_amount} (7%) to {count} {rank}s (${amount_per_user} each)")
        
        # Record Distribution
        dist_record = GlobalPoolDistribution(
            pool_id=pool.id,
            rank_name=rank,
            total_distributed=share_amount,
            amount_per_user=amount_per_user,
            user_count=count
        )
        db.add(dist_record)
        db.flush() # get ID
        
        # Payout
        for user in candidates:
            # Update Balance
            # Access user via ID re-query to lock if needed, or trust the object from previous query if session open
            # Safer to refetch with lock if high concurrency, but batch update here is fine for now
            u = db.query(User).filter(User.id == user.id).with_for_update().first()
            
            u.available_balance = (u.available_balance or 0.0) + amount_per_user
            u.total_earnings = (u.total_earnings or 0.0) + amount_per_user
            u.monthly_earnings = (u.monthly_earnings or 0.0) + amount_per_user
            
            # Audit Payout
            payout = GlobalPoolPayout(
                distribution_id=dist_record.id,
                user_id=u.id,
                amount=amount_per_user
            )
            db.add(payout)
        
        total_deducted += share_amount

    # Update Pool Balance
    if total_deducted > 0:
        pool.current_balance -= total_deducted
        db.add(pool)
        db.commit()
        print(f"Global Pool Distribution Complete. Deducted: ${total_deducted}. Remaining: ${pool.current_balance}")
    else:
        print("No distributions made (no qualified ranks).")
        
