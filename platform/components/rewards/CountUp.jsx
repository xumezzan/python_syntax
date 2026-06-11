'use client';

import { useEffect, useState } from 'react';

// Число, «набегающее» до значения за duration мс (ease-out cubic).

export default function CountUp({ to, duration = 700, prefix = '', suffix = '' }) {
  const [v, setV] = useState(0);

  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setV(to);
      return;
    }
    let start = null;
    let raf;
    const tick = (t) => {
      if (start === null) start = t;
      const p = Math.min(1, (t - start) / duration);
      setV(Math.round(to * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to, duration]);

  return <span className="countup">{prefix}{v}{suffix}</span>;
}
