import fs from 'node:fs';
import path from 'node:path';
import { NextResponse } from 'next/server';

// Анонимная синхронизация прогресса: блоб хранится по коду-ключу.
// Уровень прототипа: код = доступ (как ссылка-шеринг), без аккаунтов и PII.

// в проде (Railway) DATA_DIR указывает на примонтированный Volume
const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');
const CODE_RE = /^pys-[a-z2-9]{8}$/;
const MAX_SIZE = 200 * 1024; // 200 КБ с запасом

function fileFor(code) {
  return path.join(DATA_DIR, code + '.json');
}

export async function GET(request) {
  const code = new URL(request.url).searchParams.get('code') || '';
  if (!CODE_RE.test(code)) {
    return NextResponse.json({ error: 'bad code' }, { status: 400 });
  }
  try {
    const raw = fs.readFileSync(fileFor(code), 'utf8');
    return NextResponse.json({ data: JSON.parse(raw) });
  } catch {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'bad json' }, { status: 400 });
  }
  const { code, data } = body || {};
  if (!CODE_RE.test(code || '') || typeof data !== 'object' || data === null) {
    return NextResponse.json({ error: 'bad request' }, { status: 400 });
  }
  const raw = JSON.stringify(data);
  if (raw.length > MAX_SIZE) {
    return NextResponse.json({ error: 'too large' }, { status: 413 });
  }
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(fileFor(code), raw);
  return NextResponse.json({ ok: true });
}
