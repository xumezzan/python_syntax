'use client';

// Клиент синхронизации: localStorage — источник правды, сервер — резервная
// копия по коду. Авто-пуш с дебаунсом подписан в TopBar (живёт на всех страницах).

import { getProgress, PROGRESS_EVENT } from './progress';

const SYNC_KEY = 'pysyntax-sync';
const ALPHABET = 'abcdefghjkmnpqrstuvwxyz23456789'; // без похожих символов

export function getSyncCode() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(SYNC_KEY);
}

export function enableSync() {
  let code = getSyncCode();
  if (!code) {
    const rand = Array.from(crypto.getRandomValues(new Uint8Array(8)))
      .map((b) => ALPHABET[b % ALPHABET.length])
      .join('');
    code = 'pys-' + rand;
    localStorage.setItem(SYNC_KEY, code);
  }
  pushProgress();
  return code;
}

export function disableSync() {
  localStorage.removeItem(SYNC_KEY);
}

export async function pushProgress() {
  const code = getSyncCode();
  if (!code) return false;
  try {
    const res = await fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, data: getProgress() }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** Загрузить прогресс по коду и заменить локальный. */
export async function pullProgress(code) {
  const res = await fetch('/api/sync?code=' + encodeURIComponent(code));
  if (!res.ok) return false;
  const { data } = await res.json();
  if (!data || typeof data !== 'object') return false;
  localStorage.setItem('pysyntax-v1', JSON.stringify(data));
  localStorage.setItem(SYNC_KEY, code);
  window.dispatchEvent(new CustomEvent(PROGRESS_EVENT));
  return true;
}

/** Автопуш: дебаунс после каждого изменения прогресса. Вызвать один раз. */
export function startAutoSync() {
  if (typeof window === 'undefined' || window.__pysAutoSync) return;
  window.__pysAutoSync = true;
  let timer = null;
  window.addEventListener(PROGRESS_EVENT, () => {
    if (!getSyncCode()) return;
    clearTimeout(timer);
    timer = setTimeout(pushProgress, 1500);
  });
}
