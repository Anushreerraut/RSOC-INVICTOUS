from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.models.finding import Finding
from app.schemas.schemas import FindingOut

router = APIRouter(prefix="/findings", tags=["Findings"])


@router.get("", response_model=List[FindingOut])
def list_findings(
    scan_id: Optional[str] = None,
    severity: Optional[str] = None,
    category: Optional[str] = None,
    limit: int = 200,
    db: Session = Depends(get_db),
):
    q = db.query(Finding)
    if scan_id:
        q = q.filter(Finding.scan_id == scan_id)
    if severity:
        q = q.filter(Finding.severity == severity)
    if category:
        q = q.filter(Finding.category == category)
    return q.order_by(Finding.severity).limit(limit).all()


@router.get("/{finding_id}", response_model=FindingOut)
def get_finding(finding_id: str, db: Session = Depends(get_db)):
    finding = db.query(Finding).filter(Finding.id == finding_id).first()
    if not finding:
        raise HTTPException(status_code=404, detail="Finding not found")
    return finding
