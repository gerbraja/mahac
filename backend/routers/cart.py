from fastapi import APIRouter, Depends, HTTPException
from typing import List
from sqlalchemy.orm import Session

from ..database.connection import get_db
from ..database.models.cart import Cart as CartModel
from ..database.models.product import Product as ProductModel
from ..database.models.user import User as UserModel
from ..schemas.cart import CartCreate, CartUpdate, CartItem

router = APIRouter(prefix="/cart", tags=["Cart"])


@router.get("/", response_model=List[CartItem])
def get_cart(user_id: int, db: Session = Depends(get_db)):
    """Return all cart items for a given user_id."""
    items = db.query(CartModel).filter(CartModel.user_id == user_id).all()
    return items


@router.post("/", response_model=CartItem)
def add_to_cart(cart_data: CartCreate, db: Session = Depends(get_db)):
    """Add a product to user's cart or increment quantity if it exists."""
    product = db.query(ProductModel).filter(ProductModel.id == cart_data.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    existing = (
        db.query(CartModel)
        .filter(CartModel.user_id == cart_data.user_id, CartModel.product_id == cart_data.product_id)
        .first()
    )

    if existing:
        existing.quantity += cart_data.quantity
        db.commit()
        db.refresh(existing)
        return existing

    new_item = CartModel(user_id=cart_data.user_id, product_id=cart_data.product_id, quantity=cart_data.quantity)
    db.add(new_item)
    db.commit()
    db.refresh(new_item)
    return new_item


@router.put("/{item_id}", response_model=CartItem)
def update_cart(item_id: int, update_data: CartUpdate, db: Session = Depends(get_db)):
    item = db.query(CartModel).filter(CartModel.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    item.quantity = update_data.quantity
    db.commit()
    db.refresh(item)
    return item


@router.delete("/{item_id}")
def delete_cart_item(item_id: int, db: Session = Depends(get_db)):
    item = db.query(CartModel).filter(CartModel.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    db.delete(item)
    db.commit()
    return {"message": "Item removed from cart"}
