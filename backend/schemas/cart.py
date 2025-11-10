from pydantic import BaseModel
from typing import Optional

from .product import Product as ProductSchema


class CartCreate(BaseModel):
    user_id: int
    product_id: int
    quantity: Optional[int] = 1


class CartUpdate(BaseModel):
    quantity: int


class CartItem(BaseModel):
    id: int
    user_id: int
    product: ProductSchema
    quantity: int

    class Config:
        orm_mode = True
