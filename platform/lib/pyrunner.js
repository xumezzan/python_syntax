'use client';

// Запуск Python в Web Worker с таймаутом: вечный цикл убивает воркер,
// а не вкладку. Интерактивный режим («Играть») остаётся в lib/pyodide.js —
// диалоги prompt из воркера невозможны.

const TIMEOUT_MS = 10000;

let inst = null;

function ensure() {
  if (inst) return inst;
  const worker = new Worker('/py-worker.js');
  let readyResolve;
  const ready = new Promise((r) => { readyResolve = r; });
  const pending = new Map();
  worker.onmessage = (e) => {
    if (e.data.ready) { readyResolve(); return; }
    const cb = pending.get(e.data.id);
    if (cb) { pending.delete(e.data.id); cb(e.data); }
  };
  inst = { worker, ready, pending, seq: 0 };
  return inst;
}

/** Прогрев: грузит Pyodide в воркере заранее. */
export function warm() {
  return ensure().ready;
}

/** Запуск кода: stdin построчно, files в виртуальную ФС. */
export async function runPython(code, { stdin = [], files = [], timeout = TIMEOUT_MS } = {}) {
  const w = ensure();
  await w.ready;
  const id = ++w.seq;
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      w.pending.delete(id);
      w.worker.terminate();
      inst = null; // следующий запуск поднимет свежий воркер
      resolve({
        output: '',
        error: `TimeoutError: программа работала дольше ${Math.round(timeout / 1000)} секунд и была остановлена`,
      });
    }, timeout);
    w.pending.set(id, (data) => {
      clearTimeout(timer);
      resolve({ output: data.output, error: data.error });
    });
    w.worker.postMessage({ id, code, stdin, files });
  });
}
