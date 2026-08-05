from typing import List, Optional
from beanie import PydanticObjectId
from app.models.price_alert import PriceAlert
from datetime import datetime, timezone

class AlertsRepository:
    async def get_by_id(self, alert_id: PydanticObjectId) -> Optional[PriceAlert]:
        return await PriceAlert.get(alert_id)

    async def get_user_alerts(self, user_id: PydanticObjectId, active_only: bool = False) -> List[PriceAlert]:
        if active_only:
            return await PriceAlert.find(
                PriceAlert.user_id == user_id,
                PriceAlert.is_triggered == False
            ).sort("-created_at").to_list()
        return await PriceAlert.find(PriceAlert.user_id == user_id).sort("-created_at").to_list()

    async def get_untriggered_alerts_by_coin(self, coin_id: str) -> List[PriceAlert]:
        return await PriceAlert.find(
            PriceAlert.coin_id == coin_id.lower(),
            PriceAlert.is_triggered == False
        ).to_list()

    async def create_alert(
        self, user_id: PydanticObjectId, coin_id: str, target_price: float, condition: str
    ) -> PriceAlert:
        alert = PriceAlert(
            user_id=user_id,
            coin_id=coin_id.lower(),
            target_price=target_price,
            condition=condition.upper(),
            is_triggered=False,
            created_at=datetime.now(timezone.utc)
        )
        return await alert.insert()

    async def delete_alert(self, alert_id: PydanticObjectId) -> bool:
        alert = await self.get_by_id(alert_id)
        if alert:
            await alert.delete()
            return True
        return False

    async def save(self, alert: PriceAlert) -> PriceAlert:
        return await alert.save()

alerts_repo = AlertsRepository()
