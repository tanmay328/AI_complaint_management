from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.db.session import Base, engine
from app.models import complaint  # noqa: F401 - registers models on Base
from app.api import assistant, complaints

settings = get_settings()

app = FastAPI(
    title="Pharma Customer Complaint Management API",
    description="API & FDF Quality Assurance Module - AI-powered complaint intake",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_ORIGIN, "http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(assistant.router)
app.include_router(complaints.router)


@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)


@app.get("/health")
def health():
    return {"status": "ok"}
