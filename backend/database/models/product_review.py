from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime
from ..connection import Base

class ProductReview(Base):
    __tablename__ = "product_reviews"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    order_item_id = Column(Integer, ForeignKey("order_items.id"), nullable=False, index=True)
    
    rating = Column(Integer, nullable=False) # 1 to 7
    comment = Column(String(500), nullable=True) # Optional text
    
    created_at = Column(DateTime, default=datetime.utcnow)

    # Ensure a user can only rate a specific order item once
    __table_args__ = (
        UniqueConstraint('user_id', 'order_item_id', name='uix_user_order_item_review'),
    )

    product = relationship("Product")
    user = relationship("User")
    order_item = relationship("OrderItem")
