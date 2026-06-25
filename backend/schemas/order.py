from pydantic import BaseModel
from typing import List, Optional, Any
from datetime import datetime


class OrderItemCreate(BaseModel):
    product_id: int
    quantity: int
    selected_options: Optional[str] = None


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
    shipping_address: Optional[str] = None
    guest_info: Optional[GuestInfo] = None
    shipping_type: Optional[str] = "delivery" # delivery, pickup, activation
    payment_method: Optional[str] = None
    # New fields for detailed shipping
    shipping_cost_base: Optional[float] = 0.0
    shipping_tax_amount: Optional[float] = 0.0
    pickup_point_id: Optional[int] = None


class OrderItemOut(BaseModel):
    id: int
    product_id: int
    product_name: str
    quantity: int
    subtotal_usd: float
    subtotal_cop: float
    subtotal_pv: float
    selected_options: Optional[str] = None

    class Config:
        orm_mode = True


class OrderOut(BaseModel):
    id: int
    user_id: Optional[int]
    user: Optional[UserSummary] = None
    guest_info: Optional[Any] = None  # Can be str (JSON) or dict depending on DB driver
    total_usd: float
    total_cop: float
    total_pv: float
    shipping_address: Optional[str]
    status: str
    shipping_type: str
    tracking_number: Optional[str]
    siigo_invoice_pdf_url: Optional[str]
    shipping_label_pdf_url: Optional[str]
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
