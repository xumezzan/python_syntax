from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr

from app.constants import ROLE_VIEWER


class RegisterIn(BaseModel):
    email: EmailStr
    password: str
    role: str = ROLE_VIEWER


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: EmailStr
    role: str
    created_at: datetime
