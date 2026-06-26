"""
CustomerIQ - Configuration
Loads and validates environment variables from the .env file using Pydantic.
"""

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    DATABASE_URL: str = Field(default="postgresql+asyncpg://postgres:postgres@localhost:5432/customeriq")
    JWT_SECRET: str = Field(default="4289cf49f3e498c47fcf642be482e9b04fcf138e057ba1c9c4fb2639a0459da7")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=60)
    ALLOWED_ORIGINS: str = Field(default="http://localhost:5173,http://127.0.0.1:5173")

    @property
    def cors_origins(self) -> List[str]:
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",") if origin.strip()]

settings = Settings()
