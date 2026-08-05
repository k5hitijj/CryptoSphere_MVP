from datetime import datetime
from beanie import Document, Indexed
from pydantic import Field

class AuthorisedUser(Document):
    email: Indexed(str, unique=True)
    role: str = "user"
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "authorised_users"
