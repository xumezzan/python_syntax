// Витринные данные для страниц треков: чеклист навыков, блок «зачем в работе»
// и карточка финального проекта. Контент модулей живёт в markdown — здесь только
// то, что нужно странице трека сверх списка модулей.

export const TRACK_INTRO = {
  backend: {
    tagline:
      'После Python-синтаксиса — путь в backend: REST API, базы данных, внешние сервисы и интеграции уровня SAP/банк.',
    // чеклист навыков «после курса умеешь»
    skills: [
      'Понимать HTTP: клиент, сервер, request/response, статус-коды',
      'Проектировать REST API и правильно выбирать методы и коды',
      'Создавать backend на FastAPI с Pydantic-схемами',
      'Работать с PostgreSQL и писать SQL: SELECT/JOIN/WHERE',
      'Использовать SQLAlchemy ORM и repository-паттерн',
      'Делать миграции через Alembic',
      'Настраивать авторизацию: пароли, JWT, роли и доступы',
      'Подключать внешние API: httpx, timeout, retry, обработка ошибок',
      'Понимать SOAP и XML — язык корпоративных систем',
      'Проектировать интеграции: idempotency, webhook, audit trail',
      'Писать backend-тесты на pytest и FastAPI TestClient',
      'Запускать сервис в Docker и docker-compose',
      'Логировать, считать метрики и делать health checks',
      'Выносить тяжёлую работу в очереди и фоновые задачи',
      'Понимать основы SAP / ERP / S/4HANA глазами интегратора',
      'Собрать enterprise integration simulator целиком',
    ],
    // блок «зачем это нужно в реальной работе»
    realWork: [
      'Это ровно те задачи, что в вакансиях интеграторов: связать SAP S/4HANA с банком или госсистемой через API.',
      'REST и SOAP, idempotency и retry, логи и сверка — без этого ни один платёжный поток не доходит до прода.',
      'Финальный проект — портфолио: показываешь работающий backend, а не «прошёл уроки».',
    ],
    // карточка финального проекта
    final: {
      title: 'Enterprise Integration Simulator',
      ru: 'Симулятор корпоративной интеграции SAP и банка',
      desc: 'Backend на FastAPI, который связывает mock-SAP и mock-банк: создаёт платёж, отправляет в банк, ловит webhook, ведёт integration logs, защищается idempotency и retry. Настоящего SAP и банка нет — только безопасные моки.',
      stack: ['FastAPI', 'PostgreSQL', 'SQLAlchemy', 'Alembic', 'JWT', 'Docker', 'pytest'],
      endpoints: [
        'POST /auth/register · POST /auth/login',
        'POST /payments · GET /payments/{id}',
        'POST /payments/{id}/send-to-bank',
        'POST /bank/webhook',
        'GET /integration-logs',
        'GET /sap/orders · POST /sap/payment-request',
      ],
      repo: 'enterprise-integration/',
    },
  },
};
