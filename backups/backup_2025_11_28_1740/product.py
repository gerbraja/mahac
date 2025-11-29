from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class ProductBase(BaseModel):
    name: str
    description: Optional[str] = None
    category: str
    price_usd: float
    price_eur: Optional[float] = None
    price_local: Optional[float] = None
    pv: int = 0
    stock: int = 0
    weight_grams: int = 500  # Weight in grams
    is_activation: bool = False


class ProductCreate(ProductBase):
    pass


class Product(ProductBase):
    id: int
    active: bool = True
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        orm_mode = True


