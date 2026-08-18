from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class ProductReviewCreate(BaseModel):
    order_item_id: int
    rating: int = Field(..., ge=1, le=7, description="Rating from 1 to 7 based on Quality/Price")
    comment: Optional[str] = Field(None, max_length=500)

class ProductReviewOut(BaseModel):
    id: int
    product_id: int
    user_id: int
    order_item_id: int
    rating: int
    comment: Optional[str] = None
    created_at: datetime
    
    # We could also include the user's name if we want to display who reviewed it
    
    class Config:
        orm_mode = True
