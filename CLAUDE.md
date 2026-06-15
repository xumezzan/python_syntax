# CLAUDE.md

Guidance for Claude Code when working in this repo.

## Что это

**PySyntax** — интерактивная обучающая платформа на русском языке. Два учебных трека:
1. **Python-синтаксис с нуля** — 10 модулей, 99 уроков (главная страница `/`).
2. **Python Backend: API, базы данных и интеграции** — 18 модулей, 128 уроков
   (`/track/backend`). Завершается рабочим проектом `enterprise-integration/`.

Голос продукта: дружелюбно, на «ты», без канцелярита; маскот — змейка Пай 🐍.

## Раскладка репозитория

```
platform/                 ← веб-приложение (Next.js 15 App Router + React 19)
  content/                  контент синтаксис-курса: module-01..10.md (markdown)
    backend/                контент backend-трека: module-01..18.md + 00-структура.md
  lib/course.mjs            парсер markdown → {modules, tracks}; реестр TRACKS
  lib/tracks-intro.js       витрина страницы трека (чеклист, финальный проект)
  components/               CourseMap, TrackPage, RoadmapPage, ModulePage, LessonPlayer, ...
  app/                      роуты: /, /roadmap, /track/[slug], /module/[id], /lesson/[m]/[l], /profile
  scripts/check-parse.mjs   сводка по трекам + проверка минимумов
  scripts/verify-solutions.mjs  прогон эталонных решений авто-задач (нужен python3)
  public/py-worker.js       Pyodide (CPython→WASM) в Web Worker
enterprise-integration/   ← финальный проект backend-трека (FastAPI, см. его README)
docs/DESIGN.md            ← дизайн-система и продуктовая стратегия
```

## Архитектура контента

- **Контент = markdown.** Правишь `module-XX.md` — урок обновляется без пересборки.
  `lib/course.mjs` парсит файлы в `modules → lessons → screens`. Типы экранов:
  `📖 теория · ✏️/💻 код · ❓ квиз · 🐞 найди баг · 🧩 собери код`.
- **Треки** заданы в `TRACKS` (course.mjs). Глобальные id модулей **сквозные**:
  синтаксис 1–10, backend 11–28. Это нужно, чтобы ключи прогресса (`localStorage`,
  `lessonId = module.num`) и роуты `/module/[id]`, `/lesson/[m]/[l]` не конфликтовали.
  В интерфейсе показывается трек-относительный номер (`trackNum`, «Модуль 1–18»).
- **Прогресс/XP/бейджи** — `localStorage` (`pysyntax-v1`), единые на оба трека.
  Кросс-девайс синхронизация — анонимный код + файловое хранилище `/api/sync`.
- Аккаунтов, БД и i18n у платформы нет; «админка» = редактирование markdown.

## Авто-проверка задач в браузере (Pyodide) — важные ограничения

Код ученика исполняется в Pyodide. Доступна **стандартная библиотека**
(`json`, `sqlite3`, `xml.etree`, `base64`, `hashlib`), но **нет** `fastapi`,
`sqlalchemy`, `httpx` и сети. Поэтому при написании контента backend-трека:

- авто-тестируемые задачи пиши на чистом Python (разбор JSON/XML, SQL на sqlite,
  логика retry/idempotency, маппинг) — таблица «Ввод → Ожидаемый вывод» в markdown;
- темы FastAPI/SQLAlchemy/Docker/Git — через квизы, баг, пазл и самопроверку
  (`**Автотесты:** самопроверка: …`);
- **читай многострочный ввод через `input()` + `try/except EOFError`, НЕ через
  `sys.stdin`** — воркер использует `setStdin` с autoEOF, где `sys.stdin` ненадёжен;
- для кириллицы в ожидаемом выводе `json.dumps(..., ensure_ascii=False)`.

## Команды

```bash
# платформа
cd platform
npm run dev      # localhost:3000
npm run build    # прод-сборка (быстрый способ поймать JSX/импорт-ошибки)
npm run check    # сводка по трекам + минимумы (≥3 урока, ≥2 практики, ≥3 квиза на модуль)
node scripts/verify-solutions.mjs   # исполнить эталонные решения авто-задач (python3)

# финальный проект
cd enterprise-integration
pytest                              # 22 теста (sqlite, моки)
docker compose up --build           # app + PostgreSQL
```

Нет `curl` в среде — для проверки роутов используй `python3 -m urllib`.
React SSR вставляет `<!-- -->` между текст-выражениями: при grep по SSR-HTML
сначала `.replace("<!-- -->","")`.

## Конвенции

- Не ломать синтаксис-курс и текущую архитектуру; переиспользовать дизайн-классы
  (`mod-card`, `steps`, `pill`, `cta`, `eyebrow`, токены `--accent` и т.д.).
- Минимумы на учебный модуль: ≥3 урока, ≥2 практики (код/баг/пазл), ≥3 квиза,
  чеклист модуля, итог. Проверять `npm run check` + `verify-solutions.mjs`.
- Все «опасные» интеграции — только mock/test. Секреты — только в `.env`
  (в репо лишь `.env.example`). Никаких реальных SAP/банковских credentials.
