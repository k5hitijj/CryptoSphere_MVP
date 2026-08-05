import os
import json
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field, field_validator

class Settings(BaseSettings):
    PROJECT_NAME: str = "CryptoSphere API"
    API_V1_STR: str = "/api/v1"
    
    # Security
    JWT_SECRET_KEY: str = Field(default="")
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    # OAuth
    GOOGLE_CLIENT_ID: str = Field(default="")
    
    # Database
    MONGODB_URL: str = Field(default="mongodb://localhost:27017")
    DATABASE_NAME: str = "cryptosphere"
    
    # CoinGecko
    COINGECKO_API_KEY: str = ""
    
    # CORS
    CORS_ORIGINS: List[str] = Field(default_factory=list)
    
    # Initial whitelisted emails for the 4 users
    WHITELISTED_EMAILS: List[str] = Field(default_factory=list)

    @field_validator("CORS_ORIGINS", "WHITELISTED_EMAILS", mode="before")
    @classmethod
    def parse_list(cls, v):
        if isinstance(v, str):
            v = v.strip()
            if not v:
                return []
            if v.startswith("[") and v.endswith("]"):
                try:
                    return json.loads(v)
                except Exception:
                    pass
            return [x.strip() for x in v.split(",") if x.strip()]
        return v

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )

settings = Settings()
