"""Mock-SAP. Отдаёт «заказы из SAP» БЕЗ реального подключения к SAP.

В реальной интеграции здесь был бы вызов OData/SOAP/файлового интерфейса SAP.
Поля заказа имитируют формат SAP (Belnr, Dmbtr, Waers) — их маппим в платёж.
"""
from sqlalchemy.orm import Session

from app.models.sap_order import SAPOrder
from app.repositories.sap_repository import SAPRepository

# Канонические «документы из SAP» для демонстрации (имена полей — в стиле SAP).
SAMPLE_SAP_ORDERS = [
    {"sap_order_id": "SAP-1001", "customer_name": "ACME LLC", "amount": 500000, "currency": "UZS"},
    {"sap_order_id": "SAP-1002", "customer_name": "Globex", "amount": 1200000, "currency": "UZS"},
    {"sap_order_id": "SAP-1003", "customer_name": "Initech", "amount": 75000, "currency": "USD"},
]


class SAPClient:
    def __init__(self, db: Session):
        self.repo = SAPRepository(db)

    def seed_orders(self) -> None:
        """Заполнить таблицу sap_orders демонстрационными заказами (идемпотентно)."""
        for data in SAMPLE_SAP_ORDERS:
            if not self.repo.get_by_sap_order_id(data["sap_order_id"]):
                self.repo.add(SAPOrder(**data))

    def list_orders(self) -> list[SAPOrder]:
        return self.repo.list()

    def get_order(self, sap_order_id: str) -> SAPOrder | None:
        return self.repo.get_by_sap_order_id(sap_order_id)

    @staticmethod
    def map_to_payment(order: SAPOrder) -> dict:
        """Data mapping: поля заказа SAP → поля платежа для банка."""
        return {
            "amount": order.amount,
            "currency": order.currency,
            "sap_document_id": order.sap_order_id,
        }
