from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from backend.database.connection import get_db
from backend.mlm.services.binary_millionaire_service import register_in_millionaire, distribute_millionaire_commissions
from backend.database.models.binary_millionaire import BinaryMillionaireMember

router = APIRouter(prefix="/api/millionaire", tags=["Millionaire Binary"])

class JoinRequest(BaseModel):
    user_id: int
    amount: float # Cost of entry/package

@router.post("/join")
def join_millionaire(payload: JoinRequest, db: Session = Depends(get_db)):
    """Join the Millionaire Binary Plan.
    1. Places user in the Global 2x2 tree.
    2. Distributes commissions to upline (Levels 1-27).
    """
    try:
        member = register_in_millionaire(db, payload.user_id)
        distribute_millionaire_commissions(db, member, payload.amount)
        return {
            "message": "Joined Millionaire Plan successfully",
            "global_position": member.global_position
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/tree/{user_id}")
def get_millionaire_tree(user_id: int, db: Session = Depends(get_db)):
    """Get the immediate 2x2 structure for a user."""
    root = db.query(BinaryMillionaireMember).filter(BinaryMillionaireMember.user_id == user_id).first()
    if not root:
        return {"error": "User not found in Millionaire Plan"}
    
    def build_tree(node, depth=0):
        if depth > 2: return None
        children = db.query(BinaryMillionaireMember).filter(BinaryMillionaireMember.upline_id == node.id).all()
        return {
            "user_id": node.user_id,
            "position": node.position,
            "children": [build_tree(c, depth+1) for c in children]
        }

    return build_tree(root)
