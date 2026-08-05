from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from beanie import PydanticObjectId

class AlertCreateRequest(BaseModel):
    coin_id: str = Field(..., description="ID of the coin from CoinGecko, e.g. bitcoin")
    target_price: float = Field(..., description="Price threshold to trigger alert")
    condition: str = Field(..., description="Trigger condition: ABOVE or BELOW")

class AlertResponseSchema(BaseModel):
    id: PydanticObjectId
    user_id: PydanticObjectId
    coin_id: str
    target_price: float
    condition: str
    is_triggered: bool
    triggered_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True

class AlertNotificationSchema(BaseModel):
    id: PydanticObjectId
    coin_id: str
    target_price: float
    condition: str
    triggered_at: datetime

    class Config:
        from_attributes = True
