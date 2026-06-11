'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { runPython, warm } from '@/lib/pyrunner';
import { awardScreen, addBadge, setGoal, setOnboarded } from '@/lib/progress';
import Confetti from '@/components/rewards/Confetti';

const MOTIVES = [
  { id: 'self', label: 'Для себя', sub: 'интересно, как это работает' },
  { id: 'work', label: 'Для работы', sub: 'автоматизировать рутину' },
  { id: 'dev', label: 'Стать разработчиком', sub: 'новая профессия' },
  { id: 'study', label: 'Для учёбы', sub: 'школа или вуз' },
];

const RHYTHMS = [
  { id: 15, label: '5 минут в день', sub: 'лёгкий темп · цель 15 XP' },
  { id: 30, label: '15 минут в день', sub: 'уверенный темп · цель 30 XP' },
  { id: 60, label: '30 минут в день', sub: 'жара · цель 60 XP' },
];

export default function Onboarding() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [output, setOutput] = useState(null);
  const [running, setRunning] = useState(false);
  const [won, setWon] = useState(false);
  const [pyReady, setPyReady] = useState(false);
  const inputRef = useRef(null);

  // Python греется в фоне (в воркере), пока человек отвечает на вопросы
  useEffect(() => {
    warm().then(() => setPyReady(true)).catch(() => {});
  }, []);

  useEffect(() => {
    if (step === 3) inputRef.current?.focus();
  }, [step]);

  const skip = () => {
    setOnboarded();
    router.push('/');
  };

  const runFirst = async () => {
    const who = (name.trim() || 'мир').replace(/"/g, '\\"').replace(/\n/g, ' ');
    setRunning(true);
    const res = await runPython(`print("Привет, ${who}!")`);
    setOutput(res.output);
    setRunning(false);
    if (!res.error && !won) {
      setWon(true);
      addBadge('hello-world');
      awardScreen('s:onboarding', 10, { firstTry: true });
    }
  };

  const finish = () => {
    setOnboarded();
    router.push('/');
  };

  return (
    <div className="onb">
      {won && <Confetti />}

      <div className="onb-progress">
        {/* полоска начинается с 1/5 — первый шаг дарим */}
        {[0, 1, 2, 3, 4].map((i) => (
          <i key={i} className={i <= step ? 'on' : ''} />
        ))}
      </div>

      {step === 0 && (
        <section className="onb-step">
          <h1>Научим писать на Python.<br />Без страха. По 5 минут в день.</h1>
          <p className="onb-lead">
            Короткая теория, код прямо в браузере и наставник, который объясняет
            ошибки по-человечески. Первая программа — уже через минуту.
          </p>
          <button className="btn primary onb-cta" onClick={() => setStep(1)}>
            Попробовать прямо сейчас
          </button>
          <button className="onb-skip" onClick={skip}>Пропустить — сразу к курсу</button>
        </section>
      )}

      {step === 1 && (
        <section className="onb-step">
          <h2>Зачем тебе Python?</h2>
          <p className="onb-lead">Подстроим путь под твою цель.</p>
          <div className="onb-options">
            {MOTIVES.map((m) => (
              <button key={m.id} className="onb-opt" onClick={() => { setOnboardedMotive(m.id); setStep(2); }}>
                <b>{m.label}</b>
                <span>{m.sub}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {step === 2 && (
        <section className="onb-step">
          <h2>Сколько времени готов уделять?</h2>
          <p className="onb-lead">Сегодня достаточно даже 5 минут.</p>
          <div className="onb-options">
            {RHYTHMS.map((r) => (
              <button key={r.id} className="onb-opt" onClick={() => { setGoal(r.id); setStep(3); }}>
                <b>{r.label}</b>
                <span>{r.sub}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {step === 3 && (
        <section className="onb-step">
          {!won ? (
            <>
              <h2>Твоя первая программа</h2>
              <p className="onb-lead">Впиши своё имя и нажми «Запустить». Это настоящий Python.</p>
            </>
          ) : (
            <>
              <h2>Ты только что написал свою первую программу 🎉</h2>
              <p className="onb-lead">Серьёзно — это уже код. Бейдж «Hello, World!» твой. +10 XP</p>
            </>
          )}

          <div className="onb-terminal">
            <div className="practice-head">
              <span className="dots3"><i /><i /><i /></span>
              <span className="fname">first.py</span>
              <span className="ph-chip">Твой код</span>
            </div>
            <div className="onb-codeline">
              <span className="kw">print</span>(<span className="str">"Привет, </span>
              <input
                ref={inputRef}
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && pyReady && !running && runFirst()}
                placeholder="твоё имя"
                maxLength={30}
                className="onb-name"
              />
              <span className="str">!"</span>)
            </div>
            <div className="practice-foot">
              <button className="btn run" onClick={runFirst} disabled={!pyReady || running}>
                {!pyReady ? '⏳ Готовлю Python…' : running ? '⏳ Выполняю…' : '▶ Запустить'}
              </button>
              {won && (
                <button className="btn primary" onClick={finish}>К карте курса →</button>
              )}
            </div>
          </div>

          {output !== null && (
            <div className="out-card onb-out">
              <div className="out-head">Вывод</div>
              <div className="console">{output}</div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

// сохраняем мотив сразу, онбординг завершаем на финише
function setOnboardedMotive(motive) {
  try {
    const KEY = 'pysyntax-v1';
    const p = JSON.parse(localStorage.getItem(KEY) || '{}');
    p.motive = motive;
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch { /* не критично */ }
}
