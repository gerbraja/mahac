from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from backend.database.connection import get_db
from backend.database.models.sponsorship import SponsorshipCommission
from backend.database.models.user import User

router = APIRouter(prefix="/api/admin", tags=["admin"])

@router.post("/fix-balance")
def fix_sponsorship_balance_endpoint(db: Session = Depends(get_db)):
    """
    Execute the retroactive fix for sponsorship commissions.
    Updates sponsor's total_earnings and available_balance for 'pending' commissions.
    """
    try:
        # DIAGNOSTIC: Print Users (first 5 admin/active) allows verifying DB state
        users = db.query(User).filter(User.status == 'active').limit(5).all()
        user_stats = []
        for u in users:
            user_stats.append({
                "id": u.id,
                "username": u.username,
                "earnings": u.total_earnings,
                "balance": u.available_balance
            })
            
        # THE FIX LOGIC
        pending_commissions = db.query(SponsorshipCommission).filter(
            SponsorshipCommission.status == 'pending'
        ).all()
        
        updated_count = 0
        total_amount_added = 0.0
        details = []

        for comm in pending_commissions:
            sponsor = db.query(User).filter(User.id == comm.sponsor_id).first()
            if sponsor:
                amount = float(comm.commission_amount)
                
                # Update Sponsor Balances
                sponsor.available_balance = (sponsor.available_balance or 0.0) + amount
                sponsor.total_earnings = (sponsor.total_earnings or 0.0) + amount
                
                # Update Commission Status
                comm.status = 'paid'
                
                details.append(f"Updated Sponsor {sponsor.id} (+${amount})")
                updated_count += 1
                total_amount_added += amount
            else:
                details.append(f"Skipped Comm {comm.id}: Sponsor {comm.sponsor_id} not found")

        db.commit()
        
        return {
            "status": "success",
            "message": "Fix executed successfully",
            "updated_count": updated_count,
            "total_amount_added": total_amount_added,
            "details": details,
            "diagnostic_users": user_stats
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
