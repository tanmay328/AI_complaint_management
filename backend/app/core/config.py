from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+psycopg2://postgres:postgres@localhost:5432/complaint_mgmt"
    GROQ_API_KEY: str = ""
    GROQ_EXTRACTION_MODEL: str = "openai/gpt-oss-20b"
    GROQ_CHAT_MODEL: str = "openai/gpt-oss-120b"
    FRONTEND_ORIGIN: str = "http://localhost:5173"

    class Config:
        env_file = ".env"


@lru_cache
def get_settings() -> Settings:
    return Settings()
