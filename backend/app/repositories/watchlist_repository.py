from typing import Optional
from beanie import PydanticObjectId
from app.models.watchlist import Watchlist

class WatchlistRepository:
    async def get_by_user_id(self, user_id: PydanticObjectId) -> Optional[Watchlist]:
        return await Watchlist.find_one(Watchlist.user_id == user_id)

    async def get_or_create(self, user_id: PydanticObjectId) -> Watchlist:
        watchlist = await self.get_by_user_id(user_id)
        if not watchlist:
            watchlist = Watchlist(user_id=user_id, coins=[])
            await watchlist.insert()
        return watchlist

    async def update_coins(self, user_id: PydanticObjectId, coins: list[str]) -> Watchlist:
        watchlist = await self.get_or_create(user_id)
        watchlist.coins = coins
        return await watchlist.save()

watchlist_repo = WatchlistRepository()
