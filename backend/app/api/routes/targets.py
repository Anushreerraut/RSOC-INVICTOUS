from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.models.target import Target
from app.schemas.schemas import TargetCreate, TargetOut

router = APIRouter(prefix="/targets", tags=["Targets"])


@router.post("", response_model=TargetOut, status_code=201)
def create_target(body: TargetCreate, db: Session = Depends(get_db)):
    target = Target(**body.model_dump())
    db.add(target)
    db.commit()
    db.refresh(target)
    return target


@router.get("", response_model=List[TargetOut])
def list_targets(db: Session = Depends(get_db)):
    return db.query(Target).order_by(Target.created_at.desc()).all()


@router.get("/{target_id}", response_model=TargetOut)
def get_target(target_id: str, db: Session = Depends(get_db)):
    target = db.query(Target).filter(Target.id == target_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="Target not found")
    return target


@router.delete("/{target_id}", status_code=204)
def delete_target(target_id: str, db: Session = Depends(get_db)):
    target = db.query(Target).filter(Target.id == target_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="Target not found")
    db.delete(target)
    db.commit()
