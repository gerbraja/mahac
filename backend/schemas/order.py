from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


class OrderItemCreate(BaseModel):
    product_id: int
    quantity: int


class OrderCreate(BaseModel):
    items: List[OrderItemCreate]
    shipping_address: Optional[str]


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
    user_id: int
    total_usd: float
    total_cop: float
    total_pv: float
    shipping_address: Optional[str]
    status: str
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
