from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import inspect, text
from typing import List, Optional

from backend.database.connection import get_db, engine, Base
from backend.database.models.pickup_point import PickupPoint
from backend.schemas.pickup_point import PickupPointCreate, PickupPointUpdate, PickupPointOut
from backend.utils.auth import get_current_user

router = APIRouter(prefix="/api/pickup-points", tags=["Pickup Points"])

# DIAGNOSTIC: Check table health and fix active=NULL rows
@router.get("/check")
def check_pickup_table(db: Session = Depends(get_db)):
    """Diagnostic endpoint: verifies the pickup_points table exists, fixes active=NULL rows, and returns row count."""
    try:
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        table_exists = "pickup_points" in tables

        if not table_exists:
            # Try to auto-create the table
            Base.metadata.create_all(bind=engine)
            tables_after = inspect(engine).get_table_names()
            created = "pickup_points" in tables_after
            return {
                "status": "CREATED" if created else "FAILED",
                "message": "Tabla no existía, se intentó crear automáticamente.",
                "created": created,
                "all_tables": tables_after,
            }

        count = db.query(PickupPoint).count()
        columns = [col['name'] for col in inspector.get_columns("pickup_points")]
        
        # Fix rows with active=NULL → set to True
        null_active = db.query(PickupPoint).filter(PickupPoint.active == None).all()
        fixed_count = 0
        for p in null_active:
            p.active = True
            fixed_count += 1
        if fixed_count > 0:
            db.commit()
        
        return {
            "status": "OK",
            "table_exists": True,
            "total_rows": count,
            "columns": columns,
            "null_active_fixed": fixed_count,
            "message": f"Se corrigieron {fixed_count} punto(s) con active=NULL → True" if fixed_count > 0 else "Todo OK",
        }
    except Exception as e:
        return {"status": "ERROR", "error": str(e)}

# PUBLIC: List active points
@router.get("/", response_model=List[PickupPointOut])
def list_pickup_points(
    active_only: bool = True, 
    country: Optional[str] = None,
    db: Session = Depends(get_db)
):
    try:
        query = db.query(PickupPoint)
        if active_only:
            # Use is_not(False) instead of == True so that NULL values are also included
            # (points created before the active flag may have active=NULL in the DB)
            query = query.filter(PickupPoint.active.is_not(False))
            
        if country and country != 'Todos':
            query = query.filter(PickupPoint.country == country)
            
        return query.all()
    except Exception as e:
        error_msg = str(e)
        if "pickup_points" in error_msg.lower() and ("exist" in error_msg.lower() or "no such table" in error_msg.lower()):
            raise HTTPException(
                status_code=500,
                detail="La tabla pickup_points no existe en la base de datos. Visita /api/pickup-points/check para repararla automáticamente."
            )
        raise HTTPException(status_code=500, detail=f"Error interno: {error_msg}")

# ADMIN: Create
@router.post("/", response_model=PickupPointOut)
def create_pickup_point(
    payload: PickupPointCreate, 
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    new_point = PickupPoint(**payload.dict())
    db.add(new_point)
    db.commit()
    db.refresh(new_point)
    return new_point

# ADMIN: Update
@router.put("/{point_id}", response_model=PickupPointOut)
def update_pickup_point(
    point_id: int,
    payload: PickupPointUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    point = db.query(PickupPoint).filter(PickupPoint.id == point_id).first()
    if not point:
        raise HTTPException(status_code=404, detail="Pickup point not found")
    
    for key, value in payload.dict(exclude_unset=True).items():
        setattr(point, key, value)
    
    db.add(point)
    db.commit()
    db.refresh(point)
    return point

# ADMIN: Delete (Soft delete or Hard delete)
@router.delete("/{point_id}")
def delete_pickup_point(
    point_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    point = db.query(PickupPoint).filter(PickupPoint.id == point_id).first()
    if not point:
        raise HTTPException(status_code=404, detail="Pickup point not found")
    
    db.delete(point)
    db.commit()
    return {"message": "Pickup point deleted"}
