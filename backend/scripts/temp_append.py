import os

file_path = r"c:\Users\mahac\multinivel\tiendavirtual\miweb\CentroComercialTEI\backend\routers\products.py"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Fix duplicated imports
bad_import = '''from ..database.models.product_review import ProductReview
from ..database.models.order import Order
from ..database.models.order_item import OrderItem
from ..schemas.product_review import ProductReviewCreate, ProductReviewOutfrom ..database.models.product_review import ProductReview
from ..database.models.order import Order
from ..database.models.order_item import OrderItem
from ..schemas.product_review import ProductReviewCreate, ProductReviewOut'''

good_import = '''from ..database.models.product_review import ProductReview
from ..database.models.order import Order
from ..database.models.order_item import OrderItem
from ..schemas.product_review import ProductReviewCreate, ProductReviewOut'''

content = content.replace(bad_import, good_import)

# Append endpoints
endpoints = """
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
"""

if "@router.post(\"/{product_id}/reviews\"" not in content:
    content += endpoints

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
print("Done")
