from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.database.connection import get_db

router = APIRouter(prefix="/mlm", tags=["Plan Multinivel"])


@router.get("/")
async def mlm_status():
    return {"status": "activo", "message": "Sistema multinivel operativo"}

@router.post("/closing")
def run_monthly_closing(db: Session = Depends(get_db)):
    """Run the monthly closing process manually (e.g. on the 27th)."""
    from backend.mlm.services.closing_service import process_monthly_closing
    try:
        results = process_monthly_closing(db)
        return {"message": "Monthly closing completed", "processed_count": len(results), "details": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
