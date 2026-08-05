from fastapi import APIRouter, Depends, Query
from app.schemas.portfolio import (
    PortfolioSummaryResponse, 
    TradeRequest, 
    TradeResponse, 
    PaginatedTransactionsResponse, 
    TransferRequest
)
from app.core.security import get_current_user
from app.models.user import User
from app.services.portfolio_service import portfolio_service

router = APIRouter(prefix="/portfolio", tags=["Portfolio"])

@router.get("", response_model=PortfolioSummaryResponse)
async def get_portfolio(current_user: User = Depends(get_current_user)):
    """
    Returns user portfolio summary, including current balances and holding assets.
    """
    return await portfolio_service.get_portfolio_summary(current_user.id)

@router.post("/buy", response_model=TradeResponse)
async def buy_asset(
    payload: TradeRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Executes a simulated paper purchase. Updates cost-basis, cash, and logs a BUY transaction.
    """
    return await portfolio_service.buy_asset(
        user_id=current_user.id,
        coin_id=payload.coin_id.lower(),
        quantity=payload.quantity
    )

@router.post("/sell", response_model=TradeResponse)
async def sell_asset(
    payload: TradeRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Executes a simulated paper sale. Updates cash, remaining quantities, and logs a SELL transaction.
    """
    return await portfolio_service.sell_asset(
        user_id=current_user.id,
        coin_id=payload.coin_id.lower(),
        quantity=payload.quantity
    )

@router.get("/history", response_model=PaginatedTransactionsResponse)
async def get_portfolio_history(
    current_user: User = Depends(get_current_user),
    limit: int = Query(50, ge=1, le=100),
    skip: int = Query(0, ge=0)
):
    """
    Returns the user's transaction history ledger.
    """
    return await portfolio_service.get_transaction_history(
        user_id=current_user.id,
        limit=limit,
        skip=skip
    )

@router.post("/transfer")
async def transfer_assets(
    payload: TransferRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Executes a P2P transfer of USD cash or crypto holdings to another registered user.
    """
    return await portfolio_service.transfer_assets(
        sender_id=current_user.id,
        recipient_email=payload.recipient_email,
        asset_type=payload.asset_type,
        amount=payload.amount
    )

@router.get("/analytics")
async def get_portfolio_analytics(current_user: User = Depends(get_current_user)):
    """
    Returns risk analytics metrics for user's portfolio.
    """
    return await portfolio_service.get_portfolio_analytics(current_user.id)

