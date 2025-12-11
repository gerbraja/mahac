from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from backend.database.connection import get_db
from backend.database.models.user import User
from backend.utils.marketing import format_display_name, COUNTRY_FLAGS
from pydantic import BaseModel
from datetime import datetime

router = APIRouter(prefix="/api/marketing", tags=["Marketing"])


class ActiveMemberOut(BaseModel):
    name: str
    country: str | None
    flag_emoji: str | None
    timestamp: datetime

    class Config:
        orm_mode = True


@router.get("/recent-active", response_model=List[ActiveMemberOut])
def get_recent_active_members(db: Session = Depends(get_db)):
    """
    Get the last 20 pre-affiliates (new registrations) with formatted names and flag emojis.
    """
    users = db.query(User).filter(User.status == "pre-affiliate").order_by(User.created_at.desc()).limit(20).all()
    
    # Map to schema
    results = []
    for user in users:
        full_name = user.name if user.name else "Usuario TEI"
        country = user.country if user.country else "Global"
        
        results.append({
            "name": format_display_name(full_name),
            "country": country,
            "flag_emoji": COUNTRY_FLAGS.get(country, "🌍"),  # Default to globe emoji
            "timestamp": user.created_at
        })
    return results
