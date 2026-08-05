from beanie import Document, Indexed, PydanticObjectId
from typing import List

class Watchlist(Document):
    user_id: Indexed(PydanticObjectId, unique=True)
    coins: List[str] = []  # Array of CoinGecko coin IDs

    class Settings:
        name = "watchlists"
