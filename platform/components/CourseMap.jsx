'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getProgress, todayXp, weekDays, setWeeklyBossTarget, PROGRESS_EVENT } from '@/lib/progress';
import { levelFor } from '@/lib/levels';
import { splitIcon, cleanTitle, pluralDays } from '@/lib/ui';
import { QuestStrip, ComebackCard, RecapCard, WeeklyBossCard } from '@/components/DashboardExtras';

export default function CourseMap({ modules, otherTracks = [] }) {
  const router = useRouter();
  const [p, setP] = useState(null);
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    const update = () => setP(getProgress());
    update();
    window.addEventListener(PROGRESS_EVENT, update);
    return () => window.removeEventListener(PROGRESS_EVENT, update);
  }, []);

  // новичков встречает онбординг
  useEffect(() => {
    if (p && !p.onboarded && p.xp === 0 && Object.keys(p.lessons).length === 0) {
      router.replace('/start');
    }
  }, [p, router]);

  const done = p?.lessons || {};
  const all = modules.flatMap((m) => m.lessons);
  const bosses = all.filter((l) => l.isBoss);
  const current = all.find((l) => !done[l.id]) || all[all.length - 1];

  // назначаем босса недели: ближайший непройденный
  useEffect(() => {
    if (!p || !p.onboarded) return;
    const target = bosses.find((b) => !p.lessons[b.id]);
    if (target) setWeeklyBossTarget(target.id);
  }, [p]); // eslint-disable-line react-hooks/exhaustive-deps
  const doneCount = all.filter((l) => done[l.id]).length;
  const started = doneCount > 0 || (p?.xp || 0) > 0;
  const currentModuleId = current.module;

  const stepsDone = p
    ? Object.keys(p.screens).filter((k) => k.startsWith(`s:${current.id}:`)).length
    : 0;
  const minutesLeft = Math.max(1, Math.round((current.screens - stepsDone) * 1.5));

  const level = levelFor(p?.xp || 0);
  const today = p ? todayXp(p) : 0;
  const goal = p?.goal || 30;
  const week = p ? weekDays(p) : [];
  const goalDone = today >= goal;

  return (
    <div className="map">
      {/* ---------- Daily Focus ---------- */}
      <section className="hero2">
        <div className="focus-card">
          <span className="eyebrow">
            {started ? `${greeting()} · сегодня — ≈ ${minutesLeft} мин` : 'Интерактивный курс · 99 уроков'}
          </span>
          {started ? (
            <h1 className="focus-title">
              {stepsDone > 0 ? 'Ты уже начал:' : 'Дальше по пути:'}<br />
              урок {current.id} · {cleanTitle(current.title)}
            </h1>
          ) : (
            <h1 className="focus-title">Python-синтаксис с&nbsp;нуля 🐍</h1>
          )}
          <p className="lead">
            {started
              ? stepsDone > 0
                ? `Шаг ${stepsDone + 1} из ${current.screens} — осталось совсем немного.`
                : `Глава ${current.module} продолжается. Один урок — и день засчитан.`
              : 'Чистый лист — лучшее место для старта. Первый урок займёт 3 минуты.'}
          </p>
          <div className="hero2-cta">
            <Link className="cta" href={`/lesson/${current.module}/${current.num}`}>
              {started ? 'Продолжить обучение' : 'Начать обучение'}
            </Link>
            <span className="cta-next">≈ {minutesLeft} мин · +{current.xp} XP</span>
          </div>
        </div>

        <aside className="stats-card">
          <div className="level-block">
            <div className="level-head">
              <span className="level-name">Уровень {level.level} · {level.title}</span>
              <span className="level-xp">{level.into} / {level.need} XP</span>
            </div>
            <div className="level-bar">
              <div className="level-fill" style={{ width: `${(level.into / level.need) * 100}%` }} />
            </div>
            <div className="level-left">до уровня {level.level + 1} — {level.need - level.into} XP</div>
          </div>
          <ul className="stat-list">
            <li>
              <span className="stat-ico">🔥</span>
              <span>Серия</span>
              <b>{p?.streak.count || 0} {pluralDays(p?.streak.count || 0)}{(p?.freezes || 0) > 0 ? ` · ❄${p.freezes}` : ''}</b>
            </li>
            <li>
              <span className="stat-ico">{goalDone ? '✓' : '○'}</span>
              <span>Цель дня</span>
              <b className={goalDone ? 'ok' : 'dim'}>{today} / {goal} XP</b>
            </li>
            <li className="week-row">
              <span className="stat-ico">·</span>
              <span>Неделя</span>
              <b>
                <span className="week-dots big">
                  {week.map((d) => (
                    <i key={d.date} className={(d.xp > 0 ? 'on' : '') + (d.isToday ? ' today' : '')} />
                  ))}
                </span>
              </b>
            </li>
          </ul>
        </aside>
      </section>

      {p && started && <ComebackCard p={p} current={current} />}
      {p && started && <RecapCard p={p} />}
      {p && started && <WeeklyBossCard p={p} bosses={bosses} />}
      {p && started && <QuestStrip p={p} />}

      {/* ---------- другие треки ---------- */}
      {otherTracks.length > 0 && (
        <section className="tracks-strip">
          <div className="course-line">
            <span>Что дальше</span>
            <Link className="dim track-roadmap-link" href="/roadmap">Роудмап →</Link>
          </div>
          {otherTracks.map((t) => (
              <Link className="track-card" href={`/track/${t.slug}`} key={t.slug}>
                <div className="track-ico">{t.icon}</div>
                <div className="track-body">
                  <span className="eyebrow">Новый трек · {t.modules} модулей · {t.lessons} уроков</span>
                  <h3>{t.title}</h3>
                  <p>{t.short}</p>
                </div>
                <span className="track-go">Открыть трек →</span>
              </Link>
          ))}
        </section>
      )}

      {/* ---------- тропа ---------- */}
      <div className="course-line">
        <span>Путь курса</span>
        <span className="dim">пройдено {doneCount} из {all.length}</span>
      </div>

      {modules.map((m) => {
        const { name, icon } = splitIcon(m.title);
        const doneInModule = m.lessons.filter((l) => done[l.id]).length;
        const pct = Math.round((doneInModule / m.lessons.length) * 100);
        const status =
          doneInModule === m.lessons.length
            ? 'finished'
            : m.id === currentModuleId
              ? 'active'
              : m.id < currentModuleId
                ? 'open'
                : 'soon';
        const isOpen = expanded[m.id] ?? (status === 'active' || status === 'open');
        const perfectCount = m.lessons.filter((l) => p?.perfect?.[l.id]).length;

        return (
          <article className={`mod-card ${status}${isOpen ? '' : ' collapsed'}`} key={m.id}>
            <header
              className="mod-head clickable"
              onClick={() => setExpanded((e) => ({ ...e, [m.id]: !isOpen }))}
            >
              <div className="mod-icon">{icon}</div>
              <div className="mod-titles">
                <h2>
                  <span className="mod-num">Глава {m.id}</span>
                  {name}
                  {status === 'finished' && perfectCount > 0 && (
                    <span className="perfect-note">◉ идеальных: {perfectCount}</span>
                  )}
                </h2>
                <p>{m.goal.replace(/`/g, '')}</p>
              </div>
              <Link
                className="mod-open"
                href={`/module/${m.id}`}
                onClick={(e) => e.stopPropagation()}
              >
                Глава →
              </Link>
              <span className={`pill ${status}`}>{STATUS_LABEL[status]}</span>
              <span className={'chev' + (isOpen ? ' open' : '')}>▾</span>
            </header>

            <div className="mod-meta">
              <div className="mod-bar">
                <div className="mod-fill" style={{ width: `${pct}%` }} />
              </div>
              <span>{doneInModule}/{m.lessons.length} уроков</span>
            </div>

            {isOpen && (
              <ol className="steps">
                {m.lessons.map((l) => {
                  const isDone = Boolean(done[l.id]);
                  const isCurrent = l.id === current.id;
                  const isPerfect = Boolean(p?.perfect?.[l.id]);
                  const state = isDone ? 'done' : isCurrent ? 'current' : 'idle';
                  return (
                    <li key={l.id}>
                      <Link
                        href={`/lesson/${l.module}/${l.num}`}
                        className={`step ${state}${l.isBoss ? ' boss' : ''}`}
                      >
                        <span className="step-mark">
                          {isDone ? '✓' : l.isBoss ? '🏆' : l.num}
                        </span>
                        <span className="step-title">{cleanTitle(l.title)}</span>
                        {isPerfect && <span className="step-perfect" title="Пройден идеально">◉</span>}
                        {isCurrent && <span className="step-go">Продолжить →</span>}
                        {!isCurrent && l.isBoss && !isDone && <span className="step-chip">босс</span>}
                      </Link>
                    </li>
                  );
                })}
              </ol>
            )}

            {status === 'soon' && !isOpen && (
              <p className="soon-note">откроется после Главы {m.id - 1}</p>
            )}
          </article>
        );
      })}
    </div>
  );
}

const STATUS_LABEL = {
  finished: 'Пройдено',
  active: 'Сейчас здесь',
  open: 'Открыт',
  soon: 'Скоро',
};

function greeting() {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return 'Доброе утро';
  if (h >= 12 && h < 18) return 'Добрый день';
  if (h >= 18 && h < 23) return 'Добрый вечер';
  return 'Доброй ночи';
}
