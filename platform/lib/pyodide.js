'use client';

// Обёртка над Pyodide: однократная загрузка из CDN, запуск кода в чистом
// пространстве имён, перехват stdout/stderr и подача stdin построчно.
// Когда строки ввода кончаются, input() получает EOF — это страхует от
// бесконечных циклов чтения.

import { getProgress } from './progress';
import { skinEmoji } from './skins';

const PYODIDE_VERSION = '0.26.4';
const CDN = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;

let pyodidePromise = null;

function injectScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src;
    s.onload = resolve;
    s.onerror = () => reject(new Error('Не удалось загрузить Pyodide'));
    document.head.appendChild(s);
  });
}

export function getPyodide() {
  if (!pyodidePromise) {
    pyodidePromise = (async () => {
      if (!window.loadPyodide) await injectScript(CDN + 'pyodide.js');
      return window.loadPyodide({ indexURL: CDN });
    })();
  }
  return pyodidePromise;
}

/**
 * Запускает код. stdin — массив строк, files — [{name, content}].
 * Возвращает { output, error }.
 */
export async function runPython(code, { stdin = [], files = [] } = {}) {
  const py = await getPyodide();
  let out = '';
  const lines = [...stdin];

  py.setStdout({ batched: (s) => { out += s + '\n'; } });
  py.setStderr({ batched: (s) => { out += s + '\n'; } });
  py.setStdin({ stdin: () => (lines.length ? lines.shift() + '\n' : null) });

  for (const f of files) {
    try { py.FS.unlink(f.name); } catch { /* файла не было */ }
    py.FS.writeFile(f.name, f.content);
  }

  const ns = py.globals.get('dict')();
  try {
    await py.runPythonAsync(code, { globals: ns });
    return { output: out, error: null };
  } catch (e) {
    return { output: out, error: String(e.message || e) };
  } finally {
    ns.destroy();
  }
}

/**
 * Интерактивный запуск («режим игры»): каждый input() показывает диалог
 * prompt с последними строками вывода программы — так игрок видит реакцию
 * («Больше!», «Меньше!») прямо в диалоге. Отмена ввода = мягкая остановка.
 * Возвращает { output, error, stopped }.
 */
export async function runPythonInteractive(code, { files = [] } = {}) {
  const py = await getPyodide();
  let out = '';
  let stopped = false;

  py.setStdout({ batched: (s) => { out += s + '\n'; } });
  py.setStderr({ batched: (s) => { out += s + '\n'; } });
  py.setStdin({
    stdin: () => {
      const recent = out.split('\n').filter(Boolean).slice(-8).join('\n');
      const v = window.prompt(
        (recent ? recent + '\n\n' : '') + '⌨️ Введи строку (Отмена — остановить):'
      );
      if (v === null) {
        stopped = true;
        return null;
      }
      out += '› ' + v + '\n';
      return v + '\n';
    },
  });

  for (const f of files) {
    try { py.FS.unlink(f.name); } catch { /* файла не было */ }
    py.FS.writeFile(f.name, f.content);
  }

  const ns = py.globals.get('dict')();
  try {
    await py.runPythonAsync(code, { globals: ns });
    return { output: out, error: null, stopped };
  } catch (e) {
    const msg = String(e.message || e);
    if (stopped || /EOFError/.test(msg)) return { output: out, error: null, stopped: true };
    return { output: out, error: msg, stopped: false };
  } finally {
    ns.destroy();
  }
}

/** Переводит типовые ошибки Python на дружелюбный русский. */
export function friendlyError(error) {
  if (!error) return null;
  const rules = [
    [/unterminated string literal/, 'Похоже, не закрыта кавычка — какой открыл, такой и закрывай.'],
    [/was never closed/, 'Где-то не закрыта скобка. Python заметил это строкой ниже.'],
    [/expected ':'/, 'Кажется, забыл двоеточие в конце строки с if/else/for/while/def.'],
    [/IndentationError/, 'Python очень любит отступы: блок после двоеточия сдвигается на 4 пробела.'],
    [/NameError: name '(\w+)'.*Did you mean: '(\w+)'/s, 'Опечатка в имени? Python даже предлагает замену — посмотри на последнюю строку ошибки.'],
    [/NameError/, 'Такого имени Python не знает: опечатка или забытые кавычки вокруг текста.'],
    [/unsupported operand type.*int.*str|can only concatenate str/s, 'Смешались число и строка. Преврати одно в другое: int(...) или str(...).'],
    [/invalid literal for int/, 'int() получил не число. Проверь, что превращаешь в число именно цифры.'],
    [/ZeroDivisionError/, 'Деление на ноль — даже Python так не умеет.'],
    [/IndexError/, 'Индекс за пределами: не забывай, отсчёт идёт с нуля.'],
    [/KeyError/, 'Такого ключа в словаре нет. Спасает .get() или проверка in.'],
    [/EOFError|OSError: \[Errno 29\]/, 'Программа попросила input(), а строки ввода закончились — добавь их в поле «Ввод».'],
    [/TimeoutError/, 'Похоже, бесконечный цикл: проверь, меняется ли переменная условия. Я остановил программу — вкладка цела.'],
  ];
  for (const [re, msg] of rules) {
    if (re.test(error)) return `${skinEmoji(getProgress())} Пай: ` + msg;
  }
  return null;
}

/** Последняя содержательная часть трейсбека — для компактного вывода. */
export function shortError(error) {
  if (!error) return null;
  const lines = error.trim().split('\n').filter(Boolean);
  const tail = lines.slice(-3).filter((l) => !l.startsWith('  File "<exec>"'));
  return tail.join('\n');
}
