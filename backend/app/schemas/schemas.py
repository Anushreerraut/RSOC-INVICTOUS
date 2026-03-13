from pydantic import BaseModel, HttpUrl
from typing import Optional
from datetime import datetime
from app.models.scan import ScanStatus, ScanType
from app.models.finding import Severity


# ─── Targets ────────────────────────────────────────────────────────────────
class TargetCreate(BaseModel):
    name: str
    base_url: str
    auth_type: str = "none"
    auth_config: dict = {}
    description: Optional[str] = None


class TargetOut(BaseModel):
    id: str
    name: str
    base_url: str
    auth_type: str
    description: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


# ─── Scans ───────────────────────────────────────────────────────────────────
class ScanCreate(BaseModel):
    target_url: str
    scan_type: ScanType = ScanType.url
    spec_content: Optional[str] = None   # raw OpenAPI YAML/JSON string
    target_id: Optional[str] = None
    config: dict = {}


class ScanOut(BaseModel):
    id: str
    target_url: str
    scan_type: str
    status: str
    summary: dict
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    created_at: datetime
    error_message: Optional[str]

    class Config:
        from_attributes = True


# ─── Findings ────────────────────────────────────────────────────────────────
class FindingOut(BaseModel):
    id: str
    scan_id: str
    endpoint: str
    method: str
    category: str
    severity: str
    title: str
    description: str
    request_raw: Optional[str]
    response_raw: Optional[str]
    cvss_score: Optional[float]
    remediation: Optional[str]
    owasp_ref: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


# ─── Auth ────────────────────────────────────────────────────────────────────
class UserCreate(BaseModel):
    email: str
    username: str
    password: str


class UserOut(BaseModel):
    id: str
    email: str
    username: str
    is_admin: bool
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class LoginRequest(BaseModel):
    username: str
    password: str
