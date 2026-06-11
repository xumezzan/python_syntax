'use client';

import Link from 'next/link';
import { useEffect, useState, useRef, useCallback } from 'react';
import { awardScreen, isScreenDone, completeLesson, getProgress, todayXp } from '@/lib/progress';
import TheoryScreen from '@/components/screens/TheoryScreen';
import CodeScreen from '@/components/screens/CodeScreen';
import QuizScreen from '@/components/screens/QuizScreen';
import BugScreen from '@/components/screens/BugScreen';
import PuzzleScreen from '@/components/screens/PuzzleScreen';
import Confetti from '@/components/rewards/Confetti';
import CountUp from '@/components/rewards/CountUp';

const SEG_LABEL = {
  theory: 'Теория',
  quiz: 'Квиз',
  bug: 'Найди баг',
  puzzle: 'Собери код',
};
const CODE_SEG_LABEL = { fill: 'Допиши код', task: 'Практика', boss: 'Босс' };

function segLabel(screen) {
  return screen.type === 'code' ? CODE_SEG_LABEL[screen.kind] : SEG_LABEL[screen.type];
}

function promiseFor(lesson) {
  const code = lesson.screens.filter((s) => s.type === 'code').length;
  const hasTheory = lesson.screens.some((s) => s.type === 'theory');
  if (lesson.isBoss) return 'Босс-уровень: собери всё, что выучил, в одну настоящую программу.';
  if (code > 0 && hasTheory) return `Короткая теория — и сразу ${code} ${pluralPractice(code)} в редакторе.`;
  if (code > 0) return `Никакой теории — только практика: ${code} ${pluralPractice(code)} подряд.`;
  return 'Быстрое закрепление: проверь себя без написания кода.';
}

function pluralPractice(n) {
  if (n === 1) return 'практика';
  if (n >= 2 && n <= 4) return 'практики';
  return 'практик';
}

export default function LessonPlayer({ lesson, moduleTitle, prev, next, moduleLessonIds }) {
  const [idx, setIdx] = useState(0);
  const [done, setDone] = useState({});
  const [finished, setFinished] = useState(false);
  const [toast, setToast] = useState(null);
  const [combo, setCombo] = useState(0);

  // сессионные итоги для celebration
  const session = useRef({ xp: 0, allFirstTry: true, freshAll: true });
  const [finishStats, setFinishStats] = useState(null);

  const keyOf = (i) => `s:${lesson.id}:${i}`;

  useEffect(() => {
    const d = {};
    let anyPreDone = false;
    lesson.screens.forEach((_, i) => {
      d[i] = isScreenDone(keyOf(i));
      if (d[i]) anyPreDone = true;
    });
    setDone(d);
    setIdx(0);
    setFinished(false);
    setCombo(getProgress().combo || 0);
    session.current = { xp: 0, allFirstTry: true, freshAll: !anyPreDone };
  }, [lesson.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const complete = useCallback(
    (i, meta = {}) => {
      const screen = lesson.screens[i];
      const firstTry = Boolean(meta.firstTry);
      const res = awardScreen(keyOf(i), screen.xp, { firstTry, type: screen.type });
      setDone((d) => ({ ...d, [i]: true }));
      setCombo(res.combo);
      if (!firstTry) session.current.allFirstTry = false;
      if (res.fresh && res.gained > 0) {
        session.current.xp += res.gained;
        setToast(
          res.mult > 1
            ? `+${res.gained} XP · серия точных ×${res.combo}`
            : `+${res.gained} XP`
        );
        setTimeout(() => setToast(null), 2000);
      }
    },
    [lesson] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const goNext = () => {
    const screen = lesson.screens[idx];
    if (screen.type === 'theory' && !done[idx]) complete(idx, { firstTry: true });
    if (idx + 1 < lesson.screens.length) {
      setIdx(idx + 1);
    } else {
      const interactive = lesson.screens.some((s) => s.type !== 'theory');
      const perfect =
        interactive && session.current.freshAll && session.current.allFirstTry;
      completeLesson(lesson.id, { perfect, isBoss: lesson.isBoss });
      const p = getProgress();
      const moduleDone = moduleLessonIds.every((id) => p.lessons[id]);
      setFinishStats({
        xp: session.current.xp,
        perfect,
        streak: p.streak.count,
        today: todayXp(p),
        goal: p.goal,
        moduleDone,
      });
      setFinished(true);
    }
    window.scrollTo({ top: 0 });
  };

  /* ---------- celebration ---------- */
  if (finished && finishStats) {
    const f = finishStats;
    const celebrate = lesson.isBoss || f.moduleDone;
    return (
      <div className="player">
        {celebrate && <Confetti />}
        <div className="screen-card finish-card">
          <div className="big">{f.moduleDone ? '🏅' : lesson.isBoss ? '🏆' : '✓'}</div>
          <h2>
            {f.moduleDone
              ? `Глава ${lesson.module} пройдена!`
              : `Урок ${lesson.id} пройден!`}
            {f.perfect && <span className="perfect-badge">◉ Идеально</span>}
          </h2>
          <p className="finish-sub">
            {f.moduleDone
              ? `«${moduleTitle.replace(/\s*\p{Extended_Pictographic}+\s*$/u, '')}» — в коллекции. Так выглядит настоящий прогресс.`
              : f.perfect
                ? 'Без единой подсказки, всё с первой попытки. Чисто.'
                : 'Ты уже лучше, чем час назад.'}
          </p>

          <div className="finish-stats">
            <div className="fstat">
              <span className="fstat-num gold">
                {f.xp > 0 ? <CountUp to={f.xp} prefix="+" suffix=" XP" /> : '— XP'}
              </span>
              <span className="fstat-label">{f.xp > 0 ? 'заработано' : 'уже был пройден'}</span>
            </div>
            <div className="fstat">
              <span className="fstat-num">🔥 {f.streak}</span>
              <span className="fstat-label">серия дней</span>
            </div>
            <div className="fstat">
              <span className={'fstat-num' + (f.today >= f.goal ? ' ok' : '')}>
                {f.today >= f.goal ? '✓' : `${f.today}/${f.goal}`}
              </span>
              <span className="fstat-label">
                {f.today >= f.goal ? 'цель дня готова' : 'цель дня · XP'}
              </span>
            </div>
          </div>

          {next && (
            <p className="finish-teaser">
              Следующий: <b>{next.title.replace(/^🏆 БОСС: /, '')}</b> · ещё ≈ {Math.max(2, Math.round(next.screens * 1.5))} мин
            </p>
          )}

          <div className="finish-actions">
            <Link className="btn" href="/" style={btnLink}>На сегодня хватит</Link>
            {next && (
              <Link className="btn primary" href={`/lesson/${next.module}/${next.num}`} style={btnLink}>
                Продолжить →
              </Link>
            )}
          </div>
          {f.today >= f.goal && (
            <p className="finish-note">Цель дня выполнена. Хочешь продолжить — путь открыт, но и так — молодец.</p>
          )}
        </div>
      </div>
    );
  }

  const screen = lesson.screens[idx];
  const canNext = screen.type === 'theory' || done[idx];
  const minutes = Math.max(2, Math.round(lesson.screens.length * 1.5));
  const cleanModule = moduleTitle.replace(/\s*\p{Extended_Pictographic}+\s*$/u, '');
  const cleanLesson = lesson.title.replace(/^🏆 БОСС: /, '');

  return (
    <div className="player">
      <header className="lesson-hero">
        <nav className="crumbs2">
          <Link href="/">Карта</Link>
          <span className="sep">/</span>
          <span>Глава {lesson.module} · {cleanModule}</span>
          <span className="sep">/</span>
          <span className="here">Урок {lesson.id}</span>
        </nav>
        <h1>
          {lesson.isBoss && <span className="boss-tag">🏆 Босс</span>}
          {cleanLesson}
        </h1>
        <div className="hero-sub">
          <p className="promise">{promiseFor(lesson)}</p>
          <div className="lesson-meta">
            <span className="meta-chip">≈ {minutes} мин</span>
            <span className="meta-chip gold">до {lesson.xp} XP</span>
          </div>
        </div>
      </header>

      <div className="seg-bar" role="tablist">
        {lesson.screens.map((s, i) => (
          <button
            key={i}
            className={'seg' + (i === idx ? ' current' : '') + (done[i] ? ' done' : '')}
            onClick={() => setIdx(i)}
            title={`Шаг ${i + 1}: ${segLabel(s)}`}
          >
            <span className="seg-ico">{done[i] ? '✓' : i + 1}</span>
            <span className="seg-text">{segLabel(s)}</span>
          </button>
        ))}
      </div>

      <div className="screen-card">
        {screen.type === 'theory' && <TheoryScreen screen={screen} />}
        {screen.type === 'quiz' && (
          <QuizScreen key={keyOf(idx)} screen={screen} done={done[idx]} onComplete={(m) => complete(idx, m)} />
        )}
        {screen.type === 'code' && (
          <CodeScreen key={keyOf(idx)} screen={screen} done={done[idx]} onComplete={(m) => complete(idx, m)} />
        )}
        {screen.type === 'bug' && (
          <BugScreen key={keyOf(idx)} screen={screen} done={done[idx]} onComplete={(m) => complete(idx, m)} />
        )}
        {screen.type === 'puzzle' && (
          <PuzzleScreen key={keyOf(idx)} screen={screen} done={done[idx]} onComplete={(m) => complete(idx, m)} />
        )}
      </div>

      <div className="sticky-nav">
        <div className="sticky-inner">
          {idx > 0 ? (
            <button className="btn" onClick={() => setIdx(idx - 1)}>← Назад</button>
          ) : prev ? (
            <Link className="btn" href={`/lesson/${prev.module}/${prev.num}`} style={btnLink}>
              ← Урок {prev.module}.{prev.num}
            </Link>
          ) : (
            <span />
          )}
          <span className="sticky-step">
            Шаг {idx + 1} из {lesson.screens.length}
            {done[idx] && <em> · выполнен ✓</em>}
            {combo >= 2 && <span className="combo-chip">⚡ точных подряд: {combo}</span>}
          </span>
          <button className="btn primary" onClick={goNext} disabled={!canNext}>
            {idx + 1 < lesson.screens.length ? 'Дальше →' : 'Завершить урок'}
          </button>
        </div>
      </div>

      {toast && <div className="xp-toast">⭐ {toast}</div>}
    </div>
  );
}

const btnLink = { display: 'inline-flex', alignItems: 'center', textDecoration: 'none' };
