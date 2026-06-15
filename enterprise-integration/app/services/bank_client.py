"""Mock-банк. Имитирует вызов платёжного шлюза БЕЗ реальной сети и денег.

В реальном клиенте здесь был бы httpx-вызов на settings.bank_base_url с токеном
и таймаутом. Для симулятора — детерминированная заглушка, которая умеет
«моргнуть» 5xx заданное число раз, чтобы продемонстрировать retry.
"""
from app.config import settings
from app.models.payment import Payment
from app.utils.retry import run_with_retry


class BankTransientError(Exception):
    """Временный сбой банка (аналог 5xx) — есть смысл повторить."""


class BankClient:
    def __init__(self, fail_times: int | None = None):
        self.fail_times = settings.bank_fail_times if fail_times is None else fail_times
        self._calls = 0

    def _attempt(self, payment: Payment) -> dict:
        self._calls += 1
        if self._calls <= self.fail_times:
            raise BankTransientError(f"bank temporary error (attempt {self._calls})")
        # Успешный ответ банка: платёж принят в обработку.
        return {
            "external_bank_id": f"BANK-{payment.id}",
            "status": "accepted",
            "status_code": 200,
        }

    def send_payment(self, payment: Payment) -> dict:
        """Отправить платёж в банк с retry на временных ошибках."""
        return run_with_retry(
            lambda: self._attempt(payment),
            attempts=3,
            retry_on=(BankTransientError,),
            label="bank.send_payment",
        )
