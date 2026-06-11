'use client';

import Link from 'next/link';
import { questState, streakBroken, weeklyRecap, dismissRecap, weeklyBossState } from '@/lib/progress';
import { cleanTitle } from '@/lib/ui';

/** Босс недели: +40 XP и бейдж за победу на этой неделе. */
export function WeeklyBossCard({ p, bosses }) {
  const state = weeklyBossState(p);
  if (!state) return null;
  const boss = bosses.find((b) => b.id === state.id);
  if (!boss) return null;
  if (state.done) {
    return (
      <section className="weekly-boss done">
        <span className="wb-ico">⚔️</span>
        <div>
          <b>Босс недели повержен!</b>
          <p>{cleanTitle(boss.title, 60)} · +40 XP и бейдж «Вызов принят» твои.</p>
        </div>
      </section>
    );
  }
  return (
    <section className="weekly-boss">
      <span className="wb-ico">⚔️</span>
      <div>
        <b>Босс недели: {cleanTitle(boss.title, 48)}</b>
        <p>Пройди до воскресенья — получишь +40 XP и бейдж «Вызов принят».</p>
      </div>
      <Link className="btn boss-btn" href={`/lesson/${boss.module}/${boss.num}`}>
        Принять вызов
      </Link>
    </section>
  );
}

/** Квесты дня + заморозки. */
export function QuestStrip({ p }) {
  const { quests, freezes, fragments } = questState(p);
  return (
    <section className="quests">
      <div className="quests-head">
        <span>Квесты дня</span>
        <span className="quests-right">
          <Link className="warmup-link" href="/warmup" title="3 вопроса из пройденных уроков">
            🔄 Разминка · ~2 мин
          </Link>
          <span className="freeze-info" title="Заморозка спасает серию при пропуске дня. 3 фрагмента = заморозка">
            ❄ {freezes}{fragments > 0 ? ` · фрагменты ${fragments}/3` : ''}
          </span>
        </span>
      </div>
      <div className="quest-row">
        {quests.map((q) => (
          <div className={'quest' + (q.done ? ' done' : '')} key={q.id}>
            <span className="quest-mark">{q.done ? '✓' : '◇'}</span>
            <span className="quest-label">{q.label}</span>
            <span className="quest-meta">
              {q.done ? `+${q.reward} XP` : `${q.value}/${q.target}`}
            </span>
            <span className="quest-bar"><i style={{ width: (q.value / q.target) * 100 + '%' }} /></span>
          </div>
        ))}
      </div>
    </section>
  );
}

/** Возвращение после перерыва — без стыда. */
export function ComebackCard({ p }) {
  if (!p || !streakBroken(p) || (p.best || 0) < 2) return null;
  return (
    <section className="comeback">
      <span className="comeback-ico">👋</span>
      <div>
        <b>С возвращением!</b>
        <p>Твой рекорд — {p.best} дн. подряд. Начнём новую серию с лёгкого повторения — и день засчитан.</p>
      </div>
      <Link className="btn primary" href="/warmup">
        Разогреться · ≈2 мин
      </Link>
    </section>
  );
}

/** Итоги прошлой недели (раз в неделю). */
export function RecapCard({ p }) {
  if (!p) return null;
  const recap = weeklyRecap(p);
  if (!recap) return null;
  return (
    <section className="recap">
      <span className="recap-ico">📈</span>
      <div>
        <b>Твоя неделя</b>
        <p>
          {recap.xp} XP · {recap.days} дн. активности
          {recap.deltaXp > 0 && ` · на ${recap.deltaXp} XP больше, чем неделей раньше`}
          {recap.days >= 5 && '. Так выглядит привычка.'}
        </p>
      </div>
      <button className="btn" onClick={() => dismissRecap(recap.week)}>Понял</button>
    </section>
  );
}
