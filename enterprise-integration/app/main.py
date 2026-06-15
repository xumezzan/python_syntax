"""Точка входа FastAPI-приложения Enterprise Integration Simulator.

Связывает mock-SAP и mock-банк: создание платежей, отправка в банк, webhook,
integration logs, idempotency и retry. Настоящих SAP и банка нет — только моки.
"""
from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.api.routes import auth, bank, health, integration_logs, payments, sap
from app.config import settings
from app.database import Base, SessionLocal, engine
from app.services.sap_client import SAPClient
from app.utils.logger import log_event


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Быстрый старт: создаём таблицы и демо-данные SAP.
    # Для рабочего пути через миграции выставь AUTO_CREATE_TABLES=false и
    # применяй схему через `alembic upgrade head`.
    if settings.auto_create_tables:
        Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        SAPClient(db).seed_orders()
    finally:
        db.close()
    log_event("app_started", auto_create_tables=settings.auto_create_tables)
    yield


app = FastAPI(
    title="Enterprise Integration Simulator",
    description="Симулятор корпоративной интеграции SAP и банка (mock-only).",
    version="1.0.0",
    lifespan=lifespan,
)

app.include_router(health.router)
app.include_router(auth.router)
app.include_router(payments.router)
app.include_router(bank.router)
app.include_router(sap.router)
app.include_router(integration_logs.router)
