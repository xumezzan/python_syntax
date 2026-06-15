from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class PaymentCreate(BaseModel):
    amount: int = Field(gt=0, description="Сумма платежа в минимальных единицах (например, тийинах)")
    currency: str = Field(min_length=3, max_length=8)
    idempotency_key: str = Field(min_length=1, description="Защита от дублей")
    sap_document_id: str = ""


class PaymentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    amount: int
    currency: str
    status: str
    idempotency_key: str
    external_bank_id: str | None = None
    sap_document_id: str | None = None
    created_at: datetime
    updated_at: datetime


class PaymentStatusOut(BaseModel):
    id: int
    status: str
