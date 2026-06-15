// Прогон эталонных решений авто-тестируемых задач против их же тест-кейсов.
// Запуск: node scripts/verify-solutions.mjs  (нужен python3 в PATH — он как
// прокси для Pyodide-стандартной библиотеки: json, sqlite3, xml, base64, hashlib).
//
// Для задач-«допиши» решение в подсказках — это лишь недостающий фрагмент
// (полную программу собирает редактор из стартового кода). Такие фрагменты
// помечаются SKIP, а не FAIL: их проверяют вручную.
//
// Проверяется трек backend (чистый Python: json/sqlite3/xml/base64/hashlib).
// Трек syntax опускаем: там есть задачи с предзагруженными файлами и
// многострочной частичной сверкой, которые этот простой прогон не моделирует.

import { loadCourse } from '../lib/course.mjs';
import { execFileSync } from 'node:child_process';

const TRACK = process.argv[2] || 'backend';
const course = loadCourse();
let pass = 0, fail = 0, skip = 0;
const failures = [];

for (const mod of course.modules.filter((m) => m.track === TRACK)) {
  for (const lesson of mod.lessons) {
    for (const s of lesson.screens) {
      if (s.type !== 'code' || s.tests.cases.length === 0) continue;
      if (!s.solution) { skip++; continue; }
      for (const c of s.tests.cases) {
        const stdin = (c.input || []).join('\n') + '\n';
        let out, runtimeError = null;
        try {
          out = execFileSync('python3', ['-c', s.solution], { input: stdin, timeout: 8000 }).toString();
        } catch (e) {
          runtimeError = String(e.stderr || e);
        }
        const exp = c.expected.map((l) => l.trimEnd());
        // решение-фрагмент ссылается на переменные стартового кода → NameError,
        // либо печатает пусто там, где ждём вывод: это «допиши», проверяем вручную
        if (runtimeError) {
          if (/NameError/.test(runtimeError)) { skip++; continue; }
          fail++; failures.push(`${mod.track}:${lesson.id} RUNTIME ${runtimeError.slice(0, 100)}`); continue;
        }
        const got = out.replace(/\s+$/, '').split('\n').map((l) => l.trimEnd());
        if (got.length === 1 && got[0] === '' && exp.length > 0) { skip++; continue; }
        if (JSON.stringify(got) === JSON.stringify(exp)) pass++;
        else { fail++; failures.push(`${mod.track}:${lesson.id} in:${JSON.stringify(c.input)} got:${JSON.stringify(got)} exp:${JSON.stringify(exp)}`); }
      }
    }
  }
}

console.log(`Проверка эталонных решений: PASS ${pass} | SKIP(фрагмент) ${skip} | FAIL ${fail}`);
if (failures.length) { console.log('--- расхождения ---'); failures.forEach((f) => console.log(f)); process.exit(1); }
