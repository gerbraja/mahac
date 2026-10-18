from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database.connection import get_db
from ..database.models.user import User as UserModel
from ..utils.auth import get_current_user

router = APIRouter(prefix="/users", tags=["Usuarios"])


@router.get("/")
def list_users(db: Session = Depends(get_db), current_user: UserModel = Depends(get_current_user)):
    if not getattr(current_user, "is_admin", False):
        raise HTTPException(status_code=403, detail="Not authorized")
    users = db.query(UserModel).all()
    return [
        {
            "id": u.id,
            "name": u.name,
            "email": u.email,
            "monthly_earnings": u.monthly_earnings,
            "total_earnings": u.total_earnings,
            "available_balance": u.available_balance,
            "crypto_balance": u.crypto_balance,
        }
        for u in users
    ]

