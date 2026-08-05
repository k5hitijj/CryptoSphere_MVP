from typing import Optional
from datetime import datetime, timezone
from beanie import PydanticObjectId
from app.models.user import User
from app.models.authorised_user import AuthorisedUser

class UserRepository:
    async def get_by_id(self, user_id: PydanticObjectId) -> Optional[User]:
        return await User.get(user_id)

    async def get_by_email(self, email: str) -> Optional[User]:
        return await User.find_one(User.email == email.lower())

    async def get_by_google_id(self, google_id: str) -> Optional[User]:
        return await User.find_one(User.google_id == google_id)

    async def get_authorised_user(self, email: str) -> Optional[AuthorisedUser]:
        return await AuthorisedUser.find_one(
            AuthorisedUser.email == email.lower(),
            AuthorisedUser.is_active == True
        )

    async def create_user(self, google_id: str, email: str, name: str, avatar: Optional[str]) -> User:
        user = User(
            google_id=google_id,
            email=email.lower(),
            name=name,
            avatar=avatar,
            last_login=datetime.now(timezone.utc),
            created_at=datetime.now(timezone.utc)
        )
        return await user.insert()

    async def update_last_login(self, user: User) -> User:
        user.last_login = datetime.now(timezone.utc)
        return await user.save()

    async def get_all_other_users(self, exclude_user_id: PydanticObjectId) -> list[User]:
        return await User.find(User.id != exclude_user_id).to_list()

user_repo = UserRepository()
