from __future__ import annotations
from datetime import datetime
from decimal import Decimal
from typing import Optional, Dict, List, Any
from collections import defaultdict

from backend.mlm.schemas.plan import MatrixPlan, MatrixLevel, OneTimeBonus


class MatrixService:
    """Service implementing core operations for a forced matrix plan.

    This is an in-memory, testable implementation intended to be wired to your
    actual DB models later. It supports:
    - loading a MatrixPlan instance
    - buying a matrix (entry or re-entry)
    - enforcing monthly/yearly limits per matrix
    - applying one-time bonuses and rank-up rules
    - collecting generated commissions as a simple list
    """

    def __init__(self, plan: MatrixPlan):
        self.plan = plan
        # user_id -> list of purchases: dict{matrix_id, timestamp, is_reentry}
        self.purchases: Dict[int, List[Dict[str, Any]]] = defaultdict(list)
        # user_id -> rank
        self.ranks: Dict[int, str] = {}
        # collected commissions emitted by service (for tests / review)
        self.commissions: List[Dict[str, Any]] = []

    def _find_level(self, matrix_id: int) -> Optional[MatrixLevel]:
        for m in self.plan.matrices:
            if m.id == matrix_id:
                return m
        return None

    def _count_in_month(self, user_id: int, matrix_id: int, ts: datetime) -> int:
        month = ts.month
        year = ts.year
        return sum(1 for p in self.purchases[user_id]
                   if p["matrix_id"] == matrix_id and p["timestamp"].year == year and p["timestamp"].month == month)

    def _count_in_year(self, user_id: int, matrix_id: int, ts: datetime) -> int:
        year = ts.year
        return sum(1 for p in self.purchases[user_id]
                   if p["matrix_id"] == matrix_id and p["timestamp"].year == year)

    def get_user_rank(self, user_id: int) -> str:
        return self.ranks.get(user_id, self.plan.qualification.get("default_rank", "Consumer"))

    def buy_matrix(self, user_id: int, matrix_id: int, timestamp: Optional[datetime] = None, is_reentry: bool = False) -> Dict[str, Any]:
        """Process a purchase of a matrix level.

        Returns a dict with keys: ok (bool), message (str), bonuses (list), rank_up (bool)
        """
        ts = timestamp or datetime.utcnow()
        level = self._find_level(matrix_id)
        if level is None:
            return {"ok": False, "message": "matrix_not_found"}

        # enforce monthly limit if present
        if level.monthly_limit is not None:
            c = self._count_in_month(user_id, matrix_id, ts)
            if c >= (level.monthly_limit or 0):
                return {"ok": False, "message": "monthly_limit_exceeded"}

        # enforce yearly limit if present
        if level.yearly_limit is not None:
            c = self._count_in_year(user_id, matrix_id, ts)
            if c >= (level.yearly_limit or 0):
                return {"ok": False, "message": "yearly_limit_exceeded"}

        # record purchase
        self.purchases[user_id].append({"matrix_id": matrix_id, "timestamp": ts, "is_reentry": is_reentry})

        bonuses = []
        # apply one-time bonus if defined
        if level.one_time_bonus:
            ob: OneTimeBonus = level.one_time_bonus
            bonus_amount: Decimal = ob.amount
            bonuses.append({"type": "one_time_bonus", "amount": bonus_amount, "description": ob.description})
            # record commission emission
            self.commissions.append({"user_id": user_id, "amount": bonus_amount, "reason": "one_time_bonus", "matrix_id": matrix_id})

        rank_changed = False
        if level.rank_up:
            current_rank = self.get_user_rank(user_id)
            # compare using the alias names from RankUp (from/to)
            if hasattr(level.rank_up, "from_rank") and current_rank == level.rank_up.from_rank:
                self.ranks[user_id] = level.rank_up.to_rank
                rank_changed = True

        return {"ok": True, "message": "purchased", "bonuses": bonuses, "rank_up": rank_changed}

    def get_user_purchases(self, user_id: int) -> List[Dict[str, Any]]:
        return list(self.purchases.get(user_id, []))

    def get_commissions(self) -> List[Dict[str, Any]]:
        return list(self.commissions)
