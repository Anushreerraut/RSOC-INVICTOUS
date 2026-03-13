from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.models.review import Review
from app.schemas.schemas import ReviewCreate, ReviewOut

router = APIRouter(prefix="/reviews", tags=["Reviews"])


@router.post("", response_model=ReviewOut, status_code=201)
def create_review(body: ReviewCreate, db: Session = Depends(get_db)):
    review = Review(
        user_name=body.user_name,
        rating=body.rating,
        comment=body.comment
    )
    db.add(review)
    db.commit()
    db.refresh(review)
    return review


@router.get("", response_model=List[ReviewOut])
def list_reviews(limit: int = 50, db: Session = Depends(get_db)):
    return db.query(Review).order_by(Review.created_at.desc()).limit(limit).all()
