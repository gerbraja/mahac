from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from backend.database.connection import get_db
from backend.database.models.user import User
from pydantic import BaseModel
from datetime import datetime

router = APIRouter(prefix="/api/marketing", tags=["Marketing"])

# Country to flag emoji mapping
COUNTRY_FLAGS = {
    "Colombia": "🇨🇴",
    "México": "🇲🇽",
    "Mexico": "🇲🇽",
    "España": "🇪🇸",
    "Spain": "🇪🇸",
    "Argentina": "🇦🇷",
    "Chile": "🇨🇱",
    "Perú": "🇵🇪",
    "Peru": "🇵🇪",
    "Venezuela": "🇻🇪",
    "Ecuador": "🇪🇨",
    "Bolivia": "🇧🇴",
    "Paraguay": "🇵🇾",
    "Uruguay": "🇺🇾",
    "Brasil": "🇧🇷",
    "Brazil": "🇧🇷",
    "Estados Unidos": "🇺🇸",
    "United States": "🇺🇸",
    "USA": "🇺🇸",
    "Canadá": "🇨🇦",
    "Canada": "🇨🇦",
    "Panamá": "🇵🇦",
    "Panama": "🇵🇦",
    "Costa Rica": "🇨🇷",
    "Guatemala": "🇬🇹",
    "Honduras": "🇭🇳",
    "El Salvador": "🇸🇻",
    "Nicaragua": "🇳🇮",
    "República Dominicana": "🇩🇴",
    "Dominican Republic": "🇩🇴",
    "Puerto Rico": "🇵🇷",
    "Cuba": "🇨🇺",
}

def format_display_name(full_name: str) -> str:
    """
    Extract first name and first surname from full name.
    Examples:
        "Juan Carlos Pérez González" -> "Juan Pérez"
        "María López" -> "María López"
        "Pedro" -> "Pedro"
    """
    if not full_name:
        return "Usuario TEI"
    
    parts = full_name.strip().split()
    if len(parts) == 0:
        return "Usuario TEI"
    elif len(parts) == 1:
        return parts[0]
    elif len(parts) == 2:
        return f"{parts[0]} {parts[1]}"
    else:
        # Assume first part is first name, third part is first surname
        # (second part might be middle name)
        return f"{parts[0]} {parts[2]}" if len(parts) > 2 else f"{parts[0]} {parts[1]}"

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
    Get the last 20 active members with formatted names and flag emojis.
    """
    users = db.query(User).filter(User.status == "active").order_by(User.updated_at.desc()).limit(20).all()
    
    # Map to schema
    results = []
    for user in users:
        full_name = user.name if user.name else "Usuario TEI"
        country = user.country if user.country else "Global"
        
        results.append({
            "name": format_display_name(full_name),
            "country": country,
            "flag_emoji": COUNTRY_FLAGS.get(country, "🌍"),  # Default to globe emoji
            "timestamp": user.updated_at
        })
    return results
