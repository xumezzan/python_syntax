'use client';

import { useState } from 'react';
import Markdown from '@/components/Markdown';

export default function QuizScreen({ screen, done, onComplete }) {
  const [picked, setPicked] = useState(null);
  const [solved, setSolved] = useState(done);
  const [missed, setMissed] = useState(false);

  const pick = (i) => {
    if (solved) return;
    setPicked(i);
    if (screen.options[i].correct) {
      setSolved(true);
      onComplete({ firstTry: !missed });
    } else {
      setMissed(true);
    }
  };

  return (
    <div style={{ maxWidth: 760 }}>
      <Markdown md={screen.question} />
      <div className="quiz-options">
        {screen.options.map((o, i) => {
          let cls = 'quiz-opt';
          if (solved && o.correct) cls += ' right';
          else if (picked === i && !o.correct) cls += ' wrong';
          return (
            <div key={i}>
              <button className={cls} onClick={() => pick(i)} disabled={solved}>
                <Markdown md={o.label} inline />
              </button>
              {((picked === i && !o.correct) || (solved && o.correct && o.explain)) && (
                <div className="quiz-explain">
                  {o.correct ? '✅ ' : '❌ '}
                  <Markdown md={o.explain || 'Верно!'} inline />
                </div>
              )}
            </div>
          );
        })}
      </div>
      {solved && (
        <>
          <div className="banner">✅ Правильно!</div>
          {screen.after && (
            <div style={{ marginTop: 10 }}>
              <Markdown md={screen.after} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
