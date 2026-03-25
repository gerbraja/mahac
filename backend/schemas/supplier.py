from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class SupplierBase(BaseModel):
    name: str
    contact_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    active: bool = True
    
    # Facturación Electrónica DIAN
    document_type: Optional[str] = None
    document_number: Optional[str] = None
    tax_regime: Optional[str] = None
    city: Optional[str] = None
    country: str = "Colombia"

class SupplierCreate(SupplierBase):
    pass

class SupplierUpdate(BaseModel):
    name: Optional[str] = None
    contact_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    active: Optional[bool] = None
    document_type: Optional[str] = None
    document_number: Optional[str] = None
    tax_regime: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None

class Supplier(SupplierBase):
    id: int
    created_at: Optional[datetime] = None

    class Config:
        orm_mode = True
