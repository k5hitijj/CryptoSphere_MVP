from typing import List, Optional
from datetime import datetime, timezone
from beanie import PydanticObjectId
from app.models.transaction import Transaction

class TransactionRepository:
    async def create_transaction(
        self,
        user_id: PydanticObjectId,
        type: str,
        coin_id: Optional[str] = None,
        quantity: float = 0.0,
        price: float = 0.0,
        total: float = 0.0
    ) -> Transaction:
        transaction = Transaction(
            user_id=user_id,
            coin_id=coin_id,
            type=type,  # BUY, SELL, DEPOSIT, WITHDRAW
            quantity=quantity,
            price=price,
            total=total,
            created_at=datetime.now(timezone.utc)
        )
        return await transaction.insert()

    async def get_by_user_id(
        self,
        user_id: PydanticObjectId,
        limit: int = 50,
        skip: int = 0
    ) -> List[Transaction]:
        return await Transaction.find(
            Transaction.user_id == user_id
        ).sort(-Transaction.created_at).limit(limit).skip(skip).to_list()

    async def count_by_user_id(self, user_id: PydanticObjectId) -> int:
        return await Transaction.find(Transaction.user_id == user_id).count()

transaction_repo = TransactionRepository()
