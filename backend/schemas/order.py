from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


class OrderItemCreate(BaseModel):
    product_id: int
    quantity: int


class GuestInfo(BaseModel):
    name: str
    email: Optional[str]
    phone: Optional[str]


class UserSummary(BaseModel):
    id: int
    name: Optional[str]
    email: Optional[str]
    phone: Optional[str]
    address: Optional[str]
    city: Optional[str]
    department: Optional[str]  # Mapped from 'province' in User model usually, or just use province field
    province: Optional[str]
    document_id: Optional[str]

    class Config:
        orm_mode = True


class OrderCreate(BaseModel):
    items: List[OrderItemCreate]
    shipping_address: Optional[str]
    shipping_address: Optional[str]
    guest_info: Optional[GuestInfo] = None
    payment_method: Optional[str] = None


class OrderItemOut(BaseModel):
    id: int
    product_id: int
    product_name: str
    quantity: int
    subtotal_usd: float
    subtotal_cop: float
    subtotal_pv: float

    class Config:
        orm_mode = True


class OrderOut(BaseModel):
    id: int
    user_id: Optional[int]
    user: Optional[UserSummary] = None
    guest_info: Optional[str] # Or parse as dict if using Pydantic JSON logic, but str for simplicity with Text column
    total_usd: float
    total_cop: float
    total_pv: float
    shipping_address: Optional[str]
    status: str
    payment_method: Optional[str]
    tracking_number: Optional[str]
    created_at: datetime
    payment_confirmed_at: Optional[datetime]
    shipped_at: Optional[datetime]
    completed_at: Optional[datetime]
    items: List[OrderItemOut]

    class Config:
        orm_mode = True


class OrderStatusUpdate(BaseModel):
    status: str
    tracking_number: Optional[str] = None
