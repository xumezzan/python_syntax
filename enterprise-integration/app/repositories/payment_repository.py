from sqlalchemy.orm import Session

from app.models.payment import Payment


class PaymentRepository:
    def __init__(self, db: Session):
        self.db = db

    def get(self, payment_id: int) -> Payment | None:
        return self.db.get(Payment, payment_id)

    def get_by_idempotency_key(self, key: str) -> Payment | None:
        return self.db.query(Payment).filter(Payment.idempotency_key == key).first()

    def get_by_external_bank_id(self, external_id: str) -> Payment | None:
        return (
            self.db.query(Payment)
            .filter(Payment.external_bank_id == external_id)
            .first()
        )

    def list(self) -> list[Payment]:
        return self.db.query(Payment).order_by(Payment.id).all()

    def add(self, payment: Payment) -> Payment:
        self.db.add(payment)
        self.db.commit()
        self.db.refresh(payment)
        return payment

    def save(self, payment: Payment) -> Payment:
        self.db.commit()
        self.db.refresh(payment)
        return payment
