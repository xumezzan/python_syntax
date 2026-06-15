'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getProgress, PROGRESS_EVENT } from '@/lib/progress';
import { splitIcon, cleanTitle } from '@/lib/ui';

// Страница учебного трека: герой с роудмапом, чеклист навыков, карточки модулей
// со статусами (not started / in progress / completed) и карточка финального проекта.
// Переиспользует дизайн-классы карты курса (mod-card, steps, pill, mod-bar).

export default function TrackPage({ track, intro, modules }) {
  const [p, setP] = useState(null);
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    const update = () => setP(getProgress());
    update();
    window.addEventListener(PROGRESS_EVENT, update);
    return () => window.removeEventListener(PROGRESS_EVENT, update);
  }, []);

  const done = p?.lessons || {};
  const all = modules.flatMap((m) => m.lessons);
  const doneCount = all.filter((l) => done[l.id]).length;
  const pct = all.length ? Math.round((doneCount / all.length) * 100) : 0;
  const current = all.find((l) => !done[l.id]) || all[all.length - 1];
  const totalXp = all.reduce((s, l) => s + l.xp, 0);

  return (
    <div className="map track-page">
      <nav className="crumbs2">
        <Link href="/">Главная</Link>
        <span className="sep">/</span>
        <span className="here">Трек</span>
      </nav>

      {/* ---------- герой трека ---------- */}
      <section className="track-hero">
        <span className="eyebrow">
          {track.icon} Трек · {modules.length} модулей · {all.length} уроков · до {totalXp} XP
        </span>
        <h1 className="focus-title">{track.title}</h1>
        <p className="lead">{intro.tagline}</p>
        <div className="track-progress">
          <div className="mod-bar"><div className="mod-fill" style={{ width: pct + '%' }} /></div>
          <span className="dim">пройдено {doneCount} из {all.length} уроков</span>
        </div>
        <div className="hero2-cta">
          <Link className="cta" href={`/lesson/${current.module}/${current.num}`}>
            {doneCount > 0 ? 'Продолжить трек' : 'Начать трек'}
          </Link>
          <span className="cta-next">урок {current.id} · {cleanTitle(current.title)}</span>
        </div>
      </section>

      {/* ---------- зачем это в реальной работе ---------- */}
      <section className="info-block real-work">
        <h2>Зачем это нужно в реальной работе</h2>
        <ul>
          {intro.realWork.map((t, i) => (
            <li key={i}>{t}</li>
          ))}
        </ul>
      </section>

      {/* ---------- карточки модулей ---------- */}
      <div className="course-line">
        <span>Модули трека</span>
        <span className="dim">{modules.length} модулей</span>
      </div>

      {modules.map((m) => {
        const { name, icon } = splitIcon(m.title);
        const doneInModule = m.lessons.filter((l) => done[l.id]).length;
        const mpct = Math.round((doneInModule / m.lessons.length) * 100);
        const status =
          doneInModule === m.lessons.length
            ? 'finished'
            : doneInModule > 0
              ? 'active'
              : 'soon';
        const statusLabel =
          status === 'finished' ? 'Завершён' : status === 'active' ? 'В процессе' : 'Не начат';
        // по умолчанию раскрыт активный модуль или тот, где находится текущий урок
        const isOpen = expanded[m.id] ?? (status === 'active' || m.id === current.module);

        return (
          <article className={`mod-card ${status}${isOpen ? '' : ' collapsed'}`} key={m.id}>
            <header
              className="mod-head clickable"
              onClick={() => setExpanded((e) => ({ ...e, [m.id]: !isOpen }))}
            >
              <div className="mod-icon">{icon}</div>
              <div className="mod-titles">
                <h2>
                  <span className="mod-num">Модуль {m.trackNum}</span>
                  {name}
                </h2>
                <p>{m.goal.replace(/`/g, '')}</p>
              </div>
              <Link className="mod-open" href={`/module/${m.id}`} onClick={(e) => e.stopPropagation()}>
                Модуль →
              </Link>
              <span className={`pill ${status}`}>{statusLabel}</span>
              <span className={'chev' + (isOpen ? ' open' : '')}>▾</span>
            </header>

            <div className="mod-meta">
              <div className="mod-bar"><div className="mod-fill" style={{ width: `${mpct}%` }} /></div>
              <span>{doneInModule}/{m.lessons.length} уроков</span>
            </div>

            {isOpen && (
              <ol className="steps">
                {m.lessons.map((l) => {
                  const isDone = Boolean(done[l.id]);
                  const isCurrent = l.id === current.id;
                  const state = isDone ? 'done' : isCurrent ? 'current' : 'idle';
                  return (
                    <li key={l.id}>
                      <Link
                        href={`/lesson/${l.module}/${l.num}`}
                        className={`step ${state}${l.isBoss ? ' boss' : ''}`}
                      >
                        <span className="step-mark">{isDone ? '✓' : l.isBoss ? '🏆' : l.num}</span>
                        <span className="step-title">{cleanTitle(l.title)}</span>
                        {isCurrent && <span className="step-go">Продолжить →</span>}
                        {!isCurrent && l.isBoss && !isDone && <span className="step-chip">итог</span>}
                      </Link>
                    </li>
                  );
                })}
              </ol>
            )}
          </article>
        );
      })}

      {/* ---------- финальный проект ---------- */}
      <section className="final-project">
        <span className="eyebrow">🏁 Финальный проект</span>
        <h2>{intro.final.title}</h2>
        <p className="final-ru">{intro.final.ru}</p>
        <p>{intro.final.desc}</p>
        <div className="final-stack">
          {intro.final.stack.map((s) => (
            <span className="tech-chip" key={s}>{s}</span>
          ))}
        </div>
        <div className="final-grid">
          <div>
            <h3>Endpoints</h3>
            <ul className="mono-list">
              {intro.final.endpoints.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          </div>
          <div>
            <h3>Где код</h3>
            <p>
              Готовый референс-проект лежит в репозитории: <code>{intro.final.repo}</code>.
              Запуск — <code>docker compose up --build</code>. Подробности — в его README.
            </p>
          </div>
        </div>
      </section>

      {/* ---------- чеклист навыков ---------- */}
      <section className="info-block skills-block">
        <h2>Чеклист навыков после трека</h2>
        <ul className="skill-checklist">
          {intro.skills.map((s, i) => (
            <li key={i}><span className="check-box">✓</span>{s}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
