from typing import Optional
from beanie import PydanticObjectId
from app.models.settings import Settings

class SettingsRepository:
    async def get_by_user_id(self, user_id: PydanticObjectId) -> Optional[Settings]:
        return await Settings.find_one(Settings.user_id == user_id)

    async def get_or_create(self, user_id: PydanticObjectId) -> Settings:
        settings = await self.get_by_user_id(user_id)
        if not settings:
            settings = Settings(user_id=user_id)
            await settings.insert()
        return settings

    async def save(self, settings: Settings) -> Settings:
        return await settings.save()

settings_repo = SettingsRepository()
