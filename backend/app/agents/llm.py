from langchain_groq import ChatGroq
from app.core.config import get_settings

settings = get_settings()


def get_extraction_llm() -> ChatGroq:
    """gemma2-9b-it: fast, cheap, used for the structured-field extraction pass."""
    return ChatGroq(
        api_key=settings.GROQ_API_KEY,
        model=settings.GROQ_EXTRACTION_MODEL,
        temperature=0,
    )


def get_chat_llm() -> ChatGroq:
    """llama-3.3-70b-versatile: stronger model, used for the conversational
    reply / free-form Q&A about the complaint."""
    return ChatGroq(
        api_key=settings.GROQ_API_KEY,
        model=settings.GROQ_CHAT_MODEL,
        temperature=0.3,
    )
