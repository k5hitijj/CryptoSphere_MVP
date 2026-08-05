from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from beanie import PydanticObjectId

class GoogleAuthRequest(BaseModel):
    token: str

class UserResponseSchema(BaseModel):
    id: PydanticObjectId
    email: EmailStr
    name: str
    avatar: Optional[str] = None
    last_login: datetime
    created_at: datetime
    
    class Config:
        from_attributes = True

class AuthSuccessResponse(BaseModel):
    user: UserResponseSchema
    access_token: str
    token_type: str = "bearer"
