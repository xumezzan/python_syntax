from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session

from app.constants import ROLE_ADMIN, ROLE_MANAGER
from app.database import get_db
from app.models.user import User
from app.schemas.payment import PaymentCreate, PaymentOut, PaymentStatusOut
from app.security import get_current_user, require_role
from app.services.payment_service import PaymentService

router = APIRouter(prefix="/payments", tags=["payments"])


@router.post("", response_model=PaymentOut)
def create_payment(
    data: PaymentCreate,
    response: Response,
    db: Session = Depends(get_db),
    user: User = Depends(require_role(ROLE_ADMIN, ROLE_MANAGER)),
):
    """Создать платёж. Повтор с тем же idempotency_key вернёт существующий (200)
    вместо создания дубля; новый платёж создаётся с кодом 201."""
    payment, created = PaymentService(db).create_payment(data)
    response.status_code = 201 if created else 200
    return payment


@router.get("", response_model=list[PaymentOut])
def list_payments(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return PaymentService(db).list()


@router.get("/{payment_id}", response_model=PaymentOut)
def get_payment(
    payment_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)
):
    return PaymentService(db).get(payment_id)


@router.post("/{payment_id}/send-to-bank", response_model=PaymentOut)
def send_to_bank(
    payment_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require_role(ROLE_ADMIN, ROLE_MANAGER)),
):
    """Отправить платёж в mock-банк (с retry и логированием в integration_logs)."""
    return PaymentService(db).send_to_bank(payment_id)


@router.get("/{payment_id}/status", response_model=PaymentStatusOut)
def payment_status(
    payment_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)
):
    payment = PaymentService(db).get(payment_id)
    return PaymentStatusOut(id=payment.id, status=payment.status)
