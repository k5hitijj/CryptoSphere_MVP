from datetime import datetime
from typing import List, Optional
from beanie import Document, Indexed, PydanticObjectId
from pydantic import BaseModel, Field

class PortfolioHolding(BaseModel):
    coin_id: str
    symbol: str
    quantity: float
    average_buy_price: float
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class LinkedBank(BaseModel):
    bank_name: str
    account_holder_name: str
    account_number: str
    routing_code: str
    account_last4: str
    is_linked: bool = True
    linked_at: datetime = Field(default_factory=datetime.utcnow)

class Portfolio(Document):
    user_id: Indexed(PydanticObjectId, unique=True)
    cash_balance: float = 100000.0  # Default $100,000.00 virtual funding
    holdings: List[PortfolioHolding] = []
    linked_bank: Optional[LinkedBank] = None

    class Settings:
        name = "portfolios"
