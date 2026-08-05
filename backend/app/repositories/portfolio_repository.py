from typing import Optional, List
from beanie import PydanticObjectId
from app.models.portfolio import Portfolio, PortfolioHolding

class PortfolioRepository:
    async def get_by_user_id(self, user_id: PydanticObjectId) -> Optional[Portfolio]:
        return await Portfolio.find_one(Portfolio.user_id == user_id)

    async def create_portfolio(self, user_id: PydanticObjectId, initial_cash: float = 100000.0) -> Portfolio:
        portfolio = Portfolio(
            user_id=user_id,
            cash_balance=initial_cash,
            holdings=[]
        )
        return await portfolio.insert()

    async def save(self, portfolio: Portfolio) -> Portfolio:
        return await portfolio.save()

portfolio_repo = PortfolioRepository()
