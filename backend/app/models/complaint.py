import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, Float, DateTime, Enum
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.types import CHAR, TypeDecorator
import enum
from app.db.session import Base


class GUID(TypeDecorator):
    """Platform-independent UUID type: Postgres UUID, else CHAR(36), so this
    model works unmodified on either Postgres or MySQL."""
    impl = CHAR
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == "postgresql":
            return dialect.type_descriptor(PG_UUID())
        return dialect.type_descriptor(CHAR(36))

    def process_bind_param(self, value, dialect):
        if value is None:
            return value
        return str(value)

    def process_result_value(self, value, dialect):
        if value is None:
            return value
        return str(value)


class SeverityEnum(str, enum.Enum):
    low = "Low"
    medium = "Medium"
    high = "High"
    critical = "Critical"


class PriorityEnum(str, enum.Enum):
    low = "Low"
    normal = "Normal"
    high = "High"
    urgent = "Urgent"


class StatusEnum(str, enum.Enum):
    pending_triage = "Pending Triage"
    in_review = "In Review"
    investigating = "Investigating"
    resolved = "Resolved"
    closed = "Closed"


class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(GUID(), primary_key=True, default=lambda: str(uuid.uuid4()))

    # 1. Origin & Customer Details
    complaint_source = Column(String(255))
    customer_name = Column(String(255))

    # 2. Product & Batch Identification
    product_name = Column(String(255))
    product_strength_grade = Column(String(255))
    batch_lot_number = Column(String(255))
    manufacturing_date = Column(DateTime, nullable=True)
    expiry_date = Column(DateTime, nullable=True)
    quantity_affected = Column(Float, nullable=True)
    quantity_unit = Column(String(20), default="kg")

    # 3. Complaint Details
    complaint_type = Column(String(255))
    complaint_date = Column(DateTime, nullable=True)
    detailed_complaint_description = Column(Text)

    # 4. Initial Assessment & Priority
    initial_severity = Column(String(50))
    priority = Column(String(50))

    status = Column(String(50), default=StatusEnum.pending_triage.value)

    raw_source_text = Column(Text, nullable=True)  # original pasted/extracted text
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(GUID(), primary_key=True, default=lambda: str(uuid.uuid4()))
    complaint_id = Column(GUID(), nullable=True)
    role = Column(String(20))  # user | assistant
    content = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
