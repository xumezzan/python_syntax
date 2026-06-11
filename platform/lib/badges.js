// Достижения: проверяются по счётчикам стора, выдаются автоматически.
// У каждого — progress(p) → [текущее, цель] для грида с прогрессом.

import { levelFor } from './levels';

const c = (p, k) => p.counts?.[k] || 0;

export const BADGES = [
  { id: 'hello-world', name: 'Hello, World!', desc: 'Первая программа', icon: '👋',
    check: (p) => c(p, 'screens') >= 1, progress: (p) => [Math.min(c(p, 'screens'), 1), 1] },
  { id: 'clean-sheet', name: 'Чистый лист', desc: 'Глава 1 пройдена', icon: '📄',
    check: (p) => Object.keys(p.lessons).filter((id) => id.startsWith('1.')).length >= 10,
    progress: (p) => [Object.keys(p.lessons).filter((id) => id.startsWith('1.')).length, 10] },
  { id: 'screens-25', name: 'Разогнался', desc: '25 экранов пройдено', icon: '🚴',
    check: (p) => c(p, 'screens') >= 25, progress: (p) => [c(p, 'screens'), 25] },
  { id: 'screens-100', name: 'Сотня', desc: '100 экранов пройдено', icon: '💯',
    check: (p) => c(p, 'screens') >= 100, progress: (p) => [c(p, 'screens'), 100] },
  { id: 'sniper-20', name: 'Снайпер', desc: '20 ответов с первой попытки', icon: '🎯',
    check: (p) => c(p, 'firstTry') >= 20, progress: (p) => [c(p, 'firstTry'), 20] },
  { id: 'bughunter-10', name: 'Багхантер', desc: '10 починенных багов', icon: '🐞',
    check: (p) => c(p, 'bug') >= 10, progress: (p) => [c(p, 'bug'), 10] },
  { id: 'perfect-5', name: 'Чистая работа', desc: '5 идеальных уроков', icon: '◉',
    check: (p) => c(p, 'perfectLessons') >= 5, progress: (p) => [c(p, 'perfectLessons'), 5] },
  { id: 'boss-1', name: 'Гроза боссов', desc: 'Первый босс повержен', icon: '🏆',
    check: (p) => c(p, 'bosses') >= 1, progress: (p) => [c(p, 'bosses'), 1] },
  { id: 'streak-7', name: 'Неделя огня', desc: 'Серия 7 дней', icon: '🔥',
    check: (p) => (p.best || 0) >= 7, progress: (p) => [p.best || 0, 7] },
  { id: 'level-5', name: 'Пятый уровень', desc: 'Достигнут 5 уровень', icon: '⭐',
    check: (p) => levelFor(p.xp).level >= 5, progress: (p) => [levelFor(p.xp).level, 5] },
  { id: 'night-owl', name: 'Ночной кодер', desc: 'Урок между 00:00 и 05:00', icon: '🌙',
    check: () => false, progress: (p) => [p.badges?.['night-owl'] ? 1 : 0, 1] }, // выдаётся событием
  { id: 'weekly-boss', name: 'Вызов принят', desc: 'Босс недели повержен', icon: '⚔️',
    check: () => false, progress: (p) => [p.badges?.['weekly-boss'] ? 1 : 0, 1] }, // выдаётся событием
  { id: 'graduate', name: 'Выпускник', desc: 'Финальный босс курса', icon: '🎓',
    check: (p) => Boolean(p.lessons['10.8']), progress: (p) => [p.lessons['10.8'] ? 1 : 0, 1] },
];

/** Возвращает id бейджей, заслуженных, но ещё не выданных. */
export function evaluateBadges(p) {
  return BADGES.filter((b) => !p.badges[b.id] && b.check(p)).map((b) => b.id);
}
