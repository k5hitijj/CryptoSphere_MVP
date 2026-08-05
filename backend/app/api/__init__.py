from fastapi import APIRouter
from .auth import router as auth_router
from .dashboard import router as dashboard_router
from .markets import router as markets_router
from .portfolio import router as portfolio_router
from .wallet import router as wallet_router
from .settings import router as settings_router
from .alerts import router as alerts_router

api_router = APIRouter()
api_router.include_router(auth_router)
api_router.include_router(dashboard_router)
api_router.include_router(markets_router)
api_router.include_router(portfolio_router)
api_router.include_router(wallet_router)
api_router.include_router(settings_router)
api_router.include_router(alerts_router)

__all__ = ["api_router"]
