from sqlalchemy.orm import Session

from app.models.sap_order import SAPOrder


class SAPRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_sap_order_id(self, sap_order_id: str) -> SAPOrder | None:
        return (
            self.db.query(SAPOrder)
            .filter(SAPOrder.sap_order_id == sap_order_id)
            .first()
        )

    def list(self) -> list[SAPOrder]:
        return self.db.query(SAPOrder).order_by(SAPOrder.id).all()

    def add(self, order: SAPOrder) -> SAPOrder:
        self.db.add(order)
        self.db.commit()
        self.db.refresh(order)
        return order
