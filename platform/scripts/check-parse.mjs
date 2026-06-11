import { loadCourse } from '../lib/course.mjs';

const course = loadCourse();
let totals = { lessons: 0, theory: 0, code: 0, quiz: 0, bug: 0, puzzle: 0, tests: 0, free: 0 };

for (const m of course.modules) {
  const counts = { theory: 0, code: 0, quiz: 0, bug: 0, puzzle: 0 };
  let tests = 0;
  let free = [];
  for (const l of m.lessons) {
    totals.lessons++;
    for (const s of l.screens) {
      counts[s.type]++;
      totals[s.type]++;
      if (s.type === 'code') {
        tests += s.tests.cases.length;
        if (s.tests.cases.length === 0) free.push(l.id);
      }
    }
  }
  totals.tests += tests;
  totals.free += free.length;
  console.log(
    `Модуль ${m.id} «${m.title}»: уроков ${m.lessons.length}, ` +
      `теория ${counts.theory}, код ${counts.code}, квиз ${counts.quiz}, ` +
      `баг ${counts.bug}, пазл ${counts.puzzle}, тест-кейсов ${tests}` +
      (free.length ? `, код без автотестов (свободная проверка): ${free.join(', ')}` : '')
  );
}
console.log('\nИтого:', JSON.stringify(totals));

// выборочная проверка глубины парсинга
const l11 = course.modules[0].lessons[0];
console.log('\nУрок 1.1 экраны:', l11.screens.map((s) => s.type + (s.kind ? ':' + s.kind : '')).join(', '));
const fill = l11.screens.find((s) => s.kind === 'fill');
console.log('Стартовый код:', JSON.stringify(fill.starter));
console.log('Подсказки:', fill.hints.length, '| решение:', JSON.stringify(fill.solution));
console.log('Тесты:', JSON.stringify(fill.tests.cases));
const boss9 = course.modules[8].lessons.find((l) => l.isBoss);
const bossScreen = boss9.screens.find((s) => s.type === 'code');
console.log('\nБосс 9 тест-кейсы:', JSON.stringify(bossScreen.tests.cases[1]?.input));
const m10files = course.modules[9].lessons.flatMap((l) => l.screens).flatMap((s) => s.files || []);
console.log('Файлы модуля 10:', m10files.map((f) => f.name).join(', '));
