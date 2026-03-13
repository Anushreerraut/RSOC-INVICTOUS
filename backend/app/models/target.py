import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Enum, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base
import enum


class AuthType(str, enum.Enum):
    none = "none"
    bearer = "bearer"
    apikey = "apikey"
    basic = "basic"
    oauth2 = "oauth2"


class Target(Base):
    __tablename__ = "targets"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(100))
    base_url = Column(String(500))
    auth_type = Column(Enum(AuthType), default=AuthType.none)
    auth_config = Column(JSON, default={})  # {"token": "...", "header": "Authorization"}
    description = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    scans = relationship("Scan", back_populates="target")
