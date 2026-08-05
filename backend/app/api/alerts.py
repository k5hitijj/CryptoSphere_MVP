from fastapi import APIRouter, Depends, status
from typing import List
from beanie import PydanticObjectId
from app.core.security import get_current_user
from app.models.user import User
from app.schemas.alerts import AlertCreateRequest, AlertResponseSchema, AlertNotificationSchema
from app.services.alerts_service import alerts_service

router = APIRouter(prefix="/alerts", tags=["Price Alerts"])

@router.post("", response_model=AlertResponseSchema, status_code=status.HTTP_201_CREATED)
async def create_price_alert(
    payload: AlertCreateRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Creates a new target price alert (Above or Below) for a supported cryptocurrency.
    """
    return await alerts_service.create_alert(
        user_id=current_user.id,
        coin_id=payload.coin_id,
        target_price=payload.target_price,
        condition=payload.condition
    )

@router.get("", response_model=List[AlertResponseSchema])
async def get_user_alerts(
    current_user: User = Depends(get_current_user)
):
    """
    Retrieves the user's active and triggered price alerts.
    """
    return await alerts_service.get_user_alerts(current_user.id)

@router.delete("/{alert_id}")
async def delete_price_alert(
    alert_id: PydanticObjectId,
    current_user: User = Depends(get_current_user)
):
    """
    Deletes/unregisters a price alert.
    """
    success = await alerts_service.delete_alert(current_user.id, alert_id)
    return {"status": "success", "message": "Price alert deleted successfully."}

@router.get("/notifications", response_model=List[AlertNotificationSchema])
async def get_alert_notifications(
    current_user: User = Depends(get_current_user)
):
    """
    Retrieves recently triggered, unacknowledged price alerts (and clears them).
    """
    return await alerts_service.get_recent_notifications(current_user.id)
