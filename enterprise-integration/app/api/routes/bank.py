from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.bank import BankWebhookIn, BankWebhookOut
from app.services.payment_service import PaymentService

router = APIRouter(prefix="/bank", tags=["bank"])


@router.post("/webhook", response_model=BankWebhookOut)
def bank_webhook(data: BankWebhookIn, db: Session = Depends(get_db)):
    """Webhook от mock-банка: банк сообщает итог платежа (success/failed).

    В проде webhook защищают общим секретом/подписью. Здесь — открыт для простоты.
    """
    payment, updated = PaymentService(db).handle_webhook(data.external_bank_id, data.status)
    return BankWebhookOut(payment_id=payment.id, status=payment.status, updated=updated)
