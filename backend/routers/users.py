from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database.connection import get_db
from ..database.models.user import User as UserModel

router = APIRouter(prefix="/users", tags=["Usuarios"])


@router.get("/")
def list_users(db: Session = Depends(get_db)):
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
