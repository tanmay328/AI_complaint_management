from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends
from sqlalchemy.sql import func # pyright: ignore[reportMissingImports]
from typing import Any, Optional
import json

from app.schemas.complaint import ChatRequest, ExtractionResult, ComplaintFields, DuplicateWarning
from app.agents.graph import extraction_agent
from app.core.document_parser import extract_text_from_file
from app.db.session import get_db
from app.models.complaint import Complaint

router = APIRouter(prefix="/api/assistant", tags=["assistant"])

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB, matches UI copy
ALLOWED_EXT = {"pdf", "docx", "txt", "eml"}


def _check_for_duplicate(db: Any, merged_fields: dict) -> Optional[DuplicateWarning]:
    """Duplicate Complaint Detection: flags a probable duplicate when a saved
    complaint already exists for the same product + batch/lot number. This is
    a simple, explainable heuristic (exact match on the two most identifying
    fields) rather than fuzzy/semantic matching, which keeps false positives
    low for a regulated QA workflow."""
    batch = merged_fields.get("batch_lot_number")
    product = merged_fields.get("product_name")
    if not batch or not product:
        return None

    existing = (
        db.query(Complaint)
        .filter(
            func.lower(Complaint.batch_lot_number) == batch.lower(),
            func.lower(Complaint.product_name) == product.lower(),
        )
        .order_by(Complaint.created_at.desc())
        .first()
    )
    if not existing:
        return None

    return DuplicateWarning(
        complaint_id=str(existing.id),
        customer_name=existing.customer_name,
        product_name=existing.product_name,
        batch_lot_number=existing.batch_lot_number,
        created_at=existing.created_at,
        reason=f"A complaint for {existing.product_name} (batch {existing.batch_lot_number}) "
        f"was already logged on {existing.created_at.strftime('%d %b %Y')}.",
    )


@router.post("/chat", response_model=ExtractionResult)
def chat(request: ChatRequest, db: Any = Depends(get_db)):
    """Conversational extraction: user types a message (e.g. pastes complaint
    text or asks a question) and the agent extracts/updates form fields and
    replies conversationally. This is the ONLY way fields get filled -
    no manual form entry."""
    if not request.message or not request.message.strip():
        raise HTTPException(400, "message cannot be empty")

    current_fields = request.current_fields.model_dump() if request.current_fields else {}

    result = extraction_agent.invoke({
        "user_message": request.message,
        "document_text": None,
        "current_fields": current_fields,
    })

    return ExtractionResult(
        fields=ComplaintFields(**result["merged_fields"]),
        assistant_reply=result["assistant_reply"],
        fields_updated=result["fields_updated"],
        missing_required_fields=result["missing_required_fields"],
        capa_recommendation=result.get("capa_recommendation"),
        duplicate_warning=_check_for_duplicate(db, result["merged_fields"]),
    )


@router.post("/upload", response_model=ExtractionResult)
async def upload_document(
    file: UploadFile = File(...),
    current_fields: Optional[str] = Form(None),  # JSON string from frontend
    db: Any = Depends(get_db),
):
    """Drag-and-drop / browse upload of a complaint document (PDF, DOCX, TXT, EML).
    Extracts text, runs it through the same LangGraph extraction agent used by chat."""
    filename = file.filename or ""
    ext = filename.lower().rsplit(".", 1)[-1] if "." in filename else ""
    if ext not in ALLOWED_EXT:
        raise HTTPException(400, f"Unsupported file type '.{ext}'. Supported: PDF, DOCX, TXT, EML")

    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(400, "File exceeds 10MB limit")

    document_text = extract_text_from_file(filename, content)
    if not document_text.strip():
        raise HTTPException(422, "Could not extract any text from the uploaded document")

    parsed_current = json.loads(current_fields) if current_fields else {}

    result = extraction_agent.invoke({
        "user_message": f"[Uploaded document: {file.filename}]",
        "document_text": document_text,
        "current_fields": parsed_current,
    })

    return ExtractionResult(
        fields=ComplaintFields(**result["merged_fields"]),
        assistant_reply=result["assistant_reply"],
        fields_updated=result["fields_updated"],
        missing_required_fields=result["missing_required_fields"],
        capa_recommendation=result.get("capa_recommendation"),
        duplicate_warning=_check_for_duplicate(db, result["merged_fields"]),
    )
