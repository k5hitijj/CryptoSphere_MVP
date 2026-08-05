from pydantic import BaseModel
from typing import Optional

class NotificationsConfigSchema(BaseModel):
    price_alerts: bool
    weekly_digest: bool

class SettingsSchema(BaseModel):
    theme: str
    currency: str
    notifications: NotificationsConfigSchema

    class Config:
        from_attributes = True

class SettingsUpdateSchema(BaseModel):
    theme: Optional[str] = None
    currency: Optional[str] = None
    notifications: Optional[NotificationsConfigSchema] = None
