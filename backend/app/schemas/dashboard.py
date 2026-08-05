from pydantic import BaseModel
from typing import List
from app.schemas.portfolio import PortfolioSummaryResponse, TransactionResponseSchema
from app.schemas.markets import CoinMarketDataSchema, GlobalMarketOverviewSchema, TrendingCoinSchema

class DashboardDataResponse(BaseModel):
    portfolio: PortfolioSummaryResponse
    trending: List[TrendingCoinSchema]
    gainers: List[CoinMarketDataSchema]
    losers: List[CoinMarketDataSchema]
    global_market: GlobalMarketOverviewSchema
    recent_transactions: List[TransactionResponseSchema]

class DashboardSummaryResponse(BaseModel):
    total_portfolio_value: float
    cash_balance: float
    total_holdings_value: float
    total_profit_loss: float
    total_profit_loss_percentage: float
