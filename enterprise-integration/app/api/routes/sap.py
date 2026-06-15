from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session

from app.constants import ROLE_ADMIN, ROLE_MANAGER
from app.database import get_db
from app.models.user import User
from app.schemas.payment import PaymentOut
from app.schemas.sap import SAPOrderOut, SAPPaymentRequestIn
from app.security import get_current_user, require_role
from app.services.payment_service import PaymentService
from app.services.sap_client import SAPClient

router = APIRouter(prefix="/sap", tags=["sap"])


@router.get("/orders", response_model=list[SAPOrderOut])
def sap_orders(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """Список заказов из mock-SAP (демо-данные заполняются при старте)."""
    return SAPClient(db).list_orders()


@router.post("/payment-request", response_model=PaymentOut)
def sap_payment_request(
    data: SAPPaymentRequestIn,
    response: Response,
    db: Session = Depends(get_db),
    user: User = Depends(require_role(ROLE_ADMIN, ROLE_MANAGER)),
):
    """Создать платёж из заказа SAP (data mapping SAP → платёж, с идемпотентностью)."""
    payment, created = PaymentService(db).create_from_sap(
        data.sap_order_id, data.idempotency_key
    )
    response.status_code = 201 if created else 200
    return payment
