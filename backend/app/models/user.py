from datetime import datetime
from typing import Optional
from beanie import Document, Indexed
from pydantic import Field

class User(Document):
    google_id: Indexed(str, unique=True)
    email: Indexed(str, unique=True)
    name: str
    avatar: Optional[str] = None
    last_login: datetime = Field(default_factory=datetime.utcnow)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "users"
