'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getProgress, awardScreen, todayStr } from '@/lib/progress';
import { cleanTitle } from '@/lib/ui';
import QuizScreen from '@/components/screens/QuizScreen';
import CountUp from '@/components/rewards/CountUp';

const COUNT = 3;
const XP_PER_QUIZ = 5;

export default function WarmupPage({ quizzes }) {
  const [picked, setPicked] = useState(null);
  const [step, setStep] = useState(0);
  const [solvedCurrent, setSolvedCurrent] = useState(false);
  const [earned, setEarned] = useState(0);

  // подборка — один раз на визит, только из пройденных уроков
  useEffect(() => {
    const p = getProgress();
    const pool = quizzes.filter((q) => p.lessons[q.lessonId]);
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    setPicked(shuffled.slice(0, COUNT));
  }, [quizzes]);

  if (!picked) return <div className="chapter" />;

  if (picked.length < COUNT) {
    return (
      <div className="chapter warmup">
        <div className="screen-card finish-card">
          <div className="big">🔄</div>
          <h2>Разминка ещё закрыта</h2>
          <p>Она собирается из квизов пройденных уроков. Пройди пару уроков — и возвращайся повторять.</p>
          <div className="finish-actions">
            <Link className="btn primary" href="/">К карте курса</Link>
          </div>
        </div>
      </div>
    );
  }

  const finished = step >= picked.length;

  const handleComplete = (meta) => {
    if (solvedCurrent) return;
    setSolvedCurrent(true);
    // повтор в тот же день XP не дублирует — id фиксирован датой и шагом
    const res = awardScreen(`s:warmup:${todayStr()}:${step}`, XP_PER_QUIZ, {
      firstTry: Boolean(meta?.firstTry),
      type: 'quiz',
    });
    if (res.fresh) setEarned((e) => e + res.gained);
  };

  if (finished) {
    return (
      <div className="chapter warmup">
        <div className="screen-card finish-card">
          <div className="big">💪</div>
          <h2>Разминка завершена!</h2>
          <p className="finish-sub">
            {earned > 0
              ? 'Повторение — половина мастерства. Старые темы не заржавеют.'
              : 'Сегодня ты уже разминался — XP за повтор не начисляется, но память скажет спасибо.'}
          </p>
          {earned > 0 && (
            <div className="finish-stats" style={{ maxWidth: 220 }}>
              <div className="fstat">
                <span className="fstat-num gold"><CountUp to={earned} prefix="+" suffix=" XP" /></span>
                <span className="fstat-label">за повторение</span>
              </div>
            </div>
          )}
          <div className="finish-actions">
            <Link className="btn" href="/">К карте</Link>
            <button className="btn primary" onClick={() => window.location.reload()}>
              Ещё разок
            </button>
          </div>
        </div>
      </div>
    );
  }

  const quiz = picked[step];

  return (
    <div className="chapter warmup">
      <nav className="crumbs2">
        <Link href="/">Карта</Link>
        <span className="sep">/</span>
        <span className="here">Разминка</span>
      </nav>

      <header className="lesson-hero">
        <h1>🔄 Разминка</h1>
        <div className="hero-sub">
          <p className="promise">Быстрый повтор пройденного: {COUNT} вопроса · +{XP_PER_QUIZ} XP за каждый.</p>
          <div className="lesson-meta">
            <span className="meta-chip">вопрос {step + 1} из {picked.length}</span>
          </div>
        </div>
      </header>

      <div className="seg-bar">
        {picked.map((_, i) => (
          <span key={i} className={'seg' + (i === step ? ' current' : '') + (i < step ? ' done' : '')}>
            <span className="seg-ico">{i < step ? '✓' : i + 1}</span>
            <span className="seg-text">Вопрос {i + 1}</span>
          </span>
        ))}
      </div>

      <div className="screen-card">
        <span className="quiz-explain" style={{ display: 'block', marginBottom: 10 }}>
          Из урока {quiz.lessonId} · {cleanTitle(quiz.lessonTitle, 40)}
        </span>
        <QuizScreen key={step} screen={quiz} done={false} onComplete={handleComplete} />
        {solvedCurrent && (
          <div className="toolbar" style={{ marginTop: 16 }}>
            <button
              className="btn primary"
              onClick={() => { setStep(step + 1); setSolvedCurrent(false); window.scrollTo({ top: 0 }); }}
            >
              {step + 1 < picked.length ? 'Следующий вопрос →' : 'Завершить разминку'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
