from __future__ import annotations
from datetime import datetime
from decimal import Decimal
from typing import Optional, Dict, List, Any
from sqlalchemy.orm import Session
from sqlalchemy import func

from backend.mlm.schemas.plan import MatrixPlan, MatrixLevel, OneTimeBonus
from backend.database.models.matrix import MatrixMember, MatrixCommission
from backend.database.models.user import User
from backend.database.models.unilevel import UnilevelMember

class MatrixService:
    """Service implementing core operations for a forced matrix plan with DB persistence.
    
    Implements a 3x3 forced matrix with spillover.
    """

    def __init__(self, plan: MatrixPlan):
        self.plan = plan

    def _find_level(self, matrix_id: int) -> Optional[MatrixLevel]:
        for m in self.plan.matrices:
            if m.id == matrix_id:
                return m
        return None

    def _count_in_month(self, db: Session, user_id: int, matrix_id: int, ts: datetime) -> int:
        month = ts.month
        year = ts.year
        return db.query(MatrixMember).filter(
            MatrixMember.user_id == user_id,
            MatrixMember.matrix_id == matrix_id,
            func.extract('month', MatrixMember.created_at) == month,
            func.extract('year', MatrixMember.created_at) == year
        ).count()

    def _count_in_year(self, db: Session, user_id: int, matrix_id: int, ts: datetime) -> int:
        year = ts.year
        return db.query(MatrixMember).filter(
            MatrixMember.user_id == user_id,
            MatrixMember.matrix_id == matrix_id,
            func.extract('year', MatrixMember.created_at) == year
        ).count()

    def get_user_rank(self, db: Session, user_id: int) -> str:
        # In a real implementation, this might query a separate Rank model or User field.
        # For now, we return a default or fetch from User if implemented.
        # This is a placeholder as per original code structure.
        return self.plan.qualification.get("default_rank", "Consumer")

    def find_placement(self, db: Session, matrix_id: int, sponsor_user_id: int) -> Optional[MatrixMember]:
        """Find the first available spot in the sponsor's matrix (3x3 spillover)."""
        # 1. Find sponsor's node in this matrix
        sponsor_node = db.query(MatrixMember).filter(
            MatrixMember.user_id == sponsor_user_id,
            MatrixMember.matrix_id == matrix_id
        ).order_by(MatrixMember.created_at.asc()).first() # If multiple, take first (oldest)

        if not sponsor_node:
            # If sponsor not in matrix, try sponsor's sponsor (recursive)
            # For now, simplified: return None (will become a new root or handle upstream)
            # In a robust system, we walk up the Unilevel tree until we find someone in the matrix.
            return None

        # 2. BFS to find spot
        queue = [sponsor_node]
        while queue:
            current = queue.pop(0)
            
            # Get children count
            children_count = db.query(MatrixMember).filter(
                MatrixMember.upline_id == current.id
            ).count()

            if children_count < 3:
                return current # Found a parent with space
            
            # If full, add children to queue to search next level
            children = db.query(MatrixMember).filter(
                MatrixMember.upline_id == current.id
            ).order_by(MatrixMember.position.asc()).all()
            queue.extend(children)
        
        return None

    def buy_matrix(self, db: Session, user_id: int, matrix_id: int, timestamp: Optional[datetime] = None, is_reentry: bool = False) -> Dict[str, Any]:
        """Process a purchase of a matrix level."""
        ts = timestamp or datetime.utcnow()
        level_config = self._find_level(matrix_id)
        if level_config is None:
            return {"ok": False, "message": "matrix_not_found"}

        # enforce monthly limit
        if level_config.monthly_limit is not None:
            c = self._count_in_month(db, user_id, matrix_id, ts)
            if c >= (level_config.monthly_limit or 0):
                return {"ok": False, "message": "monthly_limit_exceeded"}

        # enforce yearly limit
        if level_config.yearly_limit is not None:
            c = self._count_in_year(db, user_id, matrix_id, ts)
            if c >= (level_config.yearly_limit or 0):
                return {"ok": False, "message": "yearly_limit_exceeded"}

        # Find placement
        # Get sponsor from Unilevel
        unilevel_member = db.query(UnilevelMember).filter(UnilevelMember.user_id == user_id).first()
        upline_node = None
        
        if unilevel_member and unilevel_member.sponsor:
             # Try to place under sponsor
             upline_node = self.find_placement(db, matrix_id, unilevel_member.sponsor.user_id)
        
        # If no upline found (orphan or root), upline_id remains None (new root)
        
        # Determine position (1, 2, 3)
        position = 1
        if upline_node:
            existing_siblings = db.query(MatrixMember).filter(MatrixMember.upline_id == upline_node.id).count()
            position = existing_siblings + 1

        # Create Member
        new_member = MatrixMember(
            user_id=user_id,
            matrix_id=matrix_id,
            upline_id=upline_node.id if upline_node else None,
            position=position,
            level=(upline_node.level + 1) if upline_node else 0,
            created_at=ts
        )
        db.add(new_member)
        db.flush() # Get ID

        bonuses = []
        # apply one-time bonus
        if level_config.one_time_bonus:
            ob = level_config.one_time_bonus
            bonus_amount = float(ob.amount)
            
            commission = MatrixCommission(
                user_id=user_id,
                matrix_id=matrix_id,
                amount=bonus_amount,
                reason="one_time_bonus",
                level_from=0
            )
            db.add(commission)
            bonuses.append({"type": "one_time_bonus", "amount": bonus_amount, "description": ob.description})
            
            # Update User Balance
            user = db.query(User).filter(User.id == user_id).first()
            if user:
                user.available_balance = (user.available_balance or 0.0) + bonus_amount
                user.total_earnings = (user.total_earnings or 0.0) + bonus_amount

        # Handle Rank Up (simplified)
        rank_changed = False
        
        # Check for Matrix Completion (Full 3x3 = 39 members)
        # We need to count descendants. This is expensive if done recursively every time.
        # For MVP, we can check if the current matrix level is filled.
        # Better approach: When a node is added, check its ancestors.
        # If an ancestor now has 39 descendants, they complete the matrix.
        
        # Let's implement a helper to check specific user completion
        self._check_and_award_rank(db, user_id, matrix_id)
        
        # Also check upline (since they gained a member)
        curr = upline_node
        while curr:
            self._check_and_award_rank(db, curr.user_id, matrix_id)
            curr = db.query(MatrixMember).filter(MatrixMember.id == curr.upline_id).first()

        db.commit()
        return {"ok": True, "message": "purchased", "bonuses": bonuses, "rank_up": rank_changed}

    def _check_and_award_rank(self, db: Session, user_id: int, matrix_id: int):
        """Check if user has filled their 2-level matrix (12 descendants) and award rank/cycle."""
        from backend.database.models.qualified_rank import QualifiedRank, UserQualifiedRank
        from backend.database.models.frozen_balance import FrozenBalance
        from datetime import timedelta
        
        # 1. Get user's node(s) in this matrix
        nodes = db.query(MatrixMember).filter(MatrixMember.user_id == user_id, MatrixMember.matrix_id == matrix_id).all()
        
        for node in nodes:
            # Check descendants
            count = self._count_descendants(db, node.id, max_depth=2)
            
            # 3x3 (2 levels) = 3 + 9 = 12 descendants
            if count >= 12:
                # Find corresponding rank configuration
                rank_config = db.query(QualifiedRank).filter(QualifiedRank.matrix_id_required == matrix_id).first()
                if rank_config:
                    # CHECK LIMITS
                    # Count how many times this user has cycled this matrix in the current period
                    now = datetime.utcnow()
                    
                    # Determine period (Month or Year)
                    # For simplicity, we'll check monthly limit if set, else yearly.
                    
                    cycles_count = 0
                    if rank_config.monthly_limit:
                        start_date = datetime(now.year, now.month, 1)
                        cycles_count = db.query(MatrixCommission).filter(
                            MatrixCommission.user_id == user_id,
                            MatrixCommission.matrix_id == matrix_id,
                            MatrixCommission.reason.like("Cycle Reward%"),
                            MatrixCommission.created_at >= start_date
                        ).count()
                        
                        if cycles_count >= rank_config.monthly_limit:
                            print(f"User {user_id} hit monthly limit ({rank_config.monthly_limit}) for Matrix {matrix_id}. No reward.")
                            continue # Skip reward, but maybe still advance? User said "Topes para los ciclos", usually implies stopping everything.
                            # Let's assume we skip reward AND advance/re-entry to prevent infinite loops or abuse.
                    
                    elif rank_config.yearly_limit:
                        start_date = datetime(now.year, 1, 1)
                        cycles_count = db.query(MatrixCommission).filter(
                            MatrixCommission.user_id == user_id,
                            MatrixCommission.matrix_id == matrix_id,
                            MatrixCommission.reason.like("Cycle Reward%"),
                            MatrixCommission.created_at >= start_date
                        ).count()
                        
                        if cycles_count >= rank_config.yearly_limit:
                            print(f"User {user_id} hit yearly limit ({rank_config.yearly_limit}) for Matrix {matrix_id}. No reward.")
                            continue

                    # AWARD REWARD (Cycle)
                    # 1. Award Qualified Rank (Idempotent - only if not exists)
                    existing_rank = db.query(UserQualifiedRank).filter_by(user_id=user_id, rank_id=rank_config.id).first()
                    if not existing_rank:
                        ur = UserQualifiedRank(user_id=user_id, rank_id=rank_config.id, achieved_at=now, reward_granted=True)
                        db.add(ur)
                    
                    # 2. Calculate Payout
                    cash_reward = rank_config.reward_amount
                    crypto_tokens = 0.0
                    is_split = False
                    
                    # Split Logic (Ruby+ or Reward >= 30000)
                    if rank_config.reward_amount >= 30000:
                        is_split = True
                        cash_reward = rank_config.reward_amount / 2
                        crypto_value_usd = rank_config.reward_amount / 2
                        token_price = 100.0 # 1 BDTEI = $100 USD
                        crypto_tokens = crypto_value_usd / token_price
                    
                    # 3. Create Commission Record (to track cycles)
                    comm = MatrixCommission(
                        user_id=user_id,
                        matrix_id=matrix_id,
                        amount=cash_reward, # Track cash amount
                        reason=f"Cycle Reward: {rank_config.name}",
                        level_from=0,
                        created_at=now
                    )
                    db.add(comm)

                    # 4. Update User Balance (Cash)
                    user = db.query(User).filter(User.id == user_id).with_for_update().first()
                    if user and cash_reward > 0:
                        user.purchase_balance = (user.purchase_balance or 0.0) + cash_reward
                    
                    # 5. Award Frozen Crypto (if split)
                    if is_split and crypto_tokens > 0:
                        frozen_until = now + timedelta(days=30*7) # 7 months
                        fb = FrozenBalance(
                            user_id=user_id,
                            amount=crypto_tokens,
                            token_value_at_freeze=100.0,
                            frozen_until=frozen_until,
                            reason=f"Rank Reward: {rank_config.name}",
                            status="locked"
                        )
                        db.add(fb)
                        print(f"User {user_id} earned {crypto_tokens} BDTEI (Frozen 7mo) for {rank_config.name}")

                    print(f"User {user_id} cycled Matrix {matrix_id} (Cycle {cycles_count+1}) and earned {rank_config.name} (${cash_reward} Cash)")

                    # 6. Advance & Re-entry (Only if we paid/cycled)
                    # Advance
                    next_matrix_id = matrix_id + 1 # Need better logic for non-sequential IDs?
                    # Using plan template logic would be better, but for now we rely on the seed data or sequential assumption?
                    # Actually, the IDs are NOT sequential (27, 77, 277).
                    # We need to look up the next matrix.
                    # We can query QualifiedRank to find the next one?
                    # Or just use the `next_matrix` field from the loaded plan.
                    
                    current_level = self._find_level(matrix_id)
                    if current_level and current_level.next_matrix:
                            print(f"User {user_id} advancing to Matrix {current_level.next_matrix}")
                            self.buy_matrix(db, user_id, current_level.next_matrix)

                    # Re-entry
                    if current_level and current_level.reentry_amount:
                            print(f"User {user_id} re-entering Matrix {matrix_id}")
                            self.buy_matrix(db, user_id, matrix_id, is_reentry=True)

    def _count_descendants(self, db: Session, parent_id: int, max_depth: int = 2) -> int:
        """Recursively count descendants up to max_depth."""
        if max_depth == 0:
            return 0
            
        children = db.query(MatrixMember).filter(MatrixMember.upline_id == parent_id).all()
        count = len(children)
        
        for child in children:
            count += self._count_descendants(db, child.id, max_depth - 1)
            
        return count

    def get_user_purchases(self, db: Session, user_id: int) -> List[Dict[str, Any]]:
        members = db.query(MatrixMember).filter(MatrixMember.user_id == user_id).all()
        return [{"matrix_id": m.matrix_id, "timestamp": m.created_at, "is_reentry": False} for m in members]

    def get_commissions(self, db: Session) -> List[Dict[str, Any]]:
        # For testing/admin
        comms = db.query(MatrixCommission).all()
        return [{"user_id": c.user_id, "amount": c.amount, "reason": c.reason, "matrix_id": c.matrix_id} for c in comms]

