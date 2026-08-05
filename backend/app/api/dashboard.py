from fastapi import APIRouter, Depends
from app.schemas.dashboard import DashboardDataResponse, DashboardSummaryResponse
from app.core.security import get_current_user
from app.models.user import User
from app.services.portfolio_service import portfolio_service
from app.services.market_service import market_service
import logging

logger = logging.getLogger("cryptosphere.api.dashboard")
router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("", response_model=DashboardDataResponse)
async def get_dashboard(current_user: User = Depends(get_current_user)):
    """
    Returns full dashboard aggregates (portfolio statistics, trending coins,
    top gainers/losers, global market figures, and recent transaction history).
    """
    # 1. Fetch user portfolio summaries
    portfolio_summary = await portfolio_service.get_portfolio_summary(current_user.id)
    
    # 2. Fetch global market overview
    global_market = await market_service.get_global_market_overview()
    
    # 3. Fetch trending coins
    trending = await market_service.get_trending_coins()
    
    # 4. Fetch market list for gainers/losers
    market_list = await market_service.get_markets_data()
    
    # Filter gainers & losers
    # Safe sorting by price_change_percentage_24h, handling None values
    sorted_markets = sorted(
        [m for m in market_list if m.get("price_change_percentage_24h") is not None],
        key=lambda x: x["price_change_percentage_24h"],
        reverse=True
    )
    
    gainers = sorted_markets[:5]
    losers = sorted_markets[-5:][::-1]  # Bottom 5 sorted from worst to less bad, reversed to show worst first
    
    # 5. Fetch recent transactions (limit = 5)
    tx_history = await portfolio_service.get_transaction_history(current_user.id, limit=5)
    
    return {
        "portfolio": portfolio_summary,
        "trending": trending,
        "gainers": gainers,
        "losers": losers,
        "global_market": global_market,
        "recent_transactions": tx_history["transactions"]
    }

@router.get("/summary", response_model=DashboardSummaryResponse)
async def get_dashboard_summary(current_user: User = Depends(get_current_user)):
    """
    Returns a lightweight summary of total portfolio values and profit/losses.
    """
    portfolio_summary = await portfolio_service.get_portfolio_summary(current_user.id)
    
    return {
        "total_portfolio_value": portfolio_summary["total_portfolio_value"],
        "cash_balance": portfolio_summary["cash_balance"],
        "total_holdings_value": portfolio_summary["total_holdings_value"],
        "total_profit_loss": portfolio_summary["total_profit_loss"],
        "total_profit_loss_percentage": portfolio_summary["total_profit_loss_percentage"]
    }
