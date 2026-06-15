"""Бизнес-логика платежей: создание (с идемпотентностью), отправка в банк
(с retry и логированием), обработка webhook, создание из заказа SAP.
"""
from fastapi import HTTPException

from sqlalchemy.orm import Session

from app.constants import FAILED, PROCESSING, SENT_TO_BANK, can_transition
from app.models.payment import Payment
from app.repositories.payment_repository import PaymentRepository
from app.schemas.payment import PaymentCreate
from app.services.bank_client import BankClient
from app.services.integration_log_service import IntegrationLogService
from app.services.sap_client import SAPClient
from app.utils.logger import log_event
from app.utils.retry import RetryError


class PaymentService:
    def __init__(self, db: Session):
        self.db = db
        self.payments = PaymentRepository(db)
        self.logs = IntegrationLogService(db)

    # ---------- создание ----------

    def create_payment(self, data: PaymentCreate) -> tuple[Payment, bool]:
        """Создать платёж. Возвращает (платёж, created): created=False — это дубль
        по idempotency_key, вернули существующий, нового не создали."""
        existing = self.payments.get_by_idempotency_key(data.idempotency_key)
        if existing:
            log_event("payment_duplicate", idempotency_key=data.idempotency_key,
                      payment_id=existing.id)
            return existing, False
        payment = Payment(
            amount=data.amount,
            currency=data.currency,
            idempotency_key=data.idempotency_key,
            sap_document_id=data.sap_document_id or None,
        )
        payment = self.payments.add(payment)
        log_event("payment_created", payment_id=payment.id, amount=payment.amount)
        return payment, True

    def get(self, payment_id: int) -> Payment:
        payment = self.payments.get(payment_id)
        if not payment:
            raise HTTPException(status_code=404, detail="Платёж не найден")
        return payment

    def list(self) -> list[Payment]:
        return self.payments.list()

    # ---------- отправка в банк ----------

    def send_to_bank(self, payment_id: int) -> Payment:
        payment = self.get(payment_id)
        if not can_transition(payment.status, SENT_TO_BANK):
            raise HTTPException(
                status_code=409,
                detail=f"Нельзя отправить платёж из статуса '{payment.status}'",
            )
        bank = BankClient()
        request_payload = {"amount": payment.amount, "currency": payment.currency}
        try:
            response = bank.send_payment(payment)
        except RetryError as exc:
            self.logs.record(
                system_name="bank", direction="outgoing",
                request_payload=request_payload, status_code=503,
                error_message=str(exc),
            )
            payment.status = FAILED
            self.payments.save(payment)
            log_event("payment_send_failed", level="ERROR", payment_id=payment.id)
            return payment

        payment.external_bank_id = response["external_bank_id"]
        payment.status = SENT_TO_BANK
        self.payments.save(payment)
        self.logs.record(
            system_name="bank", direction="outgoing",
            request_payload=request_payload, response_payload=response,
            status_code=response["status_code"],
        )
        log_event("payment_sent_to_bank", payment_id=payment.id,
                  external_bank_id=payment.external_bank_id)
        return payment

    # ---------- webhook от банка ----------

    def handle_webhook(self, external_bank_id: str, status: str) -> tuple[Payment, bool]:
        payment = self.payments.get_by_external_bank_id(external_bank_id)
        if not payment:
            raise HTTPException(status_code=404, detail="Платёж по external_bank_id не найден")
        self.logs.record(
            system_name="bank", direction="incoming",
            request_payload={"external_bank_id": external_bank_id, "status": status},
            status_code=200,
        )
        updated = False
        if payment.status in (SENT_TO_BANK, PROCESSING) and status in ("success", "failed"):
            payment.status = status
            self.payments.save(payment)
            updated = True
            log_event("payment_status_updated", payment_id=payment.id, status=status)
        return payment, updated

    # ---------- из заказа SAP ----------

    def create_from_sap(self, sap_order_id: str, idempotency_key: str) -> tuple[Payment, bool]:
        sap = SAPClient(self.db)
        order = sap.get_order(sap_order_id)
        if not order:
            raise HTTPException(status_code=404, detail="Заказ SAP не найден")
        mapped = sap.map_to_payment(order)  # data mapping SAP → платёж
        self.logs.record(
            system_name="sap", direction="incoming",
            request_payload={"sap_order_id": sap_order_id},
            response_payload=mapped, status_code=200,
        )
        data = PaymentCreate(
            amount=mapped["amount"],
            currency=mapped["currency"],
            idempotency_key=idempotency_key,
            sap_document_id=mapped["sap_document_id"],
        )
        return self.create_payment(data)
