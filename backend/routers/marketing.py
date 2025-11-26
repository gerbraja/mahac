from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from backend.database.connection import get_db
from backend.database.models.user import User
from pydantic import BaseModel
from datetime import datetime

router = APIRouter(prefix="/api/marketing", tags=["Marketing"])

class ActiveMemberOut(BaseModel):
    name: str
    country: str | None
    timestamp: datetime

    class Config:
        orm_mode = True

@router.get("/recent-active", response_model=List[ActiveMemberOut])
def get_recent_active_members(db: Session = Depends(get_db)):
    """
    Get the last 20 active members.
    """
    # Assuming 'updated_at' reflects when they became active or we just use created_at for now if updated_at is not strictly activation time.
    # Ideally we would have an 'activated_at' column, but for now let's use updated_at of active users.
    users = db.query(User).filter(User.status == "active").order_by(User.updated_at.desc()).limit(20).all()
    
    # Map to schema
    results = []
    for user in users:
        results.append({
            "name": user.name if user.name else "Usuario TEI",
            "country": user.country if user.country else "Global",
            "timestamp": user.updated_at
        })
    return results
