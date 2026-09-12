from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class ComplaintFields(BaseModel):
    """The exact fields shown in the 4-section form on the left panel.
    All optional because AI extraction fills them progressively —
    the frontend shows 'Awaiting AI extraction...' until populated."""

    # 1. Origin & Customer Details
    complaint_source: Optional[str] = None
    customer_name: Optional[str] = None

    # 2. Product & Batch Identification
    product_name: Optional[str] = None
    product_strength_grade: Optional[str] = None
    batch_lot_number: Optional[str] = None
    manufacturing_date: Optional[str] = None
    expiry_date: Optional[str] = None
    quantity_affected: Optional[float] = None
    quantity_unit: Optional[str] = "kg"

    # 3. Complaint Details
    complaint_type: Optional[str] = None
    complaint_date: Optional[str] = None
    detailed_complaint_description: Optional[str] = None

    # 4. Initial Assessment & Priority
    initial_severity: Optional[str] = None
    priority: Optional[str] = None


class ComplaintCreate(ComplaintFields):
    raw_source_text: Optional[str] = None


class ComplaintOut(BaseModel):
    id: str
    status: str
    created_at: datetime
    updated_at: datetime

    # Section 1
    complaint_source: Optional[str] = None
    customer_name: Optional[str] = None

    # Section 2
    product_name: Optional[str] = None
    product_strength_grade: Optional[str] = None
    batch_lot_number: Optional[str] = None
    manufacturing_date: Optional[datetime] = None
    expiry_date: Optional[datetime] = None
    quantity_affected: Optional[float] = None
    quantity_unit: Optional[str] = "kg"

    # Section 3
    complaint_type: Optional[str] = None
    complaint_date: Optional[datetime] = None
    detailed_complaint_description: Optional[str] = None

    # Section 4
    initial_severity: Optional[str] = None
    priority: Optional[str] = None

    class Config:
        from_attributes = True


class ChatRequest(BaseModel):
    message: str
    complaint_id: Optional[str] = None
    # current state of the form on the frontend, so the agent knows
    # what's already filled vs. still missing
    current_fields: Optional[ComplaintFields] = None


class DuplicateWarning(BaseModel):
    """Populated when the newly extracted complaint appears to match an
    already-saved complaint on product + batch/lot number."""
    complaint_id: str
    customer_name: Optional[str] = None
    product_name: Optional[str] = None
    batch_lot_number: Optional[str] = None
    created_at: datetime
    reason: str


class ExtractionResult(BaseModel):
    fields: ComplaintFields
    assistant_reply: str
    fields_updated: list[str] = Field(default_factory=list)
    missing_required_fields: list[str] = Field(default_factory=list)
    capa_recommendation: Optional[str] = None
    duplicate_warning: Optional[DuplicateWarning] = None
