from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List

from app.db.session import get_db
from app.models.complaint import Complaint
from app.schemas.complaint import ComplaintCreate, ComplaintOut

router = APIRouter(prefix="/api/complaints", tags=["complaints"])


def _parse_date(value):
    if not value:
        return None
    try:
        return datetime.fromisoformat(value)
    except (ValueError, TypeError):
        return None


@router.post("", response_model=ComplaintOut)
def save_complaint(payload: ComplaintCreate, db: Session = Depends(get_db)):
    """'Save Complaint' button - persists the AI-populated form."""
    data = payload.model_dump()
    data["manufacturing_date"] = _parse_date(data.get("manufacturing_date"))
    data["expiry_date"] = _parse_date(data.get("expiry_date"))
    data["complaint_date"] = _parse_date(data.get("complaint_date"))

    complaint = Complaint(**data)
    db.add(complaint)
    db.commit()
    db.refresh(complaint)
    return complaint


@router.get("", response_model=List[ComplaintOut])
def list_complaints(db: Session = Depends(get_db)):
    return db.query(Complaint).order_by(Complaint.created_at.desc()).all()


@router.get("/{complaint_id}", response_model=ComplaintOut)
def get_complaint(complaint_id: str, db: Session = Depends(get_db)):
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(404, "Complaint not found")
    return complaint
