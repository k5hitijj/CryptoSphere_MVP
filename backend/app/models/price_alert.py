from datetime import datetime
from typing import Optional
from beanie import Document, Indexed, PydanticObjectId
from pydantic import Field

class PriceAlert(Document):
    user_id: Indexed(PydanticObjectId)
    coin_id: str
    target_price: float
    condition: str  # ABOVE or BELOW
    is_triggered: bool = False
    triggered_at: Optional[datetime] = None
    is_acknowledged: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "price_alerts"
