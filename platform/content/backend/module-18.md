# Модуль 18 — Финал: Enterprise Integration Simulator 🏁

**Цель:** ученик собирает всё изученное в один проект — backend, связывающий mock-SAP и mock-банк: платежи, webhook, integration logs, idempotency, retry.
**Босс:** собрать симулятор корпоративной интеграции.

> 🚀 Готовый рабочий проект лежит в репозитории: `enterprise-integration/`. Запуск — `docker compose up --build`. Этот модуль ведёт по нему и проверяет понимание ключевых частей.

---

### Урок 18.1 — Что мы строим
**Экраны:** теория → квиз

#### 📖 Теория
**Enterprise Integration Simulator** (Симулятор корпоративной интеграции SAP и банка) — финальный проект трека. Это backend на FastAPI, который связывает две системы:

```text
Mock SAP System
        ↓
Python FastAPI Backend  ← твой проект
        ↓
Mock Bank API
```

Настоящих SAP и банка нет — только безопасные **моки**. Но логика как в реальной enterprise-интеграции: платёж создаётся, отправляется в банк, банк присылает webhook со статусом, всё логируется, защищено idempotency и retry.

Стек: **FastAPI · PostgreSQL · SQLAlchemy · Alembic · JWT · Docker · pytest** — всё, что ты изучил в треке.

🐍 Пай: «Это не учебный пример из одного файла. Это проект-портфолио: его можно показать на собеседовании».

#### ❓ Квиз
Почему в финальном проекте SAP и банк — это моки?
- ✅ `Чтобы безопасно отрабатывать реальную логику интеграции, не трогая настоящие деньги и системы`
- `Потому что проект ненастоящий` — проект настоящий, моки лишь заменяют внешние системы.
- `Чтобы не писать код` — кода как раз много, моки его не отменяют.
- `Так быстрее платить` — реальных платежей тут нет вообще.

---

### Урок 18.2 — Сущности и статусы
**Экраны:** теория → задача

#### 📖 Теория
Главные таблицы проекта:
- **User** — `id, email, hashed_password, role, created_at`;
- **Payment** — `id, amount, currency, status, idempotency_key, external_bank_id, sap_document_id, created_at, updated_at`;
- **IntegrationLog** — `id, system_name, direction, request_payload, response_payload, status_code, error_message, created_at`;
- **SAPOrder** — `id, sap_order_id, customer_name, amount, currency, status, created_at`.

Платёж проходит через статусы:

```text
created → pending → sent_to_bank → processing → success
                                              ↘ failed
created / pending → cancelled
```

Статус — это жизнь платежа. Нельзя прыгнуть из `created` сразу в `success` — он должен пройти путь. Контроль переходов защищает от бардака.

🐍 Пай: «Статус платежа — это его биография. Из created в success — только через все ступени, не перепрыгивая».

#### 💻 Задача
**Условие:** проверь допустимость перехода статуса. Разрешены переходы: `created→pending`, `pending→sent_to_bank`, `sent_to_bank→processing`, `processing→success`, `processing→failed`, `created→cancelled`, `pending→cancelled`. На вход — две строки: текущий и следующий статус. Выведи `valid` или `invalid`.
**Стартовый код:**
```python
allowed = {
    "created": ["pending", "cancelled"],
    "pending": ["sent_to_bank", "cancelled"],
    "sent_to_bank": ["processing"],
    "processing": ["success", "failed"],
}
current = input()
nxt = input()
# выведи valid или invalid
```
**Подсказки:**
1. Возьми список разрешённых из `allowed.get(current, [])`.
2. Проверь `nxt in ...`.
3. Решение:
```python
ok = nxt in allowed.get(current, [])
print("valid" if ok else "invalid")
```
**Автотесты:**
| Ввод | Ожидаемый вывод |
|------|------------------|
| `created` ⏎ `pending` | `valid` |
| `created` ⏎ `success` | `invalid` |
| `processing` ⏎ `failed` | `valid` |
| `success` ⏎ `pending` | `invalid` |

---

### Урок 18.3 — Endpoints проекта
**Экраны:** теория → пазл

#### 📖 Теория
API проекта собирает весь трек воедино:

```text
GET  /health

POST /auth/register
POST /auth/login

POST /payments
GET  /payments
GET  /payments/{id}
POST /payments/{id}/send-to-bank
GET  /payments/{id}/status

POST /bank/webhook

GET  /integration-logs
GET  /integration-logs/{id}

GET  /sap/orders
POST /sap/payment-request
```

Каждый эндпоинт — это тема трека: auth (модуль 8), payments CRUD (модули 3–6), webhook и логи (модуль 11), SAP (модуль 17).

🐍 Пай: «Посмотри на этот список — в нём весь трек. Каждая строка — навык, который ты уже получил».

#### 🧩 Собери код
Расставь по порядку путь одного платежа через эндпоинты проекта.
**Строки:** `POST /auth/login (получить токен)` · `POST /payments (создать платёж)` · `POST /payments/{id}/send-to-bank (отправить)` · `POST /bank/webhook (банк прислал статус)` · `GET /payments/{id}/status (проверить итог)`
**Правильный порядок:** `POST /auth/login (получить токен)` · `POST /payments (создать платёж)` · `POST /payments/{id}/send-to-bank (отправить)` · `POST /bank/webhook (банк прислал статус)` · `GET /payments/{id}/status (проверить итог)`

---

### Урок 18.4 — Поток платежа
**Экраны:** теория → задача → квиз

#### 📖 Теория
Главный сценарий проекта по шагам:
1. клиент логинится → получает JWT;
2. `POST /payments` с `idempotency_key` → платёж создаётся (`created`), дубль защищён;
3. `POST /payments/{id}/send-to-bank` → backend зовёт mock-банк, статус → `sent_to_bank`, всё пишется в integration_logs, при сбое — retry;
4. mock-банк позже шлёт `POST /bank/webhook` со статусом → платёж становится `success` или `failed`;
5. `GET /payments/{id}/status` → клиент видит итог.

Это полный круг enterprise-интеграции, который ты теперь понимаешь целиком.

🐍 Пай: «Создать → отправить → webhook → итог. Этот круг крутится в каждой платёжной интеграции мира».

#### 💻 Задача
**Условие:** webhook банка обновляет статус платежа. На вход — две строки: текущий статус платежа и результат из webhook (`success`/`failed`). Обновляй статус только если платёж в `sent_to_bank` или `processing`; иначе оставь как есть. Выведи итоговый статус.
**Стартовый код:**
```python
current = input()
result = input()
# обнови статус по правилам и выведи итог
```
**Подсказки:**
1. Обновление разрешено только из `sent_to_bank` или `processing`.
2. Иначе выведи `current` без изменений.
3. Решение:
```python
current = input()
result = input()
if current in ("sent_to_bank", "processing"):
    print(result)
else:
    print(current)
```
**Автотесты:**
| Ввод | Ожидаемый вывод |
|------|------------------|
| `sent_to_bank` ⏎ `success` | `success` |
| `processing` ⏎ `failed` | `failed` |
| `created` ⏎ `success` | `created` |

#### ❓ Квиз
Зачем платежу поле `idempotency_key` в этом проекте?
- ✅ `Чтобы повторный POST /payments с тем же ключом не создал второй платёж`
- `Чтобы хранить пароль` — пароль не имеет отношения к платежу.
- `Чтобы ускорить банк` — на банк ключ не влияет.
- `Чтобы заменить токен` — авторизация это отдельно.

---

### Урок 18.5 — Как запустить проект
**Экраны:** теория → квиз

#### 📖 Теория
Проект запускается одной командой благодаря Docker:

```bash
cd enterprise-integration
cp .env.example .env          # заполнить переменные (моки, без реальных секретов)
docker compose up --build     # поднять app + PostgreSQL
# применить миграции:
docker compose exec app alembic upgrade head
# тесты:
docker compose exec app pytest
# документация: открыть http://localhost:8000/docs
```

Внутри: FastAPI-приложение, PostgreSQL в отдельном контейнере, Alembic-миграции, тесты на pytest, Swagger по `/docs`. Всё, что ты изучал, — собрано и работает вместе.

🐍 Пай: «Одна команда `docker compose up` — и весь стек поднимается. Вот зачем мы учили Docker».

#### ❓ Квиз
Что делает `docker compose up --build` в этом проекте?
- ✅ `Собирает и запускает все сервисы проекта (app и базу) вместе`
- `Удаляет проект` — наоборот, запускает его.
- `Только ставит Python` — он поднимает весь стек, а не один Python.
- `Открывает GitHub` — это локальный запуск, не про GitHub.

---

### Урок 18.6 — 🏆 БОСС: собери симулятор
**Экраны:** теория → задача

#### 📖 Теория
Финальное задание трека: собрать (или разобрать по коду) Enterprise Integration Simulator целиком. Открой `enterprise-integration/`, пройди по слоям — routes, services, repositories, models — и проследи путь платежа от `POST /payments` до webhook. Запусти тесты, открой Swagger, проведи тестовый платёж через mock-банк.

Это твой проект-портфолио. Ты можешь объяснить в нём каждую строку — потому что собрал понимание из 18 модулей.

🐍 Пай: «Дойти до сюда — уже достижение. Ты прошёл путь от первого print до enterprise-интеграции. Это уровень junior backend / интегратора».

#### 💻 Задача
**Условие (самопроверка):** опиши Pydantic-схему `PaymentCreate` для эндпоинта `POST /payments`: поля `amount` (int), `currency` (str), `idempotency_key` (str), `sap_document_id` (str, необязательное, по умолчанию пустая строка).
**Стартовый код:**
```python
from pydantic import BaseModel

class PaymentCreate(BaseModel):
    # опиши поля платежа
    pass
```
**Подсказки:**
1. Обязательные поля — без значения по умолчанию.
2. Необязательное — со значением: `sap_document_id: str = ""`.
3. Решение:
```python
from pydantic import BaseModel

class PaymentCreate(BaseModel):
    amount: int
    currency: str
    idempotency_key: str
    sap_document_id: str = ""
```
**Автотесты:** самопроверка: схема описывает amount, currency, idempotency_key и необязательный sap_document_id.

---

### Урок 18.7 — 🎓 Чеклист всего трека
**Экраны:** теория

#### 📖 Теория
**Поздравляю — трек пройден!** После этого трека ты умеешь:
1. понимать HTTP: клиент, сервер, request/response, методы, статус-коды;
2. проектировать REST API;
3. создавать backend на FastAPI с Pydantic;
4. работать с PostgreSQL и писать SQL;
5. использовать SQLAlchemy и repository-паттерн;
6. делать миграции через Alembic;
7. настраивать авторизацию: пароли, JWT, роли;
8. работать с внешними API: timeout, retry, обработка ошибок;
9. понимать SOAP и XML;
10. писать backend-тесты на pytest;
11. запускать сервис в Docker и docker-compose;
12. вести код через Git, ветки, PR и ревью;
13. логировать, считать метрики, делать health checks;
14. понимать retry и idempotency;
15. делать webhook и audit trail;
16. выносить работу в очереди и фоновые задачи;
17. понимать основы SAP / ERP / S/4HANA;
18. собрать enterprise integration simulator целиком.

**Связь с реальной работой:** этот набор навыков — ровно то, что просят в вакансиях backend-разработчика и интегратора. А готовый проект в `enterprise-integration/` — твоё портфолио. Покажи, что работает, а не «прошёл курс».

🐍 Пай: «Ты начинал с `print("Привет, мир!")`. Теперь у тебя enterprise-интеграция в портфолио. Горжусь. Дальше — настоящие задачи. Вперёд! 🚀»
