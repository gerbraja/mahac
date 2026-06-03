from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
import csv
import io
from typing import List, Optional
from sqlalchemy.orm import Session
from ..database.connection import get_db
from ..database.models.product import Product as ProductModel
from ..database.models.supplier import Supplier
from ..schemas.product import Product as ProductSchema, ProductCreate, ProductBase, ProductUpdate
from ..routers.auth import get_current_user_object
from ..utils.auth import get_current_user_optional
from ..database.models.user import User
from ..database.models.product_review import ProductReview
from ..database.models.order import Order
from ..database.models.order_item import OrderItem
from ..schemas.product_review import ProductReviewCreate, ProductReviewOut

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
            is_upgrade=getattr(prod, 'is_upgrade', False),
            # New Fields
            cost_price=prod.cost_price,
            tei_pv=prod.tei_pv,
            tax_rate=prod.tax_rate,
            public_price=prod.public_price,
            sku=prod.sku,
            supplier_id=prod.supplier_id,
            package_level=prod.package_level,
            dian_code=prod.dian_code,
            tax_type=prod.tax_type,
            options=prod.options,
            variant_stock=prod.variant_stock,
            shipping_class=prod.shipping_class,
            available_countries=prod.available_countries,
            active=prod.active if prod.active is not None else True,
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
    include_inactive: bool = False,
    country: str = None,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    query = db.query(ProductModel)
    
    if country and country != 'Todos':
        query = query.filter(ProductModel.available_countries.ilike(f'%"{country}"%'))
    
    # Cuando se filtra por proveedor, mostramos todos los estados (activo+suspendido)
    if supplier_id is not None:
        query = query.filter(ProductModel.supplier_id == supplier_id)
    elif not include_inactive:
        query = query.filter(ProductModel.active == True)
        
    # Lógica de Visibilidad Dinámica para Tienda (Solo si NO filtramos por proveedor)
    # Bypass visibility rules for admin users so they can see all products in the Admin Panel
    if supplier_id is None and not (current_user and current_user.is_admin):
        if not current_user or current_user.status != 'active' or (current_user.package_level or 0) == 0:
            # Usuario inactivo / Visitante / Emprendedor Inicial (Nivel 0): Ve productos normales + Paquetes Iniciales (Oculta Upgrades)
            query = query.filter(ProductModel.is_upgrade == False)
        elif current_user.package_level == 1:
            # Usuario Activo Nivel 1: Ve productos normales + Upgrades (Oculta Paquetes Iniciales)
            query = query.filter(ProductModel.is_activation == False)
        else:
            # Usuario Activo Nivel 2 o 3: Ve solo productos normales (Oculta Iniciales y Upgrades)
            query = query.filter(ProductModel.is_activation == False, ProductModel.is_upgrade == False)
            
    products = query.order_by(ProductModel.created_at.desc()).all()
    return products

@router.post("/fix-images-batch")
def fix_images_batch(db: Session = Depends(get_db)):
    """Endpoint temporal para actualizar imágenes de productos específicos."""
    updates = {
        "bon-21022": "https://storage.googleapis.com/tuempresainternacional-assets/images/REF-bon-21022-vestido-deportivo-verde-hilo-acanalado.png",
        "bon-21023": "https://storage.googleapis.com/tuempresainternacional-assets/images/bon-21023.png",
        "bon-21024": "https://storage.googleapis.com/tuempresainternacional-assets/images/bon-21024.png",
        "bon-21025": "https://storage.googleapis.com/tuempresainternacional-assets/images/bon-21025.png",
        "bon-21026": "https://storage.googleapis.com/tuempresainternacional-assets/images/bon-21026.png",
        "bon-21027": "https://storage.googleapis.com/tuempresainternacional-assets/images/bon-21027.png",
        "bon-21028": "https://storage.googleapis.com/tuempresainternacional-assets/images/bon-21028.png"
    }
    
    results = []
    for sku, url in updates.items():
        product = db.query(ProductModel).filter(ProductModel.sku == sku).first()
        if product:
            product.image_url = url
            results.append(f"Actualizado {sku}")
        else:
            results.append(f"No encontrado {sku}")
    
    db.commit()
    return {"results": results}

@router.get("/{product_id}", response_model=ProductSchema)
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(ProductModel).filter(ProductModel.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@router.put("/{product_id}", response_model=ProductSchema)
def update_product(
    product_id: int, 
    prod: ProductUpdate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    product = db.query(ProductModel).filter(ProductModel.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    # exclude_unset=True: solo actualiza los campos que el cliente envió explícitamente
    update_data = prod.dict(exclude_unset=True)
    for key, value in update_data.items():
        if hasattr(product, key):
            setattr(product, key, value)  # Aplica tal como viene (incluso False, 0, None)
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
    
    # Check if product has existing order items (FK constraint protection)
    from ..database.models.order_item import OrderItem
    has_orders = db.query(OrderItem).filter(OrderItem.product_id == product_id).first()
    
    if has_orders:
        # Mark as inactive instead of deleting to preserve referential integrity
        product.active = False
        db.commit()
        return {"message": "Product marked as inactive (has existing orders, cannot delete)"}
    
    db.delete(product)
    db.commit()
    return {"message": "Product deleted successfully"}











@router.post("/{product_id}/reviews", response_model=ProductReviewOut)
def create_product_review(
    product_id: int,
    review_data: ProductReviewCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_object)
):
    product = db.query(ProductModel).filter(ProductModel.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    order_item = db.query(OrderItem).join(Order).filter(
        OrderItem.id == review_data.order_item_id,
        OrderItem.product_id == product_id,
        Order.user_id == current_user.id
    ).first()
    
    if not order_item:
        raise HTTPException(status_code=403, detail="Solo puedes calificar productos que hayas comprado y recibido.")

    valid_statuses = ["completado", "entregado", "efectivo"]
    if order_item.order.status.lower() not in valid_statuses:
        raise HTTPException(status_code=403, detail=f"El pedido debe estar completado para calificar. Estado actual: {order_item.order.status}")

    existing_review = db.query(ProductReview).filter(
        ProductReview.user_id == current_user.id,
        ProductReview.order_item_id == review_data.order_item_id
    ).first()
    
    if existing_review:
        raise HTTPException(status_code=400, detail="Ya has calificado este producto en esta compra.")

    new_review = ProductReview(
        product_id=product_id,
        user_id=current_user.id,
        order_item_id=review_data.order_item_id,
        rating=review_data.rating,
        comment=review_data.comment
    )
    db.add(new_review)
    db.flush()
    
    all_reviews = db.query(ProductReview.rating).filter(ProductReview.product_id == product_id).all()
    total_ratings = len(all_reviews)
    if total_ratings > 0:
        avg_rating = sum(r[0] for r in all_reviews) / total_ratings
        product.average_rating = avg_rating
        product.rating_count = total_ratings
        
    db.commit()
    db.refresh(new_review)
    return new_review

@router.get("/{product_id}/reviews", response_model=List[ProductReviewOut])
def get_product_reviews(product_id: int, db: Session = Depends(get_db)):
    reviews = db.query(ProductReview).filter(
        ProductReview.product_id == product_id
    ).order_by(ProductReview.created_at.desc()).all()
    return reviews
