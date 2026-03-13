from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.models.scan import Scan, ScanStatus
from app.schemas.schemas import ScanCreate, ScanOut
from app.scanner.engine import run_scan_background

router = APIRouter(prefix="/scans", tags=["Scans"])


@router.post("", response_model=ScanOut, status_code=201)
def create_scan(body: ScanCreate, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    scan = Scan(
        target_url=body.target_url,
        scan_type=body.scan_type,
        spec_content=body.spec_content,
        target_id=body.target_id,
        config=body.config,
        summary={},
        status=ScanStatus.queued,
    )
    db.add(scan)
    db.commit()
    db.refresh(scan)
    # Run scan in background
    background_tasks.add_task(run_scan_background, scan.id)
    return scan


@router.get("", response_model=List[ScanOut])
def list_scans(limit: int = 50, db: Session = Depends(get_db)):
    return db.query(Scan).order_by(Scan.created_at.desc()).limit(limit).all()


@router.get("/{scan_id}", response_model=ScanOut)
def get_scan(scan_id: str, db: Session = Depends(get_db)):
    scan = db.query(Scan).filter(Scan.id == scan_id).first()
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")
    return scan


@router.delete("/{scan_id}", status_code=204)
def delete_scan(scan_id: str, db: Session = Depends(get_db)):
    scan = db.query(Scan).filter(Scan.id == scan_id).first()
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")
    db.delete(scan)
    db.commit()
