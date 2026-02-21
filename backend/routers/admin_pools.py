from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.database.connection import get_db
from backend.mlm.services.pool_service import distribute_monthly_pools, MASTER_POOL_NAME
# from backend.auth.auth import get_current_active_superuser # Assuming auth exists

router = APIRouter(
    prefix="/admin/pools",
    tags=["admin-pools"],
    responses={404: {"description": "Not found"}},
)

@router.post("/distribute-monthly")
def trigger_monthly_distribution(db: Session = Depends(get_db)):
    """
    Manually trigger the monthly distribution of Global Pools.
    This should be called once a month (e.g. 1st of month).
    """
    # Check permissions (TODO: Add superuser check)
    
    try:
        distribute_monthly_pools(db)
        return {"status": "success", "message": "Monthly distribution process completed."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/status")
def get_pool_status(db: Session = Depends(get_db)):
    from backend.database.models.global_pool import GlobalPool
    pool = db.query(GlobalPool).filter_by(name=MASTER_POOL_NAME).first()
    if not pool:
        return {"name": MASTER_POOL_NAME, "balance": 0.0, "accumulated": 0.0}
    return {
        "name": pool.name,
        "balance": pool.current_balance,
        "total_accumulated": pool.total_accumulated,
        "last_updated": pool.last_updated
    }
