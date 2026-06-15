"""Фоновая обработка платежей.

Демонстрирует вынос долгой работы (отправка в банк) из запроса в фон.
Фоновая задача открывает СВОЮ сессию БД — сессия запроса к этому моменту закрыта.
"""
from app.database import SessionLocal
from app.services.payment_service import PaymentService
from app.utils.logger import log_event


def send_payment_to_bank_task(payment_id: int) -> None:
    db = SessionLocal()
    try:
        service = PaymentService(db)
        service.send_to_bank(payment_id)
    except Exception as exc:  # noqa: BLE001 — в фоне нельзя дать задаче «упасть молча»
        log_event("background_task_error", level="ERROR",
                  payment_id=payment_id, error=str(exc))
    finally:
        db.close()
