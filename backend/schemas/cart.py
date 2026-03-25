from pydantic import BaseModel
from typing import Optional

from .product import Product as ProductSchema


class CartCreate(BaseModel):
    user_id: int
    product_id: int
    quantity: Optional[int] = 1
    selected_options: Optional[str] = None


class CartUpdate(BaseModel):
    quantity: int


class CartItem(BaseModel):
    id: int
    user_id: int
    product: ProductSchema
    quantity: int
    selected_options: Optional[str] = None

    class Config:
        orm_mode = True
