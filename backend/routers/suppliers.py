from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
import uuid
import json
from pydantic import BaseModel
from ..database.connection import get_db
from ..database.models.supplier import Supplier
from ..database.models.product import Product
from ..schemas.supplier import Supplier as SupplierSchema, SupplierCreate, SupplierUpdate

class StockUpdateItem(BaseModel):
    product_id: int
    stock: int
    variant_stock: Optional[dict] = None

class StockUpdateRequest(BaseModel):
    updates: List[StockUpdateItem]

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
    db: Session = Depends(get_db)
):
    query = db.query(Supplier)
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

# --- Supplier Inventory Magic Link Endpoints ---

@router.post("/{supplier_id}/generate-token")
def generate_inventory_token(supplier_id: int, db: Session = Depends(get_db)):
    """Admin endpoint to generate a new magic link token for a supplier."""
    supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    
    new_token = str(uuid.uuid4())
    supplier.inventory_token = new_token
    db.commit()
    
    return {"inventory_token": new_token}

@router.get("/inventory/{token}")
def get_supplier_inventory(token: str, db: Session = Depends(get_db)):
    """Public endpoint for supplier to view their assigned products."""
    supplier = db.query(Supplier).filter(Supplier.inventory_token == token).first()
    if not supplier:
        raise HTTPException(status_code=401, detail="Token inválido o expirado.")
        
    products = db.query(Product).filter(Product.supplier_id == supplier.id).all()
    
    return {
        "supplier_name": supplier.name,
        "contact_name": supplier.contact_name,
        "products": [
            {
                "id": p.id,
                "name": p.name,
                "sku": p.sku,
                "image_url": p.image_url,
                "stock": p.stock,
                "dian_code": p.dian_code,
                "options": p.options,
                "variant_stock": p.variant_stock
            } for p in products
        ]
    }

@router.put("/inventory/{token}")
def update_supplier_inventory(token: str, data: StockUpdateRequest, db: Session = Depends(get_db)):
    """Public endpoint for supplier to update their product stocks."""
    supplier = db.query(Supplier).filter(Supplier.inventory_token == token).first()
    if not supplier:
        raise HTTPException(status_code=401, detail="Token inválido o expirado.")
        
    # Verify all products belong to this supplier
    product_ids = [item.product_id for item in data.updates]
    db_products = db.query(Product).filter(
        Product.id.in_(product_ids),
        Product.supplier_id == supplier.id
    ).all()
    
    db_product_map = {p.id: p for p in db_products}
    
    updated_count = 0
    for item in data.updates:
        if item.product_id in db_product_map:
            db_product = db_product_map[item.product_id]
            if item.variant_stock is not None:
                # Sum up all valid variant stocks for the aggregate
                clean_variant_stock = {k: max(0, v) for k, v in item.variant_stock.items()}
                total_stock = sum(clean_variant_stock.values())
                db_product.stock = total_stock
                db_product.variant_stock = json.dumps(clean_variant_stock)
            else:
                db_product.stock = max(0, item.stock) # Prevent negative stock
            updated_count += 1
            
    db.commit()
    return {"message": "Inventario actualizado exitosamente.", "updated_count": updated_count}

