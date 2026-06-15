"""Простой retry: повторяет операцию при временной ошибке с ограничением попыток.

Повторяем только то, что есть смысл повторять (временные сбои). Для ошибок,
которые повтор не исправит, поднимают исключение, не входящее в retry_on.
"""
import time
from typing import Callable, TypeVar

from app.utils.logger import log_event

T = TypeVar("T")


class RetryError(Exception):
    """Все попытки исчерпаны, операция так и не удалась."""


def run_with_retry(
    func: Callable[[], T],
    *,
    attempts: int = 3,
    delay: float = 0.0,
    retry_on: tuple[type[Exception], ...] = (Exception,),
    label: str = "operation",
) -> T:
    last_error: Exception | None = None
    for attempt in range(1, attempts + 1):
        try:
            return func()
        except retry_on as exc:  # noqa: PERF203 — наглядность важнее микрооптимизации
            last_error = exc
            log_event(
                "retry_attempt_failed",
                level="WARNING",
                label=label,
                attempt=attempt,
                attempts=attempts,
                error=str(exc),
            )
            if attempt < attempts and delay:
                time.sleep(delay)
    raise RetryError(f"{label}: исчерпаны {attempts} попытки") from last_error
