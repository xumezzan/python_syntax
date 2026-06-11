// Кривая уровней: стоимость уровня N = 50 + 25·N XP (уровень 1 → 75 XP).
// Титулы — вехи пути питониста.

const TITLES = [
  [1, 'Новичок'],
  [3, 'Печатник'],
  [5, 'Мастер переменных'],
  [8, 'Укротитель циклов'],
  [12, 'Строковых дел мастер'],
  [16, 'Функциональный'],
  [20, 'Питонист'],
];

export function titleFor(level) {
  let t = TITLES[0][1];
  for (const [lvl, title] of TITLES) if (level >= lvl) t = title;
  return t;
}

/** Возвращает { level, into, need, title } для суммарного XP. */
export function levelFor(xp) {
  let level = 1;
  let rem = xp;
  for (;;) {
    const cost = 50 + 25 * level;
    if (rem < cost) return { level, into: rem, need: cost, title: titleFor(level) };
    rem -= cost;
    level += 1;
  }
}
