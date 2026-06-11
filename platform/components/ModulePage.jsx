'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getProgress, PROGRESS_EVENT } from '@/lib/progress';
import { splitIcon, cleanTitle, lessonMinutes } from '@/lib/ui';

export default function ModulePage({ mod }) {
  const [p, setP] = useState(null);

  useEffect(() => {
    const update = () => setP(getProgress());
    update();
    window.addEventListener(PROGRESS_EVENT, update);
    return () => window.removeEventListener(PROGRESS_EVENT, update);
  }, []);

  const { name, icon } = splitIcon(mod.title);
  const done = p?.lessons || {};
  const doneCount = mod.lessons.filter((l) => done[l.id]).length;
  const pct = Math.round((doneCount / mod.lessons.length) * 100);
  const sealed = doneCount === mod.lessons.length;
  const current = mod.lessons.find((l) => !done[l.id]);
  const totalXp = mod.lessons.reduce((s, l) => s + l.xp, 0);
  const skills = mod.goal
    .replace(/`/g, '')
    .replace(/^ученик\s*/i, '')
    .split(/,\s*/)
    .map((s) => s.trim())
    .filter(Boolean);

  return (
    <div className="chapter">
      <nav className="crumbs2">
        <Link href="/">Карта</Link>
        <span className="sep">/</span>
        <span className="here">Глава {mod.id}</span>
      </nav>

      <header className="chapter-hero">
        <div className="chapter-glyph">{icon}</div>
        <div className="chapter-info">
          <span className="eyebrow">Глава {mod.id} · {mod.lessons.length} уроков · до {totalXp} XP</span>
          <h1>{name}</h1>
          <ul className="chapter-skills">
            {skills.slice(0, 4).map((s, i) => (
              <li key={i}>{s[0].toUpperCase() + s.slice(1)}</li>
            ))}
          </ul>
        </div>
        <aside className={'seal-card' + (sealed ? ' sealed' : '')}>
          <div className="seal">{sealed ? icon : '·'}</div>
          <span>{sealed ? 'Печать главы получена' : 'Награда главы — печать'}</span>
        </aside>
      </header>

      <div className="mod-meta chapter-meta">
        <div className="mod-bar"><div className="mod-fill" style={{ width: pct + '%' }} /></div>
        <span>{doneCount}/{mod.lessons.length} уроков</span>
      </div>

      <ol className="timeline">
        {mod.lessons.map((l) => {
          const isDone = Boolean(done[l.id]);
          const isCurrent = current && l.id === current.id;
          const isPerfect = Boolean(p?.perfect?.[l.id]);
          return (
            <li key={l.id} className={l.isBoss ? 'tl-boss-row' : ''}>
              <Link
                href={`/lesson/${l.module}/${l.num}`}
                className={
                  'tl-item' +
                  (isDone ? ' done' : isCurrent ? ' current' : ' idle') +
                  (l.isBoss ? ' boss' : '')
                }
              >
                <span className="tl-mark">{isDone ? '✓' : l.isBoss ? '🏆' : l.num}</span>
                <span className="tl-body">
                  <span className="tl-title">
                    {cleanTitle(l.title, 60)}
                    {isPerfect && <em className="step-perfect" title="Идеально"> ◉</em>}
                  </span>
                  {l.isBoss && <span className="tl-sub">Собери всё, что выучил, в настоящую программу</span>}
                </span>
                <span className="tl-meta">
                  {isCurrent ? (
                    <b className="tl-go">Продолжить · ≈{lessonMinutes(l.screens)} мин</b>
                  ) : (
                    <>≈{lessonMinutes(l.screens)} мин · {l.xp} XP</>
                  )}
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
