from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.constants import ROLES
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.security import create_access_token, hash_password, verify_password


class AuthService:
    def __init__(self, db: Session):
        self.repo = UserRepository(db)

    def register(self, email: str, password: str, role: str) -> User:
        if role not in ROLES:
            raise HTTPException(status_code=422, detail=f"Неизвестная роль: {role}")
        if self.repo.get_by_email(email):
            raise HTTPException(status_code=409, detail="Пользователь уже существует")
        user = User(email=email, hashed_password=hash_password(password), role=role)
        return self.repo.add(user)

    def authenticate(self, email: str, password: str) -> str:
        user = self.repo.get_by_email(email)
        if not user or not verify_password(password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Неверный email или пароль",
            )
        return create_access_token(subject=user.email, role=user.role)
