from fastapi import APIRouter, Depends
from app.schemas.settings import SettingsSchema, SettingsUpdateSchema
from app.core.security import get_current_user
from app.models.user import User
from app.repositories.settings_repository import settings_repo
import logging

logger = logging.getLogger("cryptosphere.api.settings")
router = APIRouter(prefix="/settings", tags=["Settings"])

@router.get("", response_model=SettingsSchema)
async def get_settings(current_user: User = Depends(get_current_user)):
    """
    Returns visual preferences for user.
    """
    return await settings_repo.get_or_create(current_user.id)

@router.patch("", response_model=SettingsSchema)
async def update_settings(
    payload: SettingsUpdateSchema,
    current_user: User = Depends(get_current_user)
):
    """
    Updates visual preferences (e.g. theme, currency base, notifications).
    """
    settings_record = await settings_repo.get_or_create(current_user.id)
    
    if payload.theme is not None:
        settings_record.theme = payload.theme
    if payload.currency is not None:
        settings_record.currency = payload.currency
    if payload.notifications is not None:
        settings_record.notifications.price_alerts = payload.notifications.price_alerts
        settings_record.notifications.weekly_digest = payload.notifications.weekly_digest
        
    await settings_repo.save(settings_record)
    return settings_record
