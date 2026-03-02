from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database.connection import get_db
from ..database.models.supplier import Supplier
from ..schemas.supplier import Supplier as SupplierSchema, SupplierCreate, SupplierUpdate

router = APIRouter(
    prefix="/suppliers",
    tags=["Suppliers"],
    responses={404: {"description": "Not found"}},
)

@router.post("/", response_model=SupplierSchema)
def create_supplier(supplier: SupplierCreate, db: Session = Depends(get_db)):
    db_supplier = Supplier(**supplier.dict())
    db.add(db_supplier)
    db.commit()
    db.refresh(db_supplier)
    return db_supplier

@router.get("/", response_model=List[SupplierSchema])
def read_suppliers(
    skip: int = 0, 
    limit: int = 100, 
    country: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Supplier)
    if country and country != 'Todos':
        query = query.filter(Supplier.country == country)
        
    suppliers = query.offset(skip).limit(limit).all()
    return suppliers

@router.get("/{supplier_id}", response_model=SupplierSchema)
def read_supplier(supplier_id: int, db: Session = Depends(get_db)):
    db_supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if db_supplier is None:
        raise HTTPException(status_code=404, detail="Supplier not found")
    return db_supplier

@router.put("/{supplier_id}", response_model=SupplierSchema)
def update_supplier(supplier_id: int, supplier_update: SupplierUpdate, db: Session = Depends(get_db)):
    db_supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if db_supplier is None:
        raise HTTPException(status_code=404, detail="Supplier not found")
    
    update_data = supplier_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_supplier, key, value)
    
    db.add(db_supplier)
    db.commit()
    db.refresh(db_supplier)
    return db_supplier

@router.delete("/{supplier_id}")
def delete_supplier(supplier_id: int, db: Session = Depends(get_db)):
    db_supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if db_supplier is None:
        raise HTTPException(status_code=404, detail="Supplier not found")
    
    db.delete(db_supplier)
    db.commit()
    return {"ok": True}
