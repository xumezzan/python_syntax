'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Markdown from '@/components/Markdown';
import { runPython } from '@/lib/pyrunner';
import { friendlyError, shortError } from '@/lib/pyodide';
import { getProgress } from '@/lib/progress';
import { defineThemes } from '@/lib/themes';

const Editor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

export default function BugScreen({ screen, done, onComplete }) {
  const [code, setCode] = useState(screen.starter);
  const [theme, setTheme] = useState('vs-dark');

  useEffect(() => {
    setTheme(getProgress().editorTheme || 'vs-dark');
  }, []);
  const [output, setOutput] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [ranOk, setRanOk] = useState(false);

  const run = async () => {
    setBusy(true);
    const res = await runPython(code, { stdin: ['тест', '5', '10'] });
    setOutput(res.output);
    setError(res.error);
    if (!res.error) setRanOk(true);
    setBusy(false);
  };

  return (
    <div className="code-layout">
      <div className="task-pane">
        <div className="pane-label">Охота на баг</div>
        <Markdown
          md={screen.md || 'В этом коде спрятана одна ошибка. Найди её, исправь код и запусти.'}
          enhance
        />
        {revealed && (
          <div className="hint-box" style={{ marginTop: 12 }}>
            <span className="n">Разбор:</span>
            <Markdown md={screen.reveal} />
          </div>
        )}
        {!revealed && (
          <button className="btn hint hint-inline" onClick={() => setRevealed(true)}>
            💡 Показать разбор
          </button>
        )}
      </div>

      <div className="editor-pane">
        <div className="practice-card">
          <div className="practice-head">
            <span className="dots3"><i /><i /><i /></span>
            <span className="fname">bugged.py</span>
            <span className="ph-chip bug">Исправь меня</span>
          </div>
          <Editor
            height="220px"
            language="python"
            theme={theme}
            beforeMount={defineThemes}
            value={code}
            onChange={(v) => setCode(v ?? '')}
            options={{ minimap: { enabled: false }, fontSize: 14, scrollBeyondLastLine: false, padding: { top: 12, bottom: 12 } }}
          />
          <div className="practice-foot">
            <button className="btn run" onClick={run} disabled={busy}>
              {busy ? '⏳…' : '▶ Запустить'}
            </button>
            {(ranOk || revealed) && !done && (
              <button className="btn check" onClick={() => onComplete({ firstTry: !revealed })}>
                Исправил ✓
              </button>
            )}
          </div>
        </div>

        {(output !== null || error) && (
          <div className="out-card">
            <div className="out-head">Вывод</div>
            <div className="console">
              {output}
              {error && (
                <>
                  <span className="err">{shortError(error)}</span>
                  {friendlyError(error) && <span className="friendly">{friendlyError(error)}</span>}
                </>
              )}
            </div>
          </div>
        )}
        {done && <div className="banner">🎉 Баг побеждён! Жми «Дальше»</div>}
      </div>
    </div>
  );
}
