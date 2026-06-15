"""Подключение к базе данных: engine, фабрика сессий, базовый класс моделей.

get_db — зависимость FastAPI: открывает сессию на запрос и гарантированно
закрывает её после ответа.
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.config import settings

# SQLite требует особый флаг для работы в нескольких потоках (TestClient/uvicorn).
connect_args = (
    {"check_same_thread": False} if settings.database_url.startswith("sqlite") else {}
)

engine = create_engine(settings.database_url, connect_args=connect_args, future=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


class Base(DeclarativeBase):
    """Базовый класс всех ORM-моделей."""


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
