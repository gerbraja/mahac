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
    pv: Optional[float] = 0
    direct_bonus_pv: Optional[float] = 0
    stock: Optional[int] = 0
    weight_grams: Optional[int] = 500  # Weight in grams
    is_activation: Optional[bool] = False
    is_upgrade: Optional[bool] = False
    image_url: Optional[str] = None  # URL of product image
    
    # Costos de Fabricante, Impuestos y Distribución de Ganancia TEI
    cost_price: Optional[float] = 0.0
    supplier_has_iva: Optional[bool] = False
    supplier_iva_rate: Optional[float] = 0.0
    supplier_withholding_rate: Optional[float] = 0.0
    compensation_budget_cop: Optional[float] = 0.0
    matrix_reserve_cop: Optional[float] = 0.0
    travel_pool_cop: Optional[float] = 0.0
    company_profit_cop: Optional[float] = 0.0
    tei_pv: Optional[int] = 0
    tax_rate: Optional[float] = 0.0
    public_price: Optional[float] = None
    sku: Optional[str] = None
    supplier_id: Optional[int] = None
    package_level: Optional[int] = 0
    
    # Facturación Electrónica DIAN
    dian_code: Optional[str] = None
    tax_type: Optional[str] = "IVA"
    
    options: Optional[str] = None # JSON string for product attributes
    variant_stock: Optional[str] = None # JSON string for stock per variant
    
    shipping_class: Optional[str] = "normal"
    
    available_countries: Optional[str] = '["Colombia"]'
    
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
    is_upgrade: Optional[bool] = None
    image_url: Optional[str] = None
    cost_price: Optional[float] = None
    supplier_has_iva: Optional[bool] = None
    supplier_iva_rate: Optional[float] = None
    supplier_withholding_rate: Optional[float] = None
    compensation_budget_cop: Optional[float] = None
    matrix_reserve_cop: Optional[float] = None
    travel_pool_cop: Optional[float] = None
    company_profit_cop: Optional[float] = None
    tei_pv: Optional[int] = None
    tax_rate: Optional[float] = None
    public_price: Optional[float] = None
    sku: Optional[str] = None
    supplier_id: Optional[int] = None
    package_level: Optional[int] = None
    
    # Facturación Electrónica DIAN
    dian_code: Optional[str] = None
    tax_type: Optional[str] = None
    
    options: Optional[str] = None
    variant_stock: Optional[str] = None
    shipping_class: Optional[str] = None
    available_countries: Optional[str] = None
    
    active: Optional[bool] = None


class Product(ProductBase):
    id: int
    active: bool = True
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
        orm_mode = True
