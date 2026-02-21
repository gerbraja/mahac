from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from backend.database.connection import get_db
from backend.database.models.pickup_point import PickupPoint
from backend.schemas.pickup_point import PickupPointCreate, PickupPointUpdate, PickupPointOut
from backend.utils.auth import get_current_user

router = APIRouter(prefix="/api/pickup-points", tags=["Pickup Points"])

# PUBLIC: List active points
@router.get("/", response_model=List[PickupPointOut])
def list_pickup_points(active_only: bool = True, db: Session = Depends(get_db)):
    query = db.query(PickupPoint)
    if active_only:
        query = query.filter(PickupPoint.active == True)
    return query.all()

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
