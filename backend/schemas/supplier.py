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

class SupplierCreate(SupplierBase):
    pass

class SupplierUpdate(SupplierBase):
    name: Optional[str] = None
    active: Optional[bool] = None

class Supplier(SupplierBase):
    id: int
    created_at: Optional[datetime] = None

    class Config:
        orm_mode = True
