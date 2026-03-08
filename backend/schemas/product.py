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
    pv: float = 0
    direct_bonus_pv: float = 0
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
    package_level: int = 0
    active: Optional[bool] = None  # None = no change; True = activo; False = suspendido


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    """Schema para actualizaciones parciales — todos los campos son opcionales."""
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    price_usd: Optional[float] = None
    price_eur: Optional[float] = None
    price_local: Optional[float] = None
    pv: Optional[float] = None
    direct_bonus_pv: Optional[float] = None
    stock: Optional[int] = None
    weight_grams: Optional[int] = None
    is_activation: Optional[bool] = None
    image_url: Optional[str] = None
    cost_price: Optional[float] = None
    tei_pv: Optional[int] = None
    tax_rate: Optional[float] = None
    public_price: Optional[float] = None
    sku: Optional[str] = None
    supplier_id: Optional[int] = None
    package_level: Optional[int] = None
    active: Optional[bool] = None


class Product(ProductBase):
    id: int
    active: bool = True
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    # Optional nested supplier (if needed for list view, though usually we load separate)
    # supplier: Optional['Supplier'] = None (Avoid circular imports for now)

    class Config:
        orm_mode = True


