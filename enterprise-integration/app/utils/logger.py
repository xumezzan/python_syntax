"""Структурное логирование в JSON: машине легко искать и фильтровать события."""
import json
import logging
import sys

_logger = logging.getLogger("enterprise-integration")
if not _logger.handlers:
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(logging.Formatter("%(message)s"))
    _logger.addHandler(handler)
    _logger.setLevel(logging.INFO)


def log_event(event: str, level: str = "INFO", **fields) -> None:
    """Записать структурное событие: {"level": ..., "event": ..., ...}."""
    record = {"level": level, "event": event, **fields}
    line = json.dumps(record, ensure_ascii=False)
    if level == "ERROR":
        _logger.error(line)
    elif level == "WARNING":
        _logger.warning(line)
    else:
        _logger.info(line)
