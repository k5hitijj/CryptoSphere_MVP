from pydantic import BaseModel
from typing import List, Optional, Dict, Any

class CoinMarketDataSchema(BaseModel):
    id: str
    symbol: str
    name: str
    image: str
    current_price: float
    market_cap: float
    market_cap_rank: Optional[int] = None
    total_volume: float
    price_change_percentage_24h: Optional[float] = None
    high_24h: Optional[float] = None
    low_24h: Optional[float] = None

class DetailedCoinSchema(BaseModel):
    id: str
    symbol: str
    name: str
    description: str
    image: Optional[str] = None
    current_price: float
    market_cap: float
    market_cap_rank: Optional[int] = None
    total_volume: float
    price_change_percentage_24h: Optional[float] = None
    high_24h: Optional[float] = None
    low_24h: Optional[float] = None
    circulating_supply: float

class PricePoint(BaseModel):
    time: float
    price: float

class CoinHistoryResponse(BaseModel):
    prices: List[PricePoint]

class GlobalMarketOverviewSchema(BaseModel):
    active_cryptocurrencies: int
    total_market_cap_usd: float
    total_volume_usd: float
    market_cap_change_percentage_24h_usd: float
    btc_dominance: float

class TrendingCoinSchema(BaseModel):
    id: str
    name: str
    symbol: str
    large_image: str
    market_cap_rank: Optional[int] = None
    price_btc: float
