from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from pathlib import Path

from backend.database.connection import get_db
from backend.mlm.services.matrix_service import MatrixService
from backend.mlm.services.plan_loader import load_plan_from_file
from backend.database.models.matrix import MatrixMember, MatrixCommission

router = APIRouter(prefix="/api/matrix", tags=["Matrix"])

# Load the plan once at startup (or lazy load)
PLAN_PATH = Path("backend/mlm/plans/matriz_forzada/plan_template.yml")
_matrix_service: Optional[MatrixService] = None

def get_matrix_service() -> MatrixService:
    global _matrix_service
    if _matrix_service is None:
        if not PLAN_PATH.exists():
            raise RuntimeError(f"Matrix plan file not found at {PLAN_PATH}")
        ok, plan = load_plan_from_file(PLAN_PATH)
        if not ok:
            raise RuntimeError(f"Failed to load matrix plan: {plan}")
        _matrix_service = MatrixService(plan)
    return _matrix_service

class BuyMatrixRequest(BaseModel):
    user_id: int
    matrix_id: int
    is_reentry: bool = False

@router.post("/buy", response_model=Dict[str, Any])
def buy_matrix_position(payload: BuyMatrixRequest, db: Session = Depends(get_db)):
    service = get_matrix_service()
    try:
        result = service.buy_matrix(db, payload.user_id, payload.matrix_id, is_reentry=payload.is_reentry)
        if not result.get("ok"):
            raise HTTPException(status_code=400, detail=result.get("message"))
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/tree/{user_id}/{matrix_id}")
def get_matrix_tree(user_id: int, matrix_id: int, db: Session = Depends(get_db)):
    """Return the matrix tree structure for visualization."""
    # Find the root node for this user in this matrix
    root = db.query(MatrixMember).filter(
        MatrixMember.user_id == user_id,
        MatrixMember.matrix_id == matrix_id
    ).first()

    if not root:
        return {"error": "User not found in this matrix"}

    def build_tree(node):
        children = db.query(MatrixMember).filter(MatrixMember.upline_id == node.id).order_by(MatrixMember.position).all()
        return {
            "id": node.id,
            "user_id": node.user_id,
            "position": node.position,
            "level": node.level,
            "children": [build_tree(child) for child in children]
        }

    return build_tree(root)

@router.get("/commissions/{user_id}")
def get_matrix_commissions(user_id: int, db: Session = Depends(get_db)):
    comms = db.query(MatrixCommission).filter(MatrixCommission.user_id == user_id).all()
    return [{
        "amount": c.amount,
        "reason": c.reason,
        "matrix_id": c.matrix_id,
        "created_at": c.created_at
    } for c in comms]

@router.get("/ranks/{user_id}")
def get_user_qualified_ranks(user_id: int, db: Session = Depends(get_db)):
    """Get the list of Qualified Ranks achieved by the user."""
    from backend.database.models.qualified_rank import UserQualifiedRank
    
    ranks = db.query(UserQualifiedRank).filter(UserQualifiedRank.user_id == user_id).all()
    return [{
        "rank_name": r.rank.name,
        "reward_amount": r.rank.reward_amount,
        "achieved_at": r.achieved_at,
        "matrix_id": r.rank.matrix_id_required
    } for r in ranks]
