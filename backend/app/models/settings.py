from beanie import Document, Indexed, PydanticObjectId
from pydantic import BaseModel

class NotificationsConfig(BaseModel):
    price_alerts: bool = False
    weekly_digest: bool = False

class Settings(Document):
    user_id: Indexed(PydanticObjectId, unique=True)
    theme: str = "dark"
    currency: str = "USD"
    notifications: NotificationsConfig = NotificationsConfig()

    class Settings:
        name = "settings"
