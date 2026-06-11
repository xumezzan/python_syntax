// Квесты дня: 3 штуки, детерминированно выбираются из пула по дате.
// Метрики дня копятся в progress.questDay, награда выдаётся автоматически.

export const QUEST_POOL = [
  { id: 'screens3', label: 'Пройди 3 экрана', metric: 'screens', target: 3, reward: 15 },
  { id: 'xp40', label: 'Заработай 40 XP', metric: 'xpGained', target: 40, reward: 15 },
  { id: 'quiz2', label: 'Реши 2 квиза', metric: 'quiz', target: 2, reward: 15 },
  { id: 'first3', label: '3 ответа с первой попытки', metric: 'firstTry', target: 3, reward: 20 },
  { id: 'bug1', label: 'Почини 1 баг', metric: 'bug', target: 1, reward: 20 },
  { id: 'lesson1', label: 'Заверши 1 урок', metric: 'lessons', target: 1, reward: 20 },
  { id: 'perfect1', label: 'Пройди урок идеально', metric: 'perfectLessons', target: 1, reward: 25 },
];

function seedOf(str) {
  let h = 2166136261;
  for (const c of str) h = ((h ^ c.charCodeAt(0)) * 16777619) >>> 0;
  return h;
}

/** 3 квеста на дату (стабильны в течение дня). */
export function questsForDate(dateStr) {
  let h = seedOf(dateStr);
  const pool = [...QUEST_POOL];
  const picked = [];
  while (picked.length < 3 && pool.length) {
    h = (h * 1103515245 + 12345) >>> 0;
    picked.push(pool.splice(h % pool.length, 1)[0]);
  }
  return picked;
}
