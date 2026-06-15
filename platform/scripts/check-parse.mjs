import { loadCourse, TRACKS } from '../lib/course.mjs';

const course = loadCourse();
let grand = { lessons: 0, theory: 0, code: 0, quiz: 0, bug: 0, puzzle: 0, tests: 0, free: 0 };

for (const track of TRACKS) {
  const mods = course.modules.filter((m) => m.track === track.slug);
  if (!mods.length) continue;
  console.log(`\n=== Трек «${track.title}» (${track.slug}) — ${mods.length} модулей ===`);
  const trackTotals = { lessons: 0, theory: 0, code: 0, quiz: 0, bug: 0, puzzle: 0, tests: 0 };
  const issues = [];

  for (const m of mods) {
    const counts = { theory: 0, code: 0, quiz: 0, bug: 0, puzzle: 0 };
    let tests = 0;
    const free = [];
    for (const l of m.lessons) {
      trackTotals.lessons++;
      grand.lessons++;
      for (const s of l.screens) {
        counts[s.type]++;
        trackTotals[s.type]++;
        grand[s.type]++;
        if (s.type === 'code') {
          tests += s.tests.cases.length;
          if (s.tests.cases.length === 0) free.push(l.id);
        }
      }
    }
    trackTotals.tests += tests;
    grand.tests += tests;

    // проверка минимумов (для треков-курсов): ≥3 урока, ≥2 практики, ≥3 квиза
    const practical = counts.code + counts.bug + counts.puzzle;
    if (m.lessons.length < 3) issues.push(`${track.slug} M${m.trackNum}: уроков <3`);
    if (practical < 2) issues.push(`${track.slug} M${m.trackNum}: практических заданий <2`);
    if (counts.quiz < 3) issues.push(`${track.slug} M${m.trackNum}: квизов <3 (${counts.quiz})`);

    console.log(
      `М${m.trackNum} «${m.title}»: уроков ${m.lessons.length}, ` +
        `теория ${counts.theory}, код ${counts.code}, квиз ${counts.quiz}, ` +
        `баг ${counts.bug}, пазл ${counts.puzzle}, тест-кейсов ${tests}` +
        (free.length ? `, код без автотестов: ${free.join(', ')}` : '')
    );
  }
  console.log(`Итого по треку:`, JSON.stringify(trackTotals));
  if (issues.length) {
    console.log('⚠ Нарушения минимумов:');
    issues.forEach((i) => console.log('  - ' + i));
  } else {
    console.log('✓ Все модули трека проходят минимумы (≥3 урока, ≥2 практики, ≥3 квиза)');
  }
}

console.log('\n=== Всего по платформе:', JSON.stringify(grand), '===');

// выборочная проверка глубины парсинга синтаксис-курса
const syntax = course.modules.filter((m) => m.track === 'syntax');
if (syntax.length) {
  const l11 = syntax[0].lessons[0];
  console.log('\nУрок 1.1 экраны:', l11.screens.map((s) => s.type + (s.kind ? ':' + s.kind : '')).join(', '));
  const fill = l11.screens.find((s) => s.kind === 'fill');
  if (fill) console.log('Тесты урока 1.1:', JSON.stringify(fill.tests.cases));
}
