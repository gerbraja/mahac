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
    direct_bonus_pv: int = 0
    stock: int = 0
    weight_grams: int = 500  # Weight in grams
    is_activation: bool = False
    image_url: Optional[str] = None  # URL of product image
    
    # New Fields
    cost_price: Optional[float] = None
    tei_pv: int = 0
    tax_rate: float = 0.0
    public_price: Optional[float] = None
    sku: Optional[str] = None
    supplier_id: Optional[int] = None


class ProductCreate(ProductBase):
    pass


class Product(ProductBase):
    id: int
    active: bool = True
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    # Optional nested supplier (if needed for list view, though usually we load separate)
    # supplier: Optional['Supplier'] = None (Avoid circular imports for now)

    class Config:
        orm_mode = True


