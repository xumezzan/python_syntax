# Модуль 6 — SQLAlchemy ORM 🧬

**Цель:** ученик понимает, что такое ORM, описывает модели, делает CRUD через сессию, связывает таблицы и применяет repository-паттерн.
**Босс:** связать Order и Payment моделями.

> ⚠️ SQLAlchemy работает на сервере. Код-задания — самопроверка: пишешь решение, сверяешь с эталоном, запускаешь в проекте модуля 18.

---

### Урок 6.1 — Что такое ORM
**Экраны:** теория → квиз

#### 📖 Теория
Писать сырой SQL строками в Python неудобно и опасно (легко ошибиться, легко открыть SQL-инъекцию). **ORM** (Object-Relational Mapping) решает это: ты работаешь с таблицами как с обычными Python-объектами, а ORM сам пишет SQL.

```text
строка в таблице  ↔  объект Python
колонка           ↔  атрибут объекта
```

Вместо `INSERT INTO users ...` ты пишешь `session.add(User(email="..."))`. ORM в проекте — это **SQLAlchemy**.

🐍 Пай: «ORM — переводчик между миром объектов Python и миром таблиц SQL. Ты думаешь объектами, он пишет запросы».

#### ❓ Квиз
Что делает ORM вроде SQLAlchemy?
- ✅ `Позволяет работать с таблицами как с Python-объектами, сам генерируя SQL`
- `Заменяет базу данных` — нет, база (PostgreSQL) всё равно нужна.
- `Ускоряет интернет` — ORM про работу с БД, а не с сетью.
- `Рисует интерфейс` — ORM не про UI вообще.

---

### Урок 6.2 — Модель
**Экраны:** теория → задача

#### 📖 Теория
**Модель** — это Python-класс, описывающий таблицу:

```python
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

class Base(DeclarativeBase):
    pass

class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str]
    role: Mapped[str] = mapped_column(default="viewer")
```

- `__tablename__` — имя таблицы в БД;
- каждый `mapped_column` — это колонка;
- `primary_key=True` — первичный ключ;
- `default="viewer"` — значение по умолчанию.

🐍 Пай: «Модель = чертёж таблицы на языке Python. Один класс — одна таблица».

#### 💻 Задача
**Условие (самопроверка):** опиши модель `Payment` для таблицы `payments` с полями: `id` (primary key), `amount` (int), `currency` (str), `status` (str, по умолчанию `"created"`).
**Стартовый код:**
```python
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

class Base(DeclarativeBase):
    pass

class Payment(Base):
    __tablename__ = "payments"
    # опиши колонки
```
**Подсказки:**
1. `id: Mapped[int] = mapped_column(primary_key=True)`.
2. Для статуса добавь `default="created"`.
3. Решение:
```python
class Payment(Base):
    __tablename__ = "payments"
    id: Mapped[int] = mapped_column(primary_key=True)
    amount: Mapped[int]
    currency: Mapped[str]
    status: Mapped[str] = mapped_column(default="created")
```
**Автотесты:** самопроверка: модель описывает таблицу payments с первичным ключом и статусом по умолчанию.

---

### Урок 6.3 — Сессия и CRUD
**Экраны:** теория → квиз

#### 📖 Теория
**Session** — это «рабочий стол» для общения с БД. Через неё добавляют, читают, меняют и удаляют объекты:

```python
# Create
session.add(Payment(amount=500, currency="UZS"))
session.commit()              # без commit изменения не сохранятся!

# Read
payment = session.get(Payment, 1)          # по id
all_p = session.query(Payment).all()       # все

# Update
payment.status = "success"
session.commit()

# Delete
session.delete(payment)
session.commit()
```

**Ошибка новичка:** забыть `session.commit()`. До коммита изменения живут только в памяти и в базу не попадут.

🐍 Пай: «add/delete — наметить. commit — подтвердить. Без commit база ничего не запомнит».

#### ❓ Квиз
Ты сделал `session.add(payment)`, но забыл `session.commit()`. Что в базе?
- ✅ `Ничего — без commit изменения не сохраняются в БД`
- `Платёж сохранён` — нет, add только намечает, сохраняет commit.
- `Появится ошибка` — ошибки не будет, просто данные не попадут в базу.
- `База очистится` — add ничего не удаляет.

---

### Урок 6.4 — Связи (relationships)
**Экраны:** теория → квиз → пазл

#### 📖 Теория
В SQL связь — это foreign key. В ORM добавляется ещё `relationship` — чтобы ходить по связи как по атрибуту:

```python
class Order(Base):
    __tablename__ = "orders"
    id: Mapped[int] = mapped_column(primary_key=True)
    payment: Mapped["Payment"] = relationship(back_populates="order")

class Payment(Base):
    __tablename__ = "payments"
    id: Mapped[int] = mapped_column(primary_key=True)
    order_id: Mapped[int] = mapped_column(ForeignKey("orders.id"))
    order: Mapped["Order"] = relationship(back_populates="payment")
```

Теперь можно писать `payment.order` и сразу получить связанный заказ — без ручного JOIN.

🐍 Пай: «ForeignKey — связь в базе. relationship — удобный мостик, чтобы ходить по ней в коде».

#### ❓ Квиз
Чем `relationship` отличается от `ForeignKey`?
- ✅ `ForeignKey — это колонка-ссылка в базе, а relationship — удобный доступ к связанному объекту в коде`
- `Это одно и то же` — нет, одно про базу, другое про удобство в Python.
- `relationship создаёт таблицу` — таблицу создаёт модель, а не relationship.
- `ForeignKey не нужен, если есть relationship` — нужен: сама связь в БД держится на нём.

#### 🧩 Собери код
Расставь шаги добавления связанной записи по порядку.
**Строки:** `order = Order()` · `payment = Payment(order=order)` · `session.add(payment)` · `session.commit()`
**Правильный порядок:** `order = Order()` · `payment = Payment(order=order)` · `session.add(payment)` · `session.commit()`

---

### Урок 6.5 — Repository-паттерн
**Экраны:** теория → задача

#### 📖 Теория
Чтобы работа с БД не растеклась по всему коду, её прячут в **репозиторий** — класс, отвечающий за один тип объектов. Остальной код зовёт методы репозитория, а не пишет запросы напрямую.

```python
class PaymentRepository:
    def __init__(self, session):
        self.session = session

    def get(self, payment_id):
        return self.session.get(Payment, payment_id)

    def add(self, payment):
        self.session.add(payment)
        self.session.commit()
        return payment
```

Плюс: если завтра поменяется способ хранения, ты правишь только репозиторий, а не сто мест в проекте.

🐍 Пай: «Репозиторий — единое окно к данным. Весь доступ к БД ходит через него, а не вразнобой».

#### 💻 Задача
**Условие (самопроверка):** добавь в `PaymentRepository` метод `set_status(self, payment_id, status)`, который находит платёж по id, меняет ему статус и коммитит. Верни обновлённый платёж.
**Стартовый код:**
```python
class PaymentRepository:
    def __init__(self, session):
        self.session = session

    # добавь метод set_status
```
**Подсказки:**
1. Сначала достань платёж: `self.session.get(Payment, payment_id)`.
2. Поменяй `payment.status` и сделай `commit`.
3. Решение:
```python
def set_status(self, payment_id, status):
    payment = self.session.get(Payment, payment_id)
    payment.status = status
    self.session.commit()
    return payment
```
**Автотесты:** самопроверка: метод находит платёж, меняет статус и коммитит изменения.

---

### Урок 6.6 — 🏆 БОСС: Order и Payment
**Экраны:** теория → задача

#### 📖 Теория
Заказ и платёж связаны: у заказа есть платёж. Опиши обе модели и свяжи их внешним ключом — это фундамент любой платёжной схемы.

🐍 Пай: «Order ←→ Payment — самая частая пара таблиц в финтехе. Свяжешь её — поймёшь любую другую связь».

#### 💻 Задача
**Условие (самопроверка):** опиши модели `Order(id, customer)` и `Payment(id, order_id → orders.id, amount)`. У платежа должен быть внешний ключ на заказ.
**Стартовый код:**
```python
from sqlalchemy import ForeignKey
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

class Base(DeclarativeBase):
    pass

# опиши Order и Payment со связью
```
**Подсказки:**
1. В `Payment` колонка `order_id` — это `mapped_column(ForeignKey("orders.id"))`.
2. Не забудь первичные ключи у обеих моделей.
3. Решение:
```python
class Order(Base):
    __tablename__ = "orders"
    id: Mapped[int] = mapped_column(primary_key=True)
    customer: Mapped[str]

class Payment(Base):
    __tablename__ = "payments"
    id: Mapped[int] = mapped_column(primary_key=True)
    order_id: Mapped[int] = mapped_column(ForeignKey("orders.id"))
    amount: Mapped[int]
```
**Автотесты:** самопроверка: Payment.order_id ссылается на orders.id через ForeignKey.

---

### Урок 6.7 — Чеклист модуля
**Экраны:** теория

#### 📖 Теория
**Что ты теперь умеешь:**
- объяснять, что такое ORM и зачем он нужен;
- описывать модели-классы для таблиц;
- делать CRUD через сессию и помнить про `commit`;
- связывать модели через ForeignKey и relationship;
- прятать доступ к БД за repository-паттерном.

**Связь с реальной работой:** в реальных интеграционных сервисах почти не пишут сырой SQL — данные о платежах, заказах и логах хранят и читают через ORM-модели и репозитории. Это делает код чище и безопаснее. Но как менять структуру таблиц, когда проект уже работает? Об этом — следующий модуль про миграции.

🐍 Пай: «Модели готовы. Теперь научимся менять схему БД безопасно — через Alembic».
