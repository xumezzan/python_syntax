from fastapi import APIRouter, Depends
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.auth import LoginIn, RegisterIn, Token, UserOut
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserOut, status_code=201)
def register(data: RegisterIn, db: Session = Depends(get_db)):
    return AuthService(db).register(data.email, data.password, data.role)


@router.post("/login", response_model=Token)
def login(data: LoginIn, db: Session = Depends(get_db)):
    token = AuthService(db).authenticate(data.email, data.password)
    return Token(access_token=token)


@router.post("/token", response_model=Token, include_in_schema=False)
def login_form(form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """Форма для кнопки Authorize в Swagger (username = email)."""
    token = AuthService(db).authenticate(form.username, form.password)
    return Token(access_token=token)
