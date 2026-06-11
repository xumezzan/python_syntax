'use client';

import { useState } from 'react';
import Markdown from '@/components/Markdown';

export default function PuzzleScreen({ screen, done, onComplete }) {
  const [pool, setPool] = useState(screen.items);
  const [answer, setAnswer] = useState([]);
  const [status, setStatus] = useState(null);
  const [missed, setMissed] = useState(false);

  const take = (i) => {
    setAnswer([...answer, pool[i]]);
    setPool(pool.filter((_, j) => j !== i));
    setStatus(null);
  };
  const giveBack = (i) => {
    setPool([...pool, answer[i]]);
    setAnswer(answer.filter((_, j) => j !== i));
    setStatus(null);
  };
  const check = () => {
    const ok =
      answer.length === screen.order.length &&
      answer.every((l, i) => l.trim() === screen.order[i].trim());
    setStatus(ok);
    if (ok) onComplete({ firstTry: !missed });
    else setMissed(true);
  };
  const reset = () => {
    setPool(screen.items);
    setAnswer([]);
    setStatus(null);
  };

  return (
    <div style={{ maxWidth: 760 }}>
      <Markdown md={screen.md} />
      <div className="puzzle-zone">
        <h4>Перемешанные строки — кликай в нужном порядке</h4>
        <div className="puzzle-list">
          {pool.map((line, i) => (
            <button className="puzzle-line" key={i} onClick={() => take(i)}>{line}</button>
          ))}
          {pool.length === 0 && <span className="quiz-explain">пусто</span>}
        </div>
        <h4>Твоя программа</h4>
        <div className="puzzle-list">
          {answer.map((line, i) => (
            <button className="puzzle-line" key={i} onClick={() => giveBack(i)} title="Вернуть назад">
              {line}
            </button>
          ))}
          {answer.length === 0 && <span className="quiz-explain">кликни строки сверху</span>}
        </div>
      </div>
      <div className="toolbar" style={{ marginTop: 14 }}>
        <button className="btn check" onClick={check} disabled={answer.length === 0}>✓ Проверить</button>
        <button className="btn" onClick={reset}>↺ Сбросить</button>
      </div>
      {status === true && <div className="banner">✅ Программа собрана правильно!</div>}
      {status === false && (
        <div className="hint-box" style={{ marginTop: 12 }}>
          <span className="n">Пока не так.</span> Вспомни: программа выполняется сверху вниз, а отступы — часть строки.
        </div>
      )}
      {done && status !== true && <div className="banner">✅ Уже решено</div>}
    </div>
  );
}
