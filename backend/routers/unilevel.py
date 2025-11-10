from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List
from sqlalchemy.orm import Session
from backend.database.connection import get_db
from backend.mlm.services.unilevel_service import calculate_unilevel_commissions

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
