# Example: `backend/routers/inventory.py`

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.database.connection import get_db
from backend.database.models.product import Product

router = APIRouter(prefix="/api/inventory", tags=["Inventory"])

@router.get("/stock/{product_id}")
def get_stock(product_id: int, db: Session = Depends(get_db)):
    p = db.query(Product).filter(Product.id == product_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"product_id": p.id, "stock": p.stock}

@router.post("/adjust/{product_id}")
def adjust_stock(product_id: int, quantity: int, db: Session = Depends(get_db)):
    p = db.query(Product).filter(Product.id == product_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Product not found")
    p.stock = p.stock + quantity
    db.add(p)
    db.commit()
    db.refresh(p)
    return {"ok": True, "product_id": p.id, "stock": p.stock}
