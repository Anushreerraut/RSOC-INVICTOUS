import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Integer
from app.core.database import Base


class Review(Base):
    __tablename__ = "reviews"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_name = Column(String(100), default="Anonymous")
    rating = Column(Integer, default=5)
    comment = Column(String(1000), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
