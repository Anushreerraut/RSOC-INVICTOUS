from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    APP_NAME: str = "RSOC - API Security Scanner"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True

    # Database
    DATABASE_URL: str = "sqlite:///./rsoc.db"

    # Security
    SECRET_KEY: str = "rsoc-super-secret-key-change-in-production-32chars"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    # Scanner defaults
    SCAN_TIMEOUT: int = 30  # seconds per request
    SCAN_MAX_CONCURRENT: int = 10
    RATE_LIMIT_TEST_COUNT: int = 50

    class Config:
        env_file = ".env"


settings = Settings()
