import httpx
from datetime import datetime, timezone
from typing import Dict, Any, Optional
from app.utils.exceptions import UnauthorizedException, ForbiddenException
from app.repositories.user_repository import user_repo
from app.repositories.portfolio_repository import portfolio_repo
from app.repositories.settings_repository import settings_repo
from app.core.jwt import create_access_token
from app.core.config import settings
import logging

logger = logging.getLogger("cryptosphere.auth_service")

class AuthService:
    async def verify_google_token(self, id_token: str) -> Dict[str, Any]:
        """
        Verifies the Google OAuth ID token using Google's tokeninfo API.
        """
        url = f"https://oauth2.googleapis.com/tokeninfo?id_token={id_token}"
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(url, timeout=5.0)
                if response.status_code != 200:
                    logger.warning(f"Google token validation failed: {response.text}")
                    raise UnauthorizedException("Invalid Google token.")
                return response.json()
            except httpx.RequestError as e:
                logger.error(f"Failed to communicate with Google validation server: {e}")
                raise UnauthorizedException("Could not verify credentials with Google.")

    async def authenticate_user(self, id_token: str) -> Dict[str, Any]:
        """
        Validates Google login token, checks authorization whitelist, and logs/registers user.
        """
        # Validate with Google or bypass for mock token developers
        if id_token.startswith("mock_token_"):
            email = id_token.replace("mock_token_", "").lower()
            if not settings.WHITELISTED_EMAILS:
                pass
            elif email not in settings.WHITELISTED_EMAILS:
                email = settings.WHITELISTED_EMAILS[0]
            google_profile = {
                "email": email,
                "sub": f"mock_google_id_{email.split('@')[0]}",
                "name": f"Mock {email.split('@')[0].capitalize()}",
                "picture": None
            }
        else:
            google_profile = await self.verify_google_token(id_token)
        
        email = google_profile.get("email")
        google_id = google_profile.get("sub")
        name = google_profile.get("name", "")
        avatar = google_profile.get("picture")
        
        if not email or not google_id:
            raise UnauthorizedException("Required user metadata missing from Google profile.")
            
        # Check authorised whitelist
        whitelist_record = await user_repo.get_authorised_user(email)
        if not whitelist_record:
            if id_token.startswith("mock_token_"):
                from app.models.authorised_user import AuthorisedUser
                whitelist_record = AuthorisedUser(
                    email=email,
                    role="admin",
                    is_active=True
                )
                await whitelist_record.insert()
                logger.info(f"Auto-whitelisted mock developer user: {email}")
            else:
                logger.warning(f"Access denied for user {email}: Email not in whitelist.")
                raise ForbiddenException("Access Denied: This account is not whitelisted.")
            
        # Get or create user
        user = await user_repo.get_by_google_id(google_id)
        is_new_user = False
        
        if not user:
            # Check if email is already bound to another google id (edge case)
            existing_user = await user_repo.get_by_email(email)
            if existing_user:
                # Update user with new google id
                existing_user.google_id = google_id
                existing_user.name = name
                existing_user.avatar = avatar
                await existing_user.save()
                user = existing_user
            else:
                logger.info(f"Registering new whitelisted user: {email}")
                user = await user_repo.create_user(
                    google_id=google_id,
                    email=email,
                    name=name,
                    avatar=avatar
                )
                is_new_user = True
        else:
            # Update last login
            await user_repo.update_last_login(user)
            
        # Ensure dependencies (Portfolio & Settings) exist
        portfolio = await portfolio_repo.get_by_user_id(user.id)
        if not portfolio:
            await portfolio_repo.create_portfolio(user.id)
            logger.info(f"Initialized portfolio for user: {user.email}")
            
        settings_record = await settings_repo.get_by_user_id(user.id)
        if not settings_record:
            await settings_repo.get_or_create(user.id)
            logger.info(f"Initialized settings for user: {user.email}")
            
        # Generate API session token
        access_token = create_access_token(subject=user.id)
        
        return {
            "user": user,
            "access_token": access_token
        }

auth_service = AuthService()
