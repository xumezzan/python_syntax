'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Markdown from '@/components/Markdown';
import { runPython } from '@/lib/pyrunner';
import { runPythonInteractive, friendlyError, shortError } from '@/lib/pyodide';
import { getProgress, spendXp } from '@/lib/progress';
import { defineThemes } from '@/lib/themes';

const Editor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => <div className="loading-pyodide" style={{ padding: 16 }}>Загружаю редактор…</div>,
});

const EDITOR_OPTS = {
  minimap: { enabled: false },
  fontSize: 14,
  scrollBeyondLastLine: false,
  lineNumbersMinChars: 3,
  padding: { top: 12, bottom: 12 },
  tabSize: 4,
  insertSpaces: true,
};

function normalize(text) {
  const lines = String(text).split('\n').map((l) => l.replace(/\s+$/, ''));
  while (lines.length && lines[lines.length - 1] === '') lines.pop();
  return lines;
}

export default function CodeScreen({ screen, done, onComplete }) {
  const [code, setCode] = useState(screen.starter || '');
  const [output, setOutput] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState(null);
  const [hintLevel, setHintLevel] = useState(0);
  const [ranOk, setRanOk] = useState(false);
  const [stdinText, setStdinText] = useState('');
  const [playNote, setPlayNote] = useState(null);
  const [attempts, setAttempts] = useState(0);
  const [theme, setTheme] = useState('vs-dark');

  useEffect(() => {
    setTheme(getProgress().editorTheme || 'vs-dark');
  }, []);

  const takeHint = () => {
    const next = hintLevel + 1;
    if (next === 2) spendXp(5);
    if (next === 3) spendXp(15);
    setHintLevel(next);
  };

  const hasTests = screen.tests.cases.length > 0;
  const needsInput = code.includes('input(') || screen.tests.cases.some((c) => c.input.length);

  const run = async () => {
    setBusy(true);
    setResults(null);
    const stdin = stdinText.length ? stdinText.split('\n') : [];
    const res = await runPython(code, { stdin, files: screen.files });
    setOutput(res.output);
    setError(res.error);
    if (!res.error) setRanOk(true);
    setBusy(false);
  };

  const play = async () => {
    setBusy(true);
    setResults(null);
    setPlayNote(null);
    let src = code;
    let note = null;
    // в «Угадай число» тестовый секрет подменяем настоящим random —
    // ровно как обещано в условии босса
    if (/secret = int\(input\(\)\)/.test(src)) {
      src =
        'import random\n' +
        src.replace(/secret = int\(input\(\)\)/, 'secret = random.randint(1, 100)');
      note = '🎲 Строка `secret = int(input())` заменена на `random.randint(1, 100)` — играем по-настоящему!';
    }
    const res = await runPythonInteractive(src, { files: screen.files });
    setOutput(res.output + (res.stopped ? '⏹ Остановлено игроком\n' : ''));
    setError(res.error);
    setPlayNote(note);
    setBusy(false);
  };

  const check = async () => {
    setBusy(true);
    setOutput(null);
    setError(null);
    const attempt = attempts + 1;
    setAttempts(attempt);
    const out = [];
    for (const t of screen.tests.cases) {
      const res = await runPython(code, { stdin: [...t.input], files: screen.files });
      const got = normalize(res.output);
      const want = normalize(t.expected.join('\n'));
      const pass = !res.error && got.length === want.length && got.every((l, i) => l === want[i]);
      out.push({ ...t, got: res.output, error: res.error, pass });
    }
    setResults(out);
    setBusy(false);
    if (out.every((r) => r.pass)) {
      onComplete({ firstTry: attempt === 1 && hintLevel === 0 });
    }
  };

  return (
    <div className="code-layout">
      {/* ---------- задание ---------- */}
      <div className="task-pane">
        <div className="pane-label">Задание</div>
        <Markdown md={screen.md} enhance />

        {hintLevel > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 14 }}>
            {screen.hints.slice(0, hintLevel).map((h, i) => (
              <div className="hint-box" key={i}>
                <span className="n">Подсказка {i + 1}:</span>
                <Markdown md={h} />
              </div>
            ))}
          </div>
        )}

        {screen.hints.length > 0 && hintLevel < screen.hints.length && (
          <button className="btn hint hint-inline" onClick={takeHint}>
            💡 Подсказка {hintLevel + 1} из {screen.hints.length}
            {hintLevel === 1 ? ' · −5 XP' : hintLevel === 2 ? ' · −15 XP' : ' · бесплатно'}
          </button>
        )}
      </div>

      {/* ---------- практика ---------- */}
      <div className="editor-pane">
        <div className="practice-card">
          <div className="practice-head">
            <span className="dots3"><i /><i /><i /></span>
            <span className="fname">main.py</span>
            <span className="ph-chip">Попробуй сам</span>
          </div>
          <Editor
            height="300px"
            language="python"
            theme={theme}
            beforeMount={defineThemes}
            value={code}
            onChange={(v) => setCode(v ?? '')}
            options={EDITOR_OPTS}
          />
          <div className="practice-foot">
            <button className="btn run" onClick={run} disabled={busy}>
              {busy ? '⏳ Выполняю…' : '▶ Запустить'}
            </button>
            {hasTests && (
              <button className="btn check" onClick={check} disabled={busy}>
                ✓ Проверить
              </button>
            )}
            {screen.kind === 'boss' && (
              <button className="btn play" onClick={play} disabled={busy} title="Интерактивный запуск: input() спрашивает тебя">
                🎮 Играть
              </button>
            )}
            {!hasTests && ranOk && !done && (
              <button className="btn check" onClick={() => onComplete({ firstTry: hintLevel === 0 })}>
                Засчитать ✓
              </button>
            )}
          </div>
        </div>

        {needsInput && (
          <div className="stdin-box">
            <details>
              <summary>⌨️ Ввод для запуска (каждая строка — один input)</summary>
              <textarea
                value={stdinText}
                onChange={(e) => setStdinText(e.target.value)}
                placeholder={'например:\nАня\n2012'}
                spellCheck={false}
              />
            </details>
          </div>
        )}

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
              {!output && !error && <span style={{ color: 'var(--muted)' }}>(нет вывода)</span>}
            </div>
          </div>
        )}

        {results && (
          <div className="tests">
            <div className="out-head">
              Проверка · {results.filter((r) => r.pass).length} из {results.length}
            </div>
            {results.map((r, i) => (
              <div className={'test-row ' + (r.pass ? 'pass' : 'fail')} key={i}>
                <div className="t-head">
                  {r.pass ? '✓' : '✕'} Тест {i + 1}
                  {r.input.length > 0 && (
                    <span className="dim"> · ввод: {r.input.join(' ⏎ ') || '—'}</span>
                  )}
                </div>
                {!r.pass && (
                  <div>
                    <div className="dim">Ожидалось: {r.expected.join(' ⏎ ')}</div>
                    <div>
                      Получено: {r.error ? <span style={{ color: 'var(--red)' }}>ошибка — {shortError(r.error)}</span> : normalize(r.got).join(' ⏎ ') || '(пусто)'}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {playNote && (
          <div className="quiz-explain"><Markdown md={playNote} inline /></div>
        )}

        {!hasTests && screen.tests.note && (
          <div className="quiz-explain">Проверка: {screen.tests.note}</div>
        )}

        {done && <div className="banner">🎉 Отлично, всё работает! Жми «Дальше»</div>}
      </div>
    </div>
  );
}
