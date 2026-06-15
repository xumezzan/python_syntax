from sqlalchemy.orm import Session

from app.models.integration_log import IntegrationLog


class IntegrationLogRepository:
    def __init__(self, db: Session):
        self.db = db

    def get(self, log_id: int) -> IntegrationLog | None:
        return self.db.get(IntegrationLog, log_id)

    def list(self) -> list[IntegrationLog]:
        return (
            self.db.query(IntegrationLog).order_by(IntegrationLog.id.desc()).all()
        )

    def add(self, log: IntegrationLog) -> IntegrationLog:
        self.db.add(log)
        self.db.commit()
        self.db.refresh(log)
        return log
