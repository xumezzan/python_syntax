'use client';

// Прогресс ученика в localStorage. Единая точка событий: начисление XP,
// серия с заморозками, метрики квестов дня, счётчики достижений.

import { questsForDate } from './quests';
import { evaluateBadges } from './badges';

const KEY = 'pysyntax-v1';
export const PROGRESS_EVENT = 'pysyntax-progress';

function empty() {
  return {
    xp: 0,
    screens: {},
    lessons: {},
    streak: { last: null, count: 0 },
    best: 0,
    goal: 30,
    daily: {},                     // XP по дням
    perfect: {},
    badges: {},
    combo: 0,
    onboarded: false,
    motive: null,
    freezes: 0,                    // заморозки серии (макс 2)
    fragments: 0,                  // 3 фрагмента = заморозка
    counts: {},                    // счётчики достижений: screens, quiz, bug, …
    questDay: null,                // { date, metrics, done }
    lastRecapWeek: null,
    editorTheme: 'vs-dark',        // выбранная тема Monaco
    weeklyBoss: null,              // { week, id, done }
    uiTheme: 'dark',               // тема интерфейса (код всегда тёмный)
    paiSkin: 'snake',              // облик маскота
  };
}

export function todayStr(offsetDays = 0) {
  return new Date(Date.now() - offsetDays * 86400000).toISOString().slice(0, 10);
}

export function getProgress() {
  if (typeof window === 'undefined') return empty();
  try {
    return { ...empty(), ...JSON.parse(localStorage.getItem(KEY) || '{}') };
  } catch {
    return empty();
  }
}

function save(p) {
  localStorage.setItem(KEY, JSON.stringify(p));
  window.dispatchEvent(new CustomEvent(PROGRESS_EVENT));
}

/* ---------- серия и заморозки ---------- */

function touchStreak(p) {
  const today = todayStr();
  if (p.streak.last === today) return;
  const yesterday = todayStr(1);
  const dayBefore = todayStr(2);
  if (p.streak.last === yesterday) {
    p.streak.count += 1;
  } else if (p.streak.last === dayBefore && p.freezes > 0) {
    // пропущен ровно один день — заморозка спасает серию
    p.freezes -= 1;
    p.streak.count += 1;
  } else {
    p.streak.count = 1;
  }
  p.streak.last = today;
  if (p.streak.count > (p.best || 0)) p.best = p.streak.count;
  // награда за каждые 7 дней подряд — заморозка
  if (p.streak.count > 0 && p.streak.count % 7 === 0 && p.freezes < 2) p.freezes += 1;
}

/* ---------- квесты дня ---------- */

function ensureQuestDay(p) {
  const t = todayStr();
  if (!p.questDay || p.questDay.date !== t) {
    p.questDay = { date: t, metrics: {}, done: {} };
  }
}

function bump(p, metric, n = 1) {
  ensureQuestDay(p);
  p.questDay.metrics[metric] = (p.questDay.metrics[metric] || 0) + n;
  p.counts[metric] = (p.counts[metric] || 0) + n;
}

function evalQuests(p) {
  ensureQuestDay(p);
  let bonus = 0;
  for (const q of questsForDate(p.questDay.date)) {
    if (!p.questDay.done[q.id] && (p.questDay.metrics[q.metric] || 0) >= q.target) {
      p.questDay.done[q.id] = true;
      bonus += q.reward;
      p.fragments += 1;
      if (p.fragments >= 3 && p.freezes < 2) {
        p.fragments -= 3;
        p.freezes += 1;
      }
    }
  }
  if (bonus > 0) {
    p.xp += bonus;
    p.daily[todayStr()] = (p.daily[todayStr()] || 0) + bonus;
  }
  return bonus;
}

function evalBadges(p) {
  for (const id of evaluateBadges(p)) p.badges[id] = Date.now();
}

/** Состояние квестов дня для UI: [{...квест, value, done}] и заморозки. */
export function questState(p = getProgress()) {
  const date = todayStr();
  const qd = p.questDay && p.questDay.date === date ? p.questDay : { metrics: {}, done: {} };
  return {
    quests: questsForDate(date).map((q) => ({
      ...q,
      value: Math.min(qd.metrics[q.metric] || 0, q.target),
      done: Boolean(qd.done[q.id]),
    })),
    freezes: p.freezes,
    fragments: p.fragments,
  };
}

/* ---------- события обучения ---------- */

/**
 * Засчитать экран. type — тип экрана ('quiz' | 'bug' | 'code' | 'puzzle').
 * Комбо точности: с 3-го firstTry подряд XP ×1.5.
 */
export function awardScreen(screenId, xp, { firstTry = false, type = null } = {}) {
  const p = getProgress();
  if (p.screens[screenId]) return { fresh: false, gained: 0, combo: p.combo, mult: 1 };
  p.combo = firstTry ? (p.combo || 0) + 1 : 0;
  const mult = p.combo >= 3 ? 1.5 : 1;
  const gained = Math.round(xp * mult);
  p.screens[screenId] = 1;
  p.xp += gained;
  p.daily[todayStr()] = (p.daily[todayStr()] || 0) + gained;
  bump(p, 'screens');
  if (type && type !== 'theory') bump(p, type);
  if (firstTry) bump(p, 'firstTry');
  bump(p, 'xpGained', gained);
  touchStreak(p);
  const questBonus = evalQuests(p);
  evalBadges(p);
  save(p);
  return { fresh: true, gained, combo: p.combo, mult, questBonus };
}

export function isScreenDone(screenId) {
  return Boolean(getProgress().screens[screenId]);
}

export function completeLesson(lessonId, { perfect = false, isBoss = false } = {}) {
  const p = getProgress();
  const firstTime = !p.lessons[lessonId];
  if (perfect && !p.perfect[lessonId]) {
    p.perfect[lessonId] = 1;
    bump(p, 'perfectLessons');
  }
  if (firstTime) {
    p.lessons[lessonId] = 1;
    bump(p, 'lessons');
    if (isBoss) bump(p, 'bosses');
    const h = new Date().getHours();
    if (h < 5 && !p.badges['night-owl']) p.badges['night-owl'] = Date.now();
    // босс недели: бонус +40 XP и бейдж
    if (
      isBoss && p.weeklyBoss && !p.weeklyBoss.done &&
      p.weeklyBoss.id === lessonId && p.weeklyBoss.week === isoWeek()
    ) {
      p.weeklyBoss.done = true;
      p.xp += 40;
      p.daily[todayStr()] = (p.daily[todayStr()] || 0) + 40;
      if (!p.badges['weekly-boss']) p.badges['weekly-boss'] = Date.now();
    }
  }
  touchStreak(p);
  evalQuests(p);
  evalBadges(p);
  save(p);
}

export function isLessonDone(lessonId) {
  return Boolean(getProgress().lessons[lessonId]);
}

export function addBadge(id) {
  const p = getProgress();
  if (p.badges[id]) return false;
  p.badges[id] = Date.now();
  save(p);
  return true;
}

export function setGoal(goalXp) {
  const p = getProgress();
  p.goal = goalXp;
  save(p);
}

export function setOnboarded(motive = null) {
  const p = getProgress();
  p.onboarded = true;
  if (motive) p.motive = motive;
  save(p);
}

/** Списать XP (подсказки). Ниже нуля не уходим. */
export function spendXp(n) {
  const p = getProgress();
  p.xp = Math.max(0, p.xp - n);
  save(p);
}

export function setEditorTheme(id) {
  const p = getProgress();
  p.editorTheme = id;
  save(p);
}

export function setUiTheme(mode) {
  const p = getProgress();
  p.uiTheme = mode;
  save(p);
}

export function setPaiSkin(id) {
  const p = getProgress();
  p.paiSkin = id;
  save(p);
}

/** Назначить цель «босса недели» (раз в ISO-неделю). */
export function setWeeklyBossTarget(lessonId) {
  const p = getProgress();
  const week = isoWeek();
  if (p.weeklyBoss && p.weeklyBoss.week === week) return;
  p.weeklyBoss = { week, id: lessonId, done: false };
  save(p);
}

/** Текущий босс недели или null, если неделя сменилась. */
export function weeklyBossState(p = getProgress()) {
  if (!p.weeklyBoss || p.weeklyBoss.week !== isoWeek()) return null;
  return p.weeklyBoss;
}

/* ---------- статистика для UI ---------- */

export function todayXp(p = getProgress()) {
  return p.daily[todayStr()] || 0;
}

/** Последние 7 дней (включая сегодня): [{ date, xp, isToday }] */
export function weekDays(p = getProgress()) {
  const out = [];
  for (let i = 6; i >= 0; i--) {
    const date = todayStr(i);
    out.push({ date, xp: p.daily[date] || 0, isToday: i === 0 });
  }
  return out;
}

/** Серия прервана (был прогресс, но позавчера и раньше)? */
export function streakBroken(p = getProgress()) {
  return Boolean(p.streak.last) && p.streak.last < todayStr(1);
}

function isoWeek(d = new Date()) {
  const dt = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = dt.getUTCDay() || 7;
  dt.setUTCDate(dt.getUTCDate() + 4 - day);
  const y = dt.getUTCFullYear();
  const week = Math.ceil(((dt - Date.UTC(y, 0, 1)) / 86400000 + 1) / 7);
  return `${y}-W${week}`;
}

/** Итоги прошлой недели для recap (или null, если показывать нечего). */
export function weeklyRecap(p = getProgress()) {
  const thisWeek = isoWeek();
  if (p.lastRecapWeek === thisWeek) return null;
  const sumDays = (from, to) => {
    let xp = 0;
    let days = 0;
    for (let i = from; i < to; i++) {
      const v = p.daily[todayStr(i)] || 0;
      xp += v;
      if (v > 0) days += 1;
    }
    return { xp, days };
  };
  const dow = new Date().getDay() || 7; // 1=пн … 7=вс
  const prev = sumDays(dow, dow + 7);        // прошлая календарная неделя
  const before = sumDays(dow + 7, dow + 14); // неделя до неё
  if (prev.xp === 0) return null;
  return { week: thisWeek, xp: prev.xp, days: prev.days, deltaXp: prev.xp - before.xp };
}

export function dismissRecap(week) {
  const p = getProgress();
  p.lastRecapWeek = week;
  save(p);
}
