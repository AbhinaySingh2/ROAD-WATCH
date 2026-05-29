from pydantic_settings import BaseSettings
from typing import Optional, List

class Settings(BaseSettings):
    PROJECT_NAME: str = "RoadWatch API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # SQLite Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./roadwatch.db"
    
    # Gemini API Key
    GEMINI_API_KEY: Optional[str] = None
    
    # CORS
    # Comma-separated list of allowed origins. If empty, defaults to localhost dev origins.
    CORS_ALLOW_ORIGINS: Optional[str] = None

    # JWT Auth Settings
    SECRET_KEY: str = "CHANGE_ME"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    # Admin auth (hackathon default; override in env for any real deployment)
    ADMIN_EMAIL: str = "admin@roadwatch.com"
    ADMIN_PASSWORD: str = "CHANGE_ME"
    ADMIN_PASSWORD_HASH: Optional[str] = None
    
    class Config:
        env_file = ".env"

settings = Settings()

def cors_allowed_origins() -> List[str]:
    if settings.CORS_ALLOW_ORIGINS:
        return [o.strip() for o in settings.CORS_ALLOW_ORIGINS.split(",") if o.strip()]
    return [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
    ]
