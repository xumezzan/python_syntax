import fs from 'node:fs';
import path from 'node:path';

// Парсер контента курса: читает content/module-XX.md и превращает их в
// структуру { modules: [ { lessons: [ { screens: [...] } ] } ] }.
// Экраны, которые не удаётся разобрать (например, квизы с вариантами-кодом),
// деградируют до типа "theory" — они остаются читабельными в плеере.

const XP = { fill: 10, task: 15, quiz: 10, bug: 10, puzzle: 10, boss: 50, theory: 0 };

export function loadCourse() {
  const dir = findContentDir();
  const files = fs
    .readdirSync(dir)
    .filter((f) => /^module-\d+\.md$/.test(f))
    .sort();
  const modules = files.map((f, i) =>
    parseModule(fs.readFileSync(path.join(dir, f), 'utf8'), i + 1)
  );
  return { modules };
}

export function getLesson(course, moduleId, lessonNum) {
  const mod = course.modules.find((m) => m.id === Number(moduleId));
  if (!mod) return null;
  const idx = mod.lessons.findIndex((l) => l.num === Number(lessonNum));
  if (idx === -1) return null;
  const lesson = mod.lessons[idx];
  const prev = idx > 0 ? mod.lessons[idx - 1] : lastLessonOf(course, mod.id - 1);
  const next =
    idx < mod.lessons.length - 1
      ? mod.lessons[idx + 1]
      : firstLessonOf(course, mod.id + 1);
  const brief = (l) =>
    l ? { module: l.module, num: l.num, title: l.title, screens: l.screens.length } : null;
  return {
    lesson,
    moduleTitle: mod.title,
    prev: brief(prev),
    next: brief(next),
    moduleLessonIds: mod.lessons.map((l) => l.id),
  };
}

/** Данные модуля для страницы главы (без содержимого экранов). */
export function getModule(course, moduleId) {
  const mod = course.modules.find((m) => m.id === Number(moduleId));
  if (!mod) return null;
  return {
    id: mod.id,
    title: mod.title,
    goal: mod.goal,
    boss: mod.boss,
    lessons: mod.lessons.map((l) => ({
      module: l.module,
      num: l.num,
      id: l.id,
      title: l.title,
      isBoss: l.isBoss,
      xp: l.xp,
      screens: l.screens.length,
    })),
  };
}

function lastLessonOf(course, moduleId) {
  const m = course.modules.find((x) => x.id === moduleId);
  return m ? m.lessons[m.lessons.length - 1] : null;
}
function firstLessonOf(course, moduleId) {
  const m = course.modules.find((x) => x.id === moduleId);
  return m ? m.lessons[0] : null;
}

function findContentDir() {
  const candidates = [
    path.join(process.cwd(), '..', 'content'),
    path.join(process.cwd(), 'content'),
  ];
  for (const p of candidates) if (fs.existsSync(p)) return p;
  throw new Error('Папка content/ с модулями курса не найдена');
}

function parseModule(text, id) {
  const title = (text.match(/^# Модуль \d+ — (.+)$/m) || [])[1]?.trim() || `Модуль ${id}`;
  const goal = (text.match(/\*\*Цель:\*\* (.+)/) || [])[1] || '';
  const boss = (text.match(/\*\*Босс:\*\* (.+)/) || [])[1] || '';
  const lessons = text
    .split(/^### /m)
    .slice(1)
    .map((ch) => parseLesson(ch, id))
    .filter(Boolean);
  return { id, title, goal, boss, lessons };
}

function parseLesson(chunk, moduleId) {
  const nl = chunk.indexOf('\n');
  const header = chunk.slice(0, nl).trim();
  const m = header.match(/^Урок (\d+)\.(\d+)\s*—\s*(.+)$/);
  if (!m) return null;
  const num = parseInt(m[2], 10);
  const title = m[3].trim();
  const isBoss = /БОСС/.test(title);
  const screens = chunk
    .slice(nl + 1)
    .split(/^#### /m)
    .slice(1)
    .map((sc) => parseScreen(sc, isBoss))
    .filter(Boolean);
  const xp = screens.reduce((s, sc) => s + sc.xp, 0);
  return { module: moduleId, num, id: `${moduleId}.${num}`, title, isBoss, screens, xp };
}

function parseScreen(raw, isBoss) {
  // отрезаем разделитель между уроками и возможный эпилог
  let body = raw.split(/\n---\s*(\n|$)/)[0];
  body = body.split(/\n## /)[0];
  const nl = body.indexOf('\n');
  const heading = (nl === -1 ? body : body.slice(0, nl)).trim();
  const content = (nl === -1 ? '' : body.slice(nl + 1)).trim();
  let screen = null;
  if (heading.startsWith('📖')) screen = { type: 'theory', md: content };
  else if (heading.startsWith('❓')) screen = parseQuiz(content);
  else if (heading.startsWith('✏️') || heading.startsWith('💻'))
    screen = parseCode(heading, content, isBoss);
  else if (heading.startsWith('🐞')) screen = parseBug(content);
  else if (heading.startsWith('🧩')) screen = parsePuzzle(content);
  if (!screen) return null;
  screen.heading = heading;
  screen.xp = XP[screen.kind || screen.type] ?? 0;
  return screen;
}

// ---------- код-экраны ----------

function parseCode(heading, content, isBoss) {
  const hintsIdx = content.indexOf('**Подсказки:**');
  const testsIdx = content.indexOf('**Автотесты:**');
  const condEnd =
    hintsIdx >= 0 ? hintsIdx : testsIdx >= 0 ? testsIdx : content.length;
  let condition = content.slice(0, condEnd);
  const hintsPart =
    hintsIdx >= 0
      ? content.slice(hintsIdx, testsIdx >= 0 ? testsIdx : undefined)
      : '';
  const testsPart = testsIdx >= 0 ? content.slice(testsIdx) : '';

  let starter = '';
  const sc = condition.match(/\*\*Стартовый код:\*\*\s*\n```python\n([\s\S]*?)```/);
  if (sc) {
    starter = sc[1].replace(/\s+$/, '');
    condition = condition.replace(sc[0], '');
  } else {
    condition = condition.replace(/\*\*Стартовый код:\*\*\s*пусто\.?/, '');
  }

  const files = extractFiles(condition);
  const hints = parseHints(hintsPart);
  const solution = extractLastPython(hints[2] || '');
  const tests = parseTests(testsPart);

  return {
    type: 'code',
    kind: isBoss ? 'boss' : heading.startsWith('✏️') ? 'fill' : 'task',
    md: condition.trim(),
    starter,
    hints,
    solution,
    tests,
    files,
  };
}

function extractFiles(text) {
  const files = [];
  const re =
    /\*\*Предзагруженный файл ([^:*]+):\*\*\s*(?:`([^`]+)`|\n```[a-z]*\n([\s\S]*?)```)/g;
  let m;
  while ((m = re.exec(text))) {
    const name = m[1].trim();
    let body = m[2] !== undefined ? m[2].replace(/\\n/g, '\n') : m[3];
    if (!body.endsWith('\n')) body += '\n';
    files.push({ name, content: body });
  }
  return files;
}

function parseHints(part) {
  if (!part) return [];
  const body = part.replace('**Подсказки:**', '');
  const hints = [];
  let current = null;
  for (const line of body.split('\n')) {
    const m = line.match(/^([123])\.\s?(.*)$/);
    if (m) {
      if (current !== null) hints.push(current.trim());
      current = m[2];
    } else if (current !== null) {
      current += '\n' + line;
    }
  }
  if (current !== null) hints.push(current.trim());
  return hints;
}

function extractLastPython(text) {
  const matches = [...text.matchAll(/```python\n([\s\S]*?)```/g)];
  return matches.length ? matches[matches.length - 1][1].replace(/\s+$/, '') : null;
}

function parseTests(part) {
  if (!part) return { cases: [], note: null };
  const lines = part.split('\n').filter((l) => l.trim().startsWith('|'));
  if (lines.length < 3 || !lines[0].includes('Ввод')) {
    const note = part.replace('**Автотесты:**', '').split('\n')[0].trim() || null;
    return { cases: [], note };
  }
  const cases = [];
  for (const row of lines.slice(2)) {
    const cells = splitRow(row);
    if (cells.length < 2) continue;
    const input = parseCell(cells[0]);
    const expected = parseCell(cells[1]);
    if (input === null || expected === null) continue;
    cases.push({ input, expected });
  }
  return { cases, note: null };
}

function splitRow(row) {
  return row
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split(/(?<!\\)\|/)
    .map((c) => c.trim());
}

function parseCell(cell) {
  cell = cell.trim();
  if (cell === '—' || cell === '' || cell.includes('(пусто)')) return [];
  if (/[…×]/.test(cell)) return null; // сокращённые описания — не машинный тест
  const ticks = [...cell.matchAll(/`([^`]*)`/g)].map((m) =>
    m[1].replace(/\\\|/g, '|')
  );
  if (!ticks.length) return null;
  // если кроме backtick-значений и разделителей в ячейке есть прочий текст —
  // это пояснение для человека, тест пропускаем
  const leftover = cell.replace(/`[^`]*`/g, '').replace(/[⏎\s,.:()\-—]/gu, '');
  if (leftover.length > 0) return null;
  return ticks;
}

// ---------- квизы ----------

function parseQuiz(content) {
  const lines = content.split('\n');
  const firstOpt = lines.findIndex((l) => l.startsWith('- '));
  if (firstOpt === -1) return { type: 'theory', md: content };
  let lastOpt = firstOpt;
  const options = [];
  for (let i = firstOpt; i < lines.length; i++) {
    if (!lines[i].startsWith('- ')) {
      if (lines[i].trim() === '') continue;
      break;
    }
    lastOpt = i;
    let t = lines[i].slice(2).trim();
    const correct = t.includes('✅');
    t = t.replace(/[✅❌]/g, '').trim();
    let label = t;
    let explain = '';
    const dash = t.indexOf(' — ');
    if (dash >= 0) {
      label = t.slice(0, dash).trim();
      explain = t.slice(dash + 3).trim();
    }
    options.push({ label, explain, correct });
  }
  const broken =
    options.length < 2 ||
    !options.some((o) => o.correct) ||
    options.some((o) => o.label.length === 0);
  if (broken) return { type: 'theory', md: content };
  const question = lines.slice(0, firstOpt).join('\n').trim();
  const after = lines
    .slice(lastOpt + 1)
    .join('\n')
    .trim();
  return { type: 'quiz', question, options, after };
}

// ---------- найди баг ----------

function parseBug(content) {
  const m = content.match(/```python\n([\s\S]*?)```/);
  if (!m) return { type: 'theory', md: content };
  const before = content.slice(0, m.index).trim();
  const reveal = content.slice(m.index + m[0].length).trim();
  return {
    type: 'bug',
    md: before,
    starter: m[1].replace(/\s+$/, ''),
    reveal,
  };
}

// ---------- собери код ----------

function parsePuzzle(content) {
  const itemsLine = content.match(/\*\*Строки[^:]*:\*\*(.+)/);
  const orderLine = content.match(/\*\*Правильный порядок:\*\*(.+)/);
  if (!itemsLine || !orderLine) return { type: 'theory', md: content };
  const items = [...itemsLine[1].matchAll(/`([^`]+)`/g)].map((m) => m[1]);
  const order = [...orderLine[1].matchAll(/`([^`]+)`/g)].map((m) => m[1]);
  if (items.length < 2 || order.length < 2) return { type: 'theory', md: content };
  const condition = content.slice(0, itemsLine.index).trim();
  return { type: 'puzzle', md: condition, items, order };
}
