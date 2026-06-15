"""Общая настройка тестов.

Важно: переменные окружения задаём ДО импорта приложения — pydantic-settings
читает их один раз при создании Settings(). Тесты работают с отдельной тестовой
БД (sqlite-файл), которая пересоздаётся перед каждым тестом для изоляции.
"""
import os

os.environ["DATABASE_URL"] = "sqlite:///./test_app.db"
os.environ["SECRET_KEY"] = "test-secret"
os.environ["BANK_FAIL_TIMES"] = "0"
os.environ["AUTO_CREATE_TABLES"] = "true"

if os.path.exists("./test_app.db"):
    os.remove("./test_app.db")

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from app.database import Base, SessionLocal, engine  # noqa: E402
from app.main import app  # noqa: E402
from app.services.sap_client import SAPClient  # noqa: E402


@pytest.fixture(scope="session")
def client():
    with TestClient(app) as c:
        yield c


@pytest.fixture(autouse=True)
def reset_db():
    """Чистая БД перед каждым тестом + демо-данные SAP."""
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        SAPClient(db).seed_orders()
    finally:
        db.close()
    yield


def _register_and_login(client, email, password, role):
    client.post("/auth/register", json={"email": email, "password": password, "role": role})
    resp = client.post("/auth/login", json={"email": email, "password": password})
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def admin_headers(client):
    return _register_and_login(client, "admin@test.io", "secret123", "admin")


@pytest.fixture
def viewer_headers(client):
    return _register_and_login(client, "viewer@test.io", "secret123", "viewer")
