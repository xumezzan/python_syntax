from datetime import datetime

from pydantic import BaseModel, ConfigDict


class SAPOrderOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    sap_order_id: str
    customer_name: str
    amount: int
    currency: str
    status: str
    created_at: datetime


class SAPPaymentRequestIn(BaseModel):
    """Запрос на создание платежа из заказа SAP."""

    sap_order_id: str
    idempotency_key: str
