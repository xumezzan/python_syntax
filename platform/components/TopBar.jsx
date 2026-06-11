'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getProgress, todayXp, weekDays, setUiTheme, PROGRESS_EVENT } from '@/lib/progress';
import { levelFor } from '@/lib/levels';
import { skinEmoji } from '@/lib/skins';
import { startAutoSync } from '@/lib/sync';

function toggleTheme() {
  const next = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
  if (next === 'light') document.documentElement.setAttribute('data-theme', 'light');
  else document.documentElement.removeAttribute('data-theme');
  setUiTheme(next);
}

function GoalRing({ value, goal, size = 26 }) {
  const r = size / 2 - 3;
  const c = 2 * Math.PI * r;
  const pct = Math.min(1, goal > 0 ? value / goal : 0);
  return (
    <svg width={size} height={size} className="goal-ring" role="img"
      aria-label={`Цель дня: ${value} из ${goal} XP`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke="var(--panel-2)" strokeWidth="3" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke="var(--accent)" strokeWidth="3" strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={c * (1 - pct)}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dashoffset .4s' }} />
      {pct >= 1 && (
        <text x="50%" y="54%" dominantBaseline="middle" textAnchor="middle"
          fill="var(--accent)" fontSize="11" fontWeight="700">✓</text>
      )}
    </svg>
  );
}

export default function TopBar() {
  const [s, setS] = useState(null);

  useEffect(() => {
    startAutoSync();
    const update = () => {
      const p = getProgress();
      setS({
        xp: p.xp,
        streak: p.streak.count,
        goal: p.goal,
        today: todayXp(p),
        week: weekDays(p),
        level: levelFor(p.xp),
        skin: skinEmoji(p),
      });
    };
    update();
    window.addEventListener(PROGRESS_EVENT, update);
    return () => window.removeEventListener(PROGRESS_EVENT, update);
  }, []);

  return (
    <header className="topbar">
      <Link className="logo" href="/">{s?.skin || '🐍'} PySyntax</Link>
      <Link className="nav-link" href="/profile">Профиль</Link>
      <div className="spacer" />
      <button className="theme-toggle" onClick={toggleTheme} title="Светлая/тёмная тема — код остаётся тёмным">
        ☀︎/☾
      </button>
      {s && (
        <>
          <span className="week-dots" title="Последние 7 дней">
            {s.week.map((d) => (
              <i key={d.date}
                className={(d.xp > 0 ? 'on' : '') + (d.isToday ? ' today' : '')} />
            ))}
          </span>
          <span className="stat goal" title={`Цель дня: ${s.today}/${s.goal} XP`}>
            <GoalRing value={s.today} goal={s.goal} />
          </span>
          <span className="stat streak" title="Серия: дни занятий подряд">🔥 {s.streak}</span>
          <span className="stat xp"
            title={`Уровень ${s.level.level} · ${s.level.title} · до следующего ${s.level.need - s.level.into} XP`}>
            ⭐ {s.xp} XP
          </span>
        </>
      )}
    </header>
  );
}
