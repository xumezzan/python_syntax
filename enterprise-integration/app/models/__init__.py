"""Импорт всех моделей, чтобы Base.metadata знал про все таблицы."""
from app.models.integration_log import IntegrationLog
from app.models.payment import Payment
from app.models.sap_order import SAPOrder
from app.models.user import User

__all__ = ["User", "Payment", "IntegrationLog", "SAPOrder"]
