"""
Public stats endpoint for homepage
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, distinct
from backend.database.connection import get_db
from backend.database.models.user import User

router = APIRouter(prefix="/api/public", tags=["public"])

@router.get("/stats")
def get_public_stats(db: Session = Depends(get_db)):
    """
    Get public statistics for the homepage
    Returns:
    - total_members: Number of active users
    - total_commissions: Total commissions paid (sum of all user earnings)
    - total_countries: Number of unique countries
    """
    try:
        # Count active members (users with status 'active')
        total_members = db.query(func.count(User.id)).filter(
            User.status == 'active'
        ).scalar() or 0
        
        # Sum all user total_earnings as proxy for total commissions
        total_commissions = db.query(func.sum(User.total_earnings)).scalar() or 0.0
        
        # Count unique countries
        total_countries = db.query(func.count(distinct(User.country))).filter(
            User.country.isnot(None),
            User.country != ''
        ).scalar() or 0
        
        return {
            "total_members": total_members,
            "total_commissions": float(total_commissions),
            "total_countries": total_countries
        }
    except Exception as e:
        print(f"Error getting public stats: {e}")
        return {
            "total_members": 0,
            "total_commissions": 0.0,
            "total_countries": 0
        }
