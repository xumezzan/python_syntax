"""Общие константы домена: статусы платежей и допустимые переходы."""

# Жизненный цикл платежа
CREATED = "created"
PENDING = "pending"
SENT_TO_BANK = "sent_to_bank"
PROCESSING = "processing"
SUCCESS = "success"
FAILED = "failed"
CANCELLED = "cancelled"

PAYMENT_STATUSES = [
    CREATED, PENDING, SENT_TO_BANK, PROCESSING, SUCCESS, FAILED, CANCELLED,
]

# Разрешённые переходы статусов. Нельзя прыгнуть из created сразу в success.
ALLOWED_TRANSITIONS = {
    CREATED: [PENDING, SENT_TO_BANK, CANCELLED],
    PENDING: [SENT_TO_BANK, CANCELLED],
    SENT_TO_BANK: [PROCESSING, SUCCESS, FAILED],
    PROCESSING: [SUCCESS, FAILED],
}

# Роли пользователей
ROLE_ADMIN = "admin"
ROLE_MANAGER = "manager"
ROLE_DEVELOPER = "developer"
ROLE_VIEWER = "viewer"
ROLES = [ROLE_ADMIN, ROLE_MANAGER, ROLE_DEVELOPER, ROLE_VIEWER]


def can_transition(current: str, nxt: str) -> bool:
    return nxt in ALLOWED_TRANSITIONS.get(current, [])
