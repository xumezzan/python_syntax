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
