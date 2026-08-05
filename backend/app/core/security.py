from fastapi import Request, Depends
from beanie import PydanticObjectId
from app.core.jwt import verify_token
from app.utils.exceptions import UnauthorizedException
from app.repositories.user_repository import user_repo
from app.models.user import User

async def get_current_user(request: Request) -> User:
    # 1. Try to read from HTTP-only Cookie
    token = request.cookies.get("access_token")
    
    # 2. Fall back to Authorization Header
    if not token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
            
    if not token:
        raise UnauthorizedException("Authentication required. Please sign in.")
        
    user_id_str = verify_token(token)
    if not user_id_str:
        raise UnauthorizedException("Session expired or invalid. Please sign in again.")
        
    try:
        user_id = PydanticObjectId(user_id_str)
    except Exception:
        raise UnauthorizedException("Invalid credentials structure.")
        
    user = await user_repo.get_by_id(user_id)
    if not user:
        raise UnauthorizedException("User not found.")
        
    return user
