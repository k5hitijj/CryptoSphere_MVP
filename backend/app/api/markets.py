from fastapi import APIRouter, Depends, Query
from typing import List
from app.schemas.markets import CoinMarketDataSchema, DetailedCoinSchema, CoinHistoryResponse
from app.core.security import get_current_user
from app.models.user import User
from app.services.market_service import market_service

router = APIRouter(prefix="/markets", tags=["Markets"])

@router.get("", response_model=List[CoinMarketDataSchema])
async def get_markets(
    current_user: User = Depends(get_current_user),
    limit: int = Query(50, ge=1, le=250)
):
    """
    Returns live market metrics for top cryptocurrencies.
    """
    markets = await market_service.get_markets_data()
    return markets[:limit]

@router.get("/{coin}", response_model=DetailedCoinSchema)
async def get_coin_details(
    coin: str,
    current_user: User = Depends(get_current_user)
):
    """
    Returns full details for a single cryptocurrency (description, market caps, supply).
    """
    details = await market_service.get_coin_details(coin.lower())
    return details

@router.get("/{coin}/history", response_model=CoinHistoryResponse)
async def get_coin_history(
    coin: str,
    days: int = Query(7, ge=1, le=365),
    current_user: User = Depends(get_current_user)
):
    """
    Returns historical price array coordinates for rendering market charts.
    """
    history = await market_service.get_coin_history(coin.lower(), days)
    return history
