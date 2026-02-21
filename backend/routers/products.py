from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
import csv
import io
from typing import List
from sqlalchemy.orm import Session
from ..database.connection import get_db
from ..database.models.product import Product as ProductModel
from ..schemas.product import Product as ProductSchema, ProductCreate
from ..routers.auth import get_current_user_object
from ..database.models.user import User

router = APIRouter(prefix="/products", tags=["Products"])

def get_current_admin_user(current_user: User = Depends(get_current_user_object)):
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The user doesn't have enough privileges"
        )
    return current_user

@router.get("/template")
def get_product_template(current_user: User = Depends(get_current_admin_user)):
    """
    Returns a CSV template for bulk product import.
    """
    headers = [
        "name", "description", "category", "price_usd", "price_local", 
        "pv", "direct_bonus_pv", "stock", "weight_grams", "image_url", "is_activation",
        "cost_price", "tei_pv", "tax_rate", "public_price", "sku", "supplier_id"
    ]
    
    # Create an in-memory string buffer
    stream = io.StringIO()
    writer = csv.writer(stream)
    
    # Write Header
    writer.writerow(headers)
    
    # Write Example Row
    writer.writerow([
        "Producto Ejemplo", "Descripcion del producto", "Salud", "50.00", "200000",
        "20", "5", "100", "500", "https://ejemplo.com/imagen.jpg", "FALSE",
        "30.00", "15", "19.0", "70.00", "REF-001", "1"
    ])
    
    # Reset buffer position
    stream.seek(0)
    
    response = StreamingResponse(iter([stream.getvalue()]), media_type="text/csv")
    response.headers["Content-Disposition"] = "attachment; filename=plantilla_productos.csv"
    return response

@router.post("/", response_model=ProductSchema)
def create_product(
    prod: ProductCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    try:
        new_product = ProductModel(
            name=prod.name,
            description=prod.description,
            category=prod.category,
            price_usd=prod.price_usd,
            price_eur=prod.price_eur,
            price_local=prod.price_local,
            pv=prod.pv,
            direct_bonus_pv=prod.direct_bonus_pv,
            stock=prod.stock,
            weight_grams=prod.weight_grams,
            image_url=prod.image_url,
            is_activation=prod.is_activation,
            # New Fields
            cost_price=prod.cost_price,
            tei_pv=prod.tei_pv,
            tax_rate=prod.tax_rate,
            public_price=prod.public_price,
            sku=prod.sku,
            supplier_id=prod.supplier_id,
        )
        db.add(new_product)
        db.commit()
        db.refresh(new_product)
        return new_product
    except Exception as e:
        db.rollback()
        print(f"Error creating product: {e}")
        raise HTTPException(status_code=500, detail=f"Error creating product: {str(e)}")




@router.get("/", response_model=List[ProductSchema])
def list_products(
    supplier_id: int = None,
    db: Session = Depends(get_db)
):
    query = db.query(ProductModel).filter(ProductModel.active == True)
    
    if supplier_id is not None:
        query = query.filter(ProductModel.supplier_id == supplier_id)
        
    products = query.all()
    return products

@router.get("/{product_id}", response_model=ProductSchema)
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(ProductModel).filter(ProductModel.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@router.put("/{product_id}", response_model=ProductSchema)
def update_product(
    product_id: int, 
    prod: ProductCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    product = db.query(ProductModel).filter(ProductModel.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    for key, value in prod.dict().items():
        setattr(product, key, value)
    db.commit()
    db.refresh(product)
    return product


@router.delete("/{product_id}")
def delete_product(
    product_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    product = db.query(ProductModel).filter(ProductModel.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    db.delete(product)
    db.commit()
    return {"message": "Product deleted successfully"}










