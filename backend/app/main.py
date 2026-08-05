from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager

from app.core.config import settings
from app.database.connection import init_db
from app.services.market_service import market_service
from app.api import api_router
from app.utils.logger import setup_logging
from app.utils.exceptions import CryptoSphereException
import logging

setup_logging()
logger = logging.getLogger("cryptosphere.main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup actions
    try:
        await init_db()
    except Exception as e:
        logger.critical(f"Failed to initialize database during startup: {e}")
        
    yield
    
    # Shutdown actions
    logger.info("Shutting down application...")
    await market_service.close()
    logger.info("Application shut down successfully.")

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan
)

# Enforce CORS rules
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Custom exception handler for CryptoSphere Exceptions
@app.exception_handler(CryptoSphereException)
async def cryptosphere_exception_handler(request: Request, exc: CryptoSphereException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
        headers=exc.headers
    )

# Database initialization middleware for serverless cold start resilience
@app.middleware("http")
async def db_session_middleware(request: Request, call_next):
    from app.database.connection import init_db
    try:
        await init_db()
    except Exception as e:
        logger.error(f"Middleware failed to initialize database: {e}")
    response = await call_next(request)
    return response

# Include core api router
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/")
async def root():
    return {
        "app": settings.PROJECT_NAME,
        "status": "healthy",
        "api_prefix": settings.API_V1_STR
    }
