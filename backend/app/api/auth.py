from fastapi import APIRouter, Response, Depends, status
from app.schemas.auth import GoogleAuthRequest, AuthSuccessResponse, UserResponseSchema
from app.services.auth_service import auth_service
from app.core.security import get_current_user
from app.models.user import User
from app.core.config import settings

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.get("/config")
async def get_auth_config():
    """
    Returns public auth configurations (e.g. Google Client ID).
    """
    return {"google_client_id": settings.GOOGLE_CLIENT_ID}

@router.post("/google", response_model=AuthSuccessResponse)
async def google_login(payload: GoogleAuthRequest, response: Response):
    """
    Exchanges a Google OAuth ID Token for a CryptoSphere Session JWT.
    Sets HttpOnly cookie for browser clients.
    """
    result = await auth_service.authenticate_user(payload.token)
    
    # Set access token in HTTP-only Cookie
    response.set_cookie(
        key="access_token",
        value=result["access_token"],
        httponly=True,
        max_age=60 * 24 * 60,  # 24 hours
        samesite="lax",
        secure=False,  # Set to True in production with SSL
        path="/"
    )
    
    return {
        "user": result["user"],
        "access_token": result["access_token"]
    }

@router.get("/me", response_model=UserResponseSchema)
async def get_me(current_user: User = Depends(get_current_user)):
    """
    Returns authenticated user profile information.
    """
    return current_user

@router.post("/logout", status_code=status.HTTP_200_OK)
async def logout(response: Response, current_user: User = Depends(get_current_user)):
    """
    Clears the active session cookies.
    """
    response.delete_cookie(key="access_token", path="/")
    return {"status": "success", "message": "Successfully logged out."}

from app.repositories.user_repository import user_repo
from typing import List

@router.get("/users", response_model=List[UserResponseSchema])
async def get_all_other_users(current_user: User = Depends(get_current_user)):
    """
    Returns list of all registered users (excluding current logged-in user).
    """
    return await user_repo.get_all_other_users(current_user.id)
