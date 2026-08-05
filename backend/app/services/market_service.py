import httpx
import time
from typing import Dict, List, Any, Optional
import logging

logger = logging.getLogger("cryptosphere.market_service")

# CoinGecko coin IDs mapping
COIN_IDS = {
    "btc": "bitcoin",
    "eth": "ethereum",
    "sol": "solana",
    "usdt": "tether"
}

class MarketService:
    def __init__(self):
        # Cache format: { key: (expiry_timestamp, data) }
        self._cache: Dict[str, tuple[float, Any]] = {}
        # In-memory backup in case of API failure (never expires)
        self._backup_store: Dict[str, Any] = {}
        
        self.base_url = "https://api.coingecko.com/api/v3"
        self.client = httpx.AsyncClient(timeout=10.0)

    def _get_cache(self, key: str) -> Optional[Any]:
        if key in self._cache:
            expiry, data = self._cache[key]
            if time.time() < expiry:
                return data
        return None

    def _set_cache(self, key: str, data: Any, ttl_seconds: int):
        self._cache[key] = (time.time() + ttl_seconds, data)
        self._backup_store[key] = data

    def _get_backup(self, key: str) -> Optional[Any]:
        return self._backup_store.get(key)

    async def _fetch_from_api(self, endpoint: str, params: Optional[Dict[str, Any]] = None) -> Any:
        url = f"{self.base_url}/{endpoint.lstrip('/')}"
        
        # Add API Key if configured (CoinGecko Demo or Pro plan)
        headers = {}
        from app.core.config import settings
        if settings.COINGECKO_API_KEY:
            headers["x-cg-demo-api-key"] = settings.COINGECKO_API_KEY
        
        try:
            response = await self.client.get(url, params=params, headers=headers)
            if response.status_code == 200:
                return response.json()
            elif response.status_code == 429:
                logger.warning(f"CoinGecko API Rate Limit (429) hit at endpoint: {endpoint}")
                raise httpx.HTTPStatusError("Rate Limit", request=response.request, response=response)
            else:
                logger.error(f"CoinGecko API returned status {response.status_code}: {response.text}")
                response.raise_for_status()
        except Exception as e:
            logger.error(f"Error fetching from CoinGecko API: {e}")
            raise e

    async def get_supported_coin_prices(self) -> Dict[str, float]:
        """
        Fetches current USD prices for supported coins (bitcoin, ethereum, solana, tether).
        Cache duration: 30-60 seconds.
        """
        cache_key = "supported_coin_prices"
        cached = self._get_cache(cache_key)
        if cached:
            return cached

        ids = ",".join(COIN_IDS.values())
        try:
            data = await self._fetch_from_api(
                "simple/price",
                params={"ids": ids, "vs_currencies": "usd"}
            )
            prices = {
                "bitcoin": data.get("bitcoin", {}).get("usd", 0.0),
                "ethereum": data.get("ethereum", {}).get("usd", 0.0),
                "solana": data.get("solana", {}).get("usd", 0.0),
                "tether": data.get("tether", {}).get("usd", 1.0)
            }
            # Cache for 30 seconds
            self._set_cache(cache_key, prices, ttl_seconds=30)
            
            # Trigger price alerts check
            try:
                from app.services.alerts_service import alerts_service
                for coin, val in prices.items():
                    await alerts_service.check_price_triggers(coin, val)
            except Exception as alert_err:
                logger.error(f"Error checking price alerts in simple price check: {alert_err}")

            return prices
        except Exception:
            backup = self._get_backup(cache_key)
            if backup:
                logger.info("Serving supported coin prices from stale backup store")
                return backup
            # Return hardcoded placeholders if absolutely offline
            return {
                "bitcoin": 65000.0,
                "ethereum": 3400.0,
                "solana": 140.0,
                "tether": 1.0
            }

    async def get_markets_data(self) -> List[Dict[str, Any]]:
        """
        Fetches full markets data for top 50 coins to support global dashboards, sorting, filtering,
        gainers, and losers calculation.
        Cache duration: 60 seconds.
        """
        cache_key = "markets_data"
        cached = self._get_cache(cache_key)
        if cached:
            return cached

        try:
            data = await self._fetch_from_api(
                "coins/markets",
                params={
                    "vs_currency": "usd",
                    "order": "market_cap_desc",
                    "per_page": 50,
                    "page": 1,
                    "sparkline": "false",
                    "price_change_percentage": "24h"
                }
            )
            # Cache for 60 seconds
            self._set_cache(cache_key, data, ttl_seconds=60)
            return data
        except Exception:
            backup = self._get_backup(cache_key)
            if backup:
                logger.info("Serving market list from stale backup store")
                return backup
            # Empty list fallback
            return []

    async def get_global_market_overview(self) -> Dict[str, Any]:
        """
        Fetches global crypto statistics (BTC Dominance, Active Cryptos, Market Cap, 24h Vol).
        Cache duration: 10 minutes (600 seconds).
        """
        cache_key = "global_market"
        cached = self._get_cache(cache_key)
        if cached:
            return cached

        try:
            response = await self._fetch_from_api("global")
            data = response.get("data", {})
            result = {
                "active_cryptocurrencies": data.get("active_cryptocurrencies", 0),
                "total_market_cap_usd": data.get("total_market_cap", {}).get("usd", 0.0),
                "total_volume_usd": data.get("total_volume", {}).get("usd", 0.0),
                "market_cap_change_percentage_24h_usd": data.get("market_cap_change_percentage_24h_usd", 0.0),
                "btc_dominance": data.get("market_cap_percentage", {}).get("btc", 0.0)
            }
            self._set_cache(cache_key, result, ttl_seconds=600)
            return result
        except Exception:
            backup = self._get_backup(cache_key)
            if backup:
                return backup
            return {
                "active_cryptocurrencies": 14000,
                "total_market_cap_usd": 2.4e12,
                "total_volume_usd": 8.5e10,
                "market_cap_change_percentage_24h_usd": 1.25,
                "btc_dominance": 54.2
            }

    async def get_trending_coins(self) -> List[Dict[str, Any]]:
        """
        Fetches search/trending list of hot searches.
        Cache duration: 10 minutes.
        """
        cache_key = "trending_coins"
        cached = self._get_cache(cache_key)
        if cached:
            return cached

        try:
            data = await self._fetch_from_api("search/trending")
            coins = []
            for item in data.get("coins", [])[:7]: # limit to 7 items
                coin_data = item.get("item", {})
                coins.append({
                    "id": coin_data.get("id"),
                    "name": coin_data.get("name"),
                    "symbol": coin_data.get("symbol"),
                    "large_image": coin_data.get("large"),
                    "market_cap_rank": coin_data.get("market_cap_rank"),
                    "price_btc": coin_data.get("price_btc", 0.0)
                })
            self._set_cache(cache_key, coins, ttl_seconds=600)
            return coins
        except Exception:
            backup = self._get_backup(cache_key)
            return backup if backup else []

    async def get_coin_details(self, coin_id: str) -> Dict[str, Any]:
        """
        Fetches details description and stats for a specific coin.
        Cache duration: 10 minutes.
        """
        cache_key = f"coin_details_{coin_id}"
        cached = self._get_cache(cache_key)
        if cached:
            return cached

        try:
            data = await self._fetch_from_api(
                f"coins/{coin_id}",
                params={
                    "localization": "false",
                    "tickers": "false",
                    "market_data": "true",
                    "community_data": "false",
                    "developer_data": "false",
                    "sparkline": "false"
                }
            )
            market_data = data.get("market_data", {})
            result = {
                "id": data.get("id"),
                "symbol": data.get("symbol"),
                "name": data.get("name"),
                "description": data.get("description", {}).get("en", ""),
                "image": data.get("image", {}).get("large"),
                "current_price": market_data.get("current_price", {}).get("usd", 0.0),
                "market_cap": market_data.get("market_cap", {}).get("usd", 0.0),
                "market_cap_rank": market_data.get("market_cap_rank"),
                "total_volume": market_data.get("total_volume", {}).get("usd", 0.0),
                "price_change_percentage_24h": market_data.get("price_change_percentage_24h", 0.0),
                "high_24h": market_data.get("high_24h", {}).get("usd", 0.0),
                "low_24h": market_data.get("low_24h", {}).get("usd", 0.0),
                "circulating_supply": market_data.get("circulating_supply", 0.0)
            }
            self._set_cache(cache_key, result, ttl_seconds=600)
            return result
        except Exception:
            backup = self._get_backup(cache_key)
            if backup:
                return backup
            # Fake fallback
            return {
                "id": coin_id,
                "symbol": coin_id[:3],
                "name": coin_id.capitalize(),
                "description": "Details temporarily unavailable.",
                "image": "",
                "current_price": 0.0,
                "market_cap": 0.0,
                "market_cap_rank": 999,
                "total_volume": 0.0,
                "price_change_percentage_24h": 0.0,
                "high_24h": 0.0,
                "low_24h": 0.0,
                "circulating_supply": 0.0
            }

    async def get_coin_history(self, coin_id: str, days: int = 7) -> Dict[str, Any]:
        """
        Fetches historical price list for Recharts.
        Cache duration: 1 hour (3600 seconds).
        """
        cache_key = f"coin_history_{coin_id}_{days}"
        cached = self._get_cache(cache_key)
        if cached:
            return cached

        try:
            data = await self._fetch_from_api(
                f"coins/{coin_id}/market_chart",
                params={"vs_currency": "usd", "days": str(days)}
            )
            prices = data.get("prices", [])
            # Map elements into structured list
            formatted_prices = [{"time": p[0], "price": p[1]} for p in prices]
            result = {"prices": formatted_prices}
            self._set_cache(cache_key, result, ttl_seconds=3600)
            return result
        except Exception:
            backup = self._get_backup(cache_key)
            if backup:
                return backup
            return {"prices": []}

    async def close(self):
        await self.client.aclose()

market_service = MarketService()
