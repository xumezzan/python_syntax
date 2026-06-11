'use client';

// Скины Пая — облики маскота за реальные достижения.

const c = (p, k) => p.counts?.[k] || 0;

export const SKINS = [
  { id: 'snake', emoji: '🐍', name: 'Классический Пай',
    unlock: () => true, hint: 'доступен сразу' },
  { id: 'turtle', emoji: '🐢', name: 'Неспешный мудрец',
    unlock: (p) => c(p, 'lessons') >= 10, hint: 'пройди 10 уроков' },
  { id: 'dragon', emoji: '🐲', name: 'Дракоша',
    unlock: (p) => c(p, 'bosses') >= 3, hint: 'победи 3 боссов' },
  { id: 'crown', emoji: '👑', name: 'Король кода',
    unlock: (p) => c(p, 'perfectLessons') >= 5, hint: '5 идеальных уроков' },
];

export function skinEmoji(p) {
  const skin = SKINS.find((s) => s.id === p?.paiSkin);
  return skin && skin.unlock(p) ? skin.emoji : '🐍';
}
