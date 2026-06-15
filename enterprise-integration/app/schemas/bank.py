from pydantic import BaseModel


class BankWebhookIn(BaseModel):
    """Тело webhook от банка: банк сообщает итог обработки платежа."""

    external_bank_id: str
    status: str  # success | failed


class BankWebhookOut(BaseModel):
    payment_id: int
    status: str
    updated: bool
