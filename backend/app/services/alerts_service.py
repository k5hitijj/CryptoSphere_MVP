from typing import List, Dict, Any
from datetime import datetime, timezone
import logging
from beanie import PydanticObjectId
from app.repositories.alerts_repository import alerts_repo
from app.services.market_service import market_service
from app.utils.exceptions import BadRequestException, NotFoundException
from app.models.price_alert import PriceAlert

logger = logging.getLogger("cryptosphere.alerts_service")

class AlertsService:
    async def create_alert(
        self, user_id: PydanticObjectId, coin_id: str, target_price: float, condition: str
    ) -> PriceAlert:
        """
        Creates a new price alert for a user, validating that the coin exists.
        """
        cond = condition.upper()
        if cond not in ["ABOVE", "BELOW"]:
            raise BadRequestException("Condition must be either ABOVE or BELOW.")
            
        if target_price <= 0:
            raise BadRequestException("Target price must be greater than zero.")

        # Validate that the coin is supported by fetching its price
        prices = await market_service.get_supported_coin_prices()
        if coin_id.lower() not in prices:
            raise BadRequestException(f"Cryptocurrency coin '{coin_id}' is not supported.")

        # Create alert
        alert = await alerts_repo.create_alert(
            user_id=user_id,
            coin_id=coin_id,
            target_price=target_price,
            condition=cond
        )
        logger.info(f"Created price alert for user {user_id}: {coin_id} {cond} ${target_price}")
        return alert

    async def get_user_alerts(self, user_id: PydanticObjectId, active_only: bool = False) -> List[PriceAlert]:
        return await alerts_repo.get_user_alerts(user_id, active_only)

    async def delete_alert(self, user_id: PydanticObjectId, alert_id: PydanticObjectId) -> bool:
        alert = await alerts_repo.get_by_id(alert_id)
        if not alert:
            raise NotFoundException("Price alert not found.")
        if alert.user_id != user_id:
            raise BadRequestException("You are not authorized to delete this alert.")
            
        return await alerts_repo.delete_alert(alert_id)

    async def check_price_triggers(self, coin_id: str, current_price: float):
        """
        Checks untriggered alerts against the current price and marks them triggered if matched.
        """
        alerts = await alerts_repo.get_untriggered_alerts_by_coin(coin_id)
        if not alerts:
            return

        for alert in alerts:
            trigger = False
            if alert.condition == "ABOVE" and current_price >= alert.target_price:
                trigger = True
            elif alert.condition == "BELOW" and current_price <= alert.target_price:
                trigger = True

            if trigger:
                alert.is_triggered = True
                alert.triggered_at = datetime.now(timezone.utc)
                alert.is_acknowledged = False
                await alerts_repo.save(alert)
                logger.info(f"Price alert triggered! User: {alert.user_id}, Coin: {alert.coin_id}, Rate: ${current_price} vs Target: ${alert.target_price}")

    async def get_recent_notifications(self, user_id: PydanticObjectId) -> List[PriceAlert]:
        """
        Returns all triggered but unacknowledged price alerts, and marks them acknowledged.
        """
        alerts = await PriceAlert.find(
            PriceAlert.user_id == user_id,
            PriceAlert.is_triggered == True,
            PriceAlert.is_acknowledged == False
        ).to_list()

        # Mark them acknowledged
        for alert in alerts:
            alert.is_acknowledged = True
            await alerts_repo.save(alert)

        return alerts

alerts_service = AlertsService()
