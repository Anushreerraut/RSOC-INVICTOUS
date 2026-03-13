import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Enum, Float, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base
import enum


class Severity(str, enum.Enum):
    critical = "critical"
    high = "high"
    medium = "medium"
    low = "low"
    info = "info"


class Finding(Base):
    __tablename__ = "findings"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    scan_id = Column(String, ForeignKey("scans.id", ondelete="CASCADE"))
    endpoint = Column(String(500))
    method = Column(String(10), default="GET")
    category = Column(String(100))   # e.g. BOLA, SQLi, CORS
    severity = Column(Enum(Severity), default=Severity.info)
    title = Column(String(200))
    description = Column(Text)
    request_raw = Column(Text, nullable=True)
    response_raw = Column(Text, nullable=True)
    cvss_score = Column(Float, nullable=True)
    remediation = Column(Text, nullable=True)
    owasp_ref = Column(String(50), nullable=True)  # e.g. API1:2023
    created_at = Column(DateTime, default=datetime.utcnow)

    scan = relationship("Scan", back_populates="findings")
