"""Сервис аудита: единая точка записи обменов с внешними системами."""
import json

from sqlalchemy.orm import Session

from app.models.integration_log import IntegrationLog
from app.repositories.integration_log_repository import IntegrationLogRepository


class IntegrationLogService:
    def __init__(self, db: Session):
        self.repo = IntegrationLogRepository(db)

    def record(
        self,
        *,
        system_name: str,
        direction: str,
        request_payload: dict | None = None,
        response_payload: dict | None = None,
        status_code: int | None = None,
        error_message: str | None = None,
    ) -> IntegrationLog:
        log = IntegrationLog(
            system_name=system_name,
            direction=direction,
            request_payload=_dump(request_payload),
            response_payload=_dump(response_payload),
            status_code=status_code,
            error_message=error_message,
        )
        return self.repo.add(log)


def _dump(payload: dict | None) -> str | None:
    return None if payload is None else json.dumps(payload, ensure_ascii=False)
