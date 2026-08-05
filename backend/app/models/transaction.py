from datetime import datetime
from typing import Optional
from beanie import Document, Indexed, PydanticObjectId
from pydantic import Field

class Transaction(Document):
    user_id: Indexed(PydanticObjectId)
    coin_id: Optional[str] = None  # None for cash deposit/withdraw
    type: str  # "BUY", "SELL", "DEPOSIT", "WITHDRAW"
    quantity: float  # 0 for cash deposit/withdraw
    price: float  # 0 for cash deposit/withdraw
    total: float  # direct cash impact or quantity * price
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "transactions"
        indexes = [
            # Compound index for fast transaction history lookups
            [("user_id", 1), ("created_at", -1)]
        ]
