import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Enum, JSON, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base
import enum


class ScanStatus(str, enum.Enum):
    queued = "queued"
    running = "running"
    completed = "completed"
    failed = "failed"


class ScanType(str, enum.Enum):
    openapi = "openapi"
    url = "url"
    graphql = "graphql"
    postman = "postman"


class Scan(Base):
    __tablename__ = "scans"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    target_id = Column(String, ForeignKey("targets.id"), nullable=True)
    target_url = Column(String(500))
    scan_type = Column(Enum(ScanType), default=ScanType.url)
    status = Column(Enum(ScanStatus), default=ScanStatus.queued)
    spec_content = Column(String, nullable=True)  # OpenAPI YAML/JSON
    config = Column(JSON, default={})
    summary = Column(JSON, default={})  # {total, critical, high, medium, low, info}
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    error_message = Column(String, nullable=True)

    findings = relationship("Finding", back_populates="scan", cascade="all, delete-orphan")
    target = relationship("Target", back_populates="scans")
