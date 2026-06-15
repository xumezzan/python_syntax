# Enterprise Integration Simulator 🏁

**Симулятор корпоративной интеграции SAP и банка.** Backend на FastAPI, который
связывает **mock-SAP** и **mock-банк**: создаёт платежи, отправляет их в банк,
принимает webhook, ведёт integration logs, защищается idempotency и retry.

> ⚠️ Настоящих SAP и банка здесь нет — только безопасные моки. Никаких реальных
> платежей, credentials или production-адресов. Все секреты — только через `.env`.

Это финальный проект трека **«Python Backend: API, базы данных и интеграции»**
на платформе PySyntax.

## Стек

FastAPI · PostgreSQL · SQLAlchemy 2.0 · Alembic · JWT · Docker · pytest

## Архитектура

```
app/
  main.py            точка входа, подключение роутов, старт
  config.py          настройки из окружения (.env)
  database.py        engine, сессии, Base
  security.py        пароли (pbkdf2), JWT, проверка ролей
  constants.py       статусы платежа и переходы
  api/routes/        тонкие эндпоинты: health, auth, payments, bank, sap, integration_logs
  schemas/           Pydantic-схемы (валидация входа/выхода)
  services/          бизнес-логика: auth, payments, bank_client (mock), sap_client (mock), логи
  repositories/      доступ к БД (repository-паттерн)
  tasks/             фоновая обработка платежей
  utils/             logger (структурные логи), retry
alembic/             миграции схемы БД
tests/               pytest: health, auth, payments, webhook, idempotency, logs
```

Поток: **роут → service → repository → БД**. Роут только принимает запрос и зовёт сервис.

## Быстрый запуск через Docker

```bash
cp .env.example .env            # заполнить (моки, без реальных секретов)
docker compose up --build       # поднять app + PostgreSQL
# документация: http://localhost:8000/docs
```

При старте приложение создаёт таблицы (`AUTO_CREATE_TABLES=true`) и заполняет
демо-заказы SAP.

## Запуск без Docker (локально)

```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
# по умолчанию DATABASE_URL = sqlite:///./app.db — PostgreSQL не нужен
uvicorn app.main:app --reload
```

## Миграции (Alembic)

Для рабочего пути со схемой через миграции (вместо авто-создания) поставь
`AUTO_CREATE_TABLES=false` и применяй миграции:

```bash
alembic upgrade head      # применить
alembic downgrade -1      # откатить на шаг
alembic revision --autogenerate -m "что изменили"   # новая миграция
```

## Тесты

```bash
pytest
```

Тесты идут в отдельную тестовую БД (sqlite), которая пересоздаётся перед каждым
тестом. Внешний банк замокан — тесты быстрые, стабильные и без реальных денег.

## Переменные окружения

| Переменная | Назначение |
|------------|------------|
| `DATABASE_URL` | строка подключения к БД (sqlite локально, postgres в Docker) |
| `SECRET_KEY` | секрет подписи JWT |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | срок жизни токена |
| `BANK_FAIL_TIMES` | сколько раз mock-банк «моргнёт» 5xx перед успехом (демо retry) |
| `AUTO_CREATE_TABLES` | создавать таблицы при старте (`false` — использовать Alembic) |

Реальный `.env` **не коммитится**; в репозитории — только `.env.example`.

## Endpoints

```
GET  /health

POST /auth/register
POST /auth/login

POST /payments                      создать платёж (idempotency)
GET  /payments
GET  /payments/{id}
POST /payments/{id}/send-to-bank    отправить в банк (retry + лог)
GET  /payments/{id}/status

POST /bank/webhook                  банк сообщает итог платежа

GET  /integration-logs
GET  /integration-logs/{id}

GET  /sap/orders                    заказы из mock-SAP
POST /sap/payment-request           создать платёж из заказа SAP (data mapping)
```

## Сценарий «жизнь платежа»

1. `POST /auth/register` + `POST /auth/login` → получить JWT.
2. `POST /payments` с `idempotency_key` → платёж `created` (повтор ключа не создаёт дубль).
3. `POST /payments/{id}/send-to-bank` → mock-банк (с retry), статус `sent_to_bank`,
   запись в `integration_logs`, присвоен `external_bank_id`.
4. `POST /bank/webhook` с `{external_bank_id, status}` → платёж `success` / `failed`.
5. `GET /payments/{id}/status` → итог.

## Статусы платежа

```
created → pending → sent_to_bank → processing → success
                                              ↘ failed
created / pending → cancelled
```

## Роли и доступ

`admin`, `manager` — могут создавать и отправлять платежи. `developer`, `viewer` —
только чтение. Нет токена → `401`. Не хватает прав → `403`.

## Что демонстрирует проект

- **Idempotency** — повтор `POST /payments` с тем же ключом не создаёт дубль.
- **Retry** — `BankClient` повторяет вызов на временных сбоях, после лимита → `failed`.
- **Audit trail** — каждый обмен с банком и SAP пишется в `integration_logs`.
- **Webhook** — асинхронное обновление статуса платежа банком.
- **Data mapping** — поля заказа SAP приводятся к формату платежа.
- **Безопасность** — хэш паролей, JWT, роли, секреты только в `.env`.
