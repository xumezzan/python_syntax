'use client';

// Лёгкое CSS-конфетти без библиотек. Поводы строго три:
// первая программа, босс, завершение модуля.

const COLORS = ['#4CC38A', '#D9B44A', '#A78BFA', '#7AA5F0', '#E5736F'];

export default function Confetti({ count = 36 }) {
  return (
    <div className="confetti" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <i
          key={i}
          style={{
            '--x': Math.random() * 100 + 'vw',
            '--dur': 2.2 + Math.random() * 1.6 + 's',
            '--delay': Math.random() * 0.5 + 's',
            '--rot': Math.random() * 540 + 'deg',
            '--c': COLORS[i % COLORS.length],
            '--size': 6 + Math.random() * 6 + 'px',
          }}
        />
      ))}
    </div>
  );
}
