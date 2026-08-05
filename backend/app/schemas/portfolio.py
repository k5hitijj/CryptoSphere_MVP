from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from beanie import PydanticObjectId

class TradeRequest(BaseModel):
    coin_id: str = Field(..., description="ID of the cryptocurrency from CoinGecko (e.g. bitcoin)")
    quantity: float = Field(..., description="Quantity of coins to simulate buying/selling")

class TradeResponse(BaseModel):
    status: str
    message: str
    transaction_id: str
    cash_balance: float
    quantity_held: float

class HoldingSummarySchema(BaseModel):
    coin_id: str
    symbol: str
    quantity: float
    average_buy_price: float
    current_price: float
    current_value: float
    cost_basis: float
    profit_loss: float
    profit_loss_percentage: float
    updated_at: datetime

class PortfolioSummaryResponse(BaseModel):
    user_id: PydanticObjectId
    cash_balance: float
    total_holdings_value: float
    total_portfolio_value: float
    total_profit_loss: float
    total_profit_loss_percentage: float
    holdings: List[HoldingSummarySchema]

class TransactionResponseSchema(BaseModel):
    id: PydanticObjectId
    user_id: PydanticObjectId
    coin_id: Optional[str] = None
    type: str  # BUY, SELL, DEPOSIT, WITHDRAW
    quantity: float
    price: float
    total: float
    created_at: datetime

    class Config:
        from_attributes = True

class PaginatedTransactionsResponse(BaseModel):
    transactions: List[TransactionResponseSchema]
    total_count: int
    limit: int
    skip: int

class TransferRequest(BaseModel):
    recipient_email: str
    asset_type: str  # "USD" or coin_id
    amount: float
