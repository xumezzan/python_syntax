"""Настройки приложения. Читаются из переменных окружения (.env).

Секреты НИКОГДА не пишем в коде — только через окружение. В репозитории лежит
.env.example с примерами, реальный .env не коммитится.
"""
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # По умолчанию — SQLite, чтобы проект запускался без PostgreSQL.
    # В docker-compose сюда придёт строка postgresql://...
    database_url: str = "sqlite:///./app.db"

    # Подпись JWT. В .env.example — заглушка; в проде задаётся секретом окружения.
    secret_key: str = "dev-secret-change-me"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60

    # Параметры mock-банка (никаких реальных адресов и ключей!).
    bank_base_url: str = "http://mock-bank.local"
    bank_api_key: str = "mock-bank-key"
    bank_fail_times: int = 0  # для демонстрации retry: сколько раз банк «моргнёт» 5xx

    # Создавать таблицы при старте (удобно для быстрого запуска).
    # Для рабочего пути через Alembic выставь AUTO_CREATE_TABLES=false.
    auto_create_tables: bool = True


settings = Settings()
