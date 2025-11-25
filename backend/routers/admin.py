from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.database.connection import get_db
from backend.mlm.services.closing_service import process_monthly_closing, process_global_pool

router = APIRouter(prefix="/api/admin", tags=["Admin"])

@router.post("/trigger-monthly-closing")
def trigger_monthly_closing(db: Session = Depends(get_db)):
    """
    Manually trigger the Monthly Closing process.
    - Calculates Unilevel Matching Bonus (50%)
    - Calculates Crypto Loyalty Bonus (10%)
    """
    try:
        results = process_monthly_closing(db)
        return {"message": "Monthly closing completed successfully", "details": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/trigger-global-pool")
def trigger_global_pool(db: Session = Depends(get_db)):
    """
    Manually trigger the Global Pool Distribution.
    - Calculates 10% of Global PV
    - Distributes 7% to each Diamond Rank
    """
    try:
        results = process_global_pool(db)
        return {"message": "Global Pool distributed successfully", "details": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
