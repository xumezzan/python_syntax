'use client';

// Разблокируемые темы редактора — награды, которыми пользуешься.
// Условия привязаны к реальному прогрессу ученика.

import { levelFor } from './levels';

export const THEMES = [
  {
    id: 'vs-dark', name: 'Ночная классика',
    colors: ['#1e1e1e', '#569cd6', '#ce9178'],
    unlock: () => true, hint: 'доступна сразу',
  },
  {
    id: 'pys-monokai', name: 'Monokai',
    colors: ['#272822', '#f92672', '#a6e22e'],
    unlock: (p) => (p.counts?.bosses || 0) >= 1, hint: 'победи первого босса',
  },
  {
    id: 'pys-nord', name: 'Nord',
    colors: ['#2e3440', '#88c0d0', '#a3be8c'],
    unlock: (p) => (p.best || 0) >= 7, hint: 'серия 7 дней',
  },
  {
    id: 'pys-solarized', name: 'Solarized',
    colors: ['#002b36', '#268bd2', '#b58900'],
    unlock: (p) => levelFor(p.xp).level >= 5, hint: 'достигни 5 уровня',
  },
  {
    id: 'pys-dracula', name: 'Dracula',
    colors: ['#282a36', '#bd93f9', '#50fa7b'],
    unlock: (p) => (p.counts?.perfectLessons || 0) >= 5, hint: '5 идеальных уроков',
  },
];

const DEFS = {
  'pys-monokai': {
    base: 'vs-dark', inherit: true,
    rules: [
      { token: 'keyword', foreground: 'f92672' },
      { token: 'string', foreground: 'e6db74' },
      { token: 'number', foreground: 'ae81ff' },
      { token: 'comment', foreground: '75715e' },
      { token: 'identifier', foreground: 'f8f8f2' },
    ],
    colors: { 'editor.background': '#272822', 'editor.foreground': '#f8f8f2' },
  },
  'pys-nord': {
    base: 'vs-dark', inherit: true,
    rules: [
      { token: 'keyword', foreground: '81a1c1' },
      { token: 'string', foreground: 'a3be8c' },
      { token: 'number', foreground: 'b48ead' },
      { token: 'comment', foreground: '616e88' },
      { token: 'identifier', foreground: 'd8dee9' },
    ],
    colors: { 'editor.background': '#2e3440', 'editor.foreground': '#d8dee9' },
  },
  'pys-solarized': {
    base: 'vs-dark', inherit: true,
    rules: [
      { token: 'keyword', foreground: '859900' },
      { token: 'string', foreground: '2aa198' },
      { token: 'number', foreground: 'd33682' },
      { token: 'comment', foreground: '586e75' },
      { token: 'identifier', foreground: '839496' },
    ],
    colors: { 'editor.background': '#002b36', 'editor.foreground': '#839496' },
  },
  'pys-dracula': {
    base: 'vs-dark', inherit: true,
    rules: [
      { token: 'keyword', foreground: 'ff79c6' },
      { token: 'string', foreground: 'f1fa8c' },
      { token: 'number', foreground: 'bd93f9' },
      { token: 'comment', foreground: '6272a4' },
      { token: 'identifier', foreground: 'f8f8f2' },
    ],
    colors: { 'editor.background': '#282a36', 'editor.foreground': '#f8f8f2' },
  },
};

/** Регистрирует кастомные темы в Monaco (идемпотентно). */
export function defineThemes(monaco) {
  for (const [id, def] of Object.entries(DEFS)) {
    monaco.editor.defineTheme(id, def);
  }
}
