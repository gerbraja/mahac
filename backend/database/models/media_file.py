from sqlalchemy import Column, Integer, String, LargeBinary, DateTime
from datetime import datetime
from ..connection import Base

class MediaFile(Base):
    __tablename__ = "media_files"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String(255), nullable=True)
    mime_type = Column(String(100), default="image/jpeg")
    file_bytes = Column(LargeBinary, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
