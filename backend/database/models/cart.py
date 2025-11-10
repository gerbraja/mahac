from sqlalchemy import Column, Integer, ForeignKey
from sqlalchemy.orm import relationship
from ..connection import Base


class Cart(Base):
    __tablename__ = "cart"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    quantity = Column(Integer, default=1)

    # Simple relationships; do not require back_populates in other models
    user = relationship("User")
    product = relationship("Product")
