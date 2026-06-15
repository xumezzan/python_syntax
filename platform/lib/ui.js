// Общие UI-хелперы карты, главы и профиля.

// Фирменные глифы модулей — символы из самого кода
export const GLYPHS = {
  'Первые шаги': '>',
  'Переменные и типы': '=',
  'Условия': '?',
  'Циклы': '↻',
  'Строки': '"a"',
  'Списки и кортежи': '[ ]',
  'Словари и множества': '{ }',
  'Функции': 'ƒ( )',
  'Ошибки и исключения': '!',
  'Файлы и финал': '▤',
  // backend-трек — те же код-глифы для единого стиля
  'HTTP и интернет': '://',
  'JSON и обмен данными': '{ }',
  'REST API': '/ /',
  'FastAPI': '@app',
  'PostgreSQL и SQL': 'SQL',
  'SQLAlchemy ORM': 'ORM',
  'Alembic: миграции': '▲▼',
  'Авторизация и безопасность API': 'JWT',
  'Работа с внешними API': '→API',
  'SOAP и XML': '</>',
  'Интеграции между системами': 'A→B',
  'Тестирование backend': '✓✓',
  'Docker и docker-compose': '▢▢',
  'Git и командная разработка': 'git',
  'Логи, ошибки и мониторинг': 'log',
  'Очереди и фоновые задачи': '[··]',
  'Основы SAP / ERP': 'SAP',
  'Финал: Enterprise Integration Simulator': '∎',
};

export function splitIcon(title) {
  const m = title.match(/^(.*?)\s*((?:\p{Extended_Pictographic}|️)+)$/u);
  if (m) return { name: m[1].trim(), icon: GLYPHS[m[1].trim()] || m[2] };
  return { name: title, icon: GLYPHS[title] || '•' };
}

export function cleanTitle(title, max = 34) {
  const t = title.replace(/^🏆 БОСС: /, '');
  return t.length > max ? t.slice(0, max - 1) + '…' : t;
}

export function pluralDays(n) {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return 'день';
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return 'дня';
  return 'дней';
}

export function lessonMinutes(screens) {
  return Math.max(2, Math.round(screens * 1.5));
}

// Как называем единицу программы в треке: синтаксис — «Глава», backend — «Модуль».
export function unitWord(track) {
  return track === 'backend' ? 'Модуль' : 'Глава';
}
