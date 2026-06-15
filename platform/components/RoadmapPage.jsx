'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getProgress, PROGRESS_EVENT } from '@/lib/progress';

// Роудмап платформы: путь от синтаксиса к backend и финальному проекту.
// Показывает прогресс по каждому треку из localStorage.

export default function RoadmapPage({ tracks }) {
  const [p, setP] = useState(null);

  useEffect(() => {
    const update = () => setP(getProgress());
    update();
    window.addEventListener(PROGRESS_EVENT, update);
    return () => window.removeEventListener(PROGRESS_EVENT, update);
  }, []);

  const done = p?.lessons || {};

  return (
    <div className="map roadmap-page">
      <nav className="crumbs2">
        <Link href="/">Главная</Link>
        <span className="sep">/</span>
        <span className="here">Роудмап</span>
      </nav>

      <section className="track-hero">
        <span className="eyebrow">🗺️ Путь обучения</span>
        <h1 className="focus-title">От первого print до enterprise-интеграции</h1>
        <p className="lead">
          Два трека и финальный проект. Сначала уверенный Python-синтаксис, потом backend, API
          и интеграции уровня SAP/банк — ровно как в реальной работе.
        </p>
      </section>

      <ol className="roadmap-track">
        {tracks.map((t, i) => {
          const total = t.lessons.length;
          const dc = t.lessons.filter((id) => done[id]).length;
          const pct = total ? Math.round((dc / total) * 100) : 0;
          const finished = total > 0 && dc === total;
          const started = dc > 0;
          const state = finished ? 'done' : started ? 'current' : 'idle';
          return (
            <li key={t.slug} className={`roadmap-step ${state}`}>
              <span className="roadmap-num">{finished ? '✓' : i + 1}</span>
              <div className="roadmap-card">
                <span className="eyebrow">
                  {t.icon} {t.modules} модулей · {total} уроков
                </span>
                <h2>{t.title}</h2>
                <p>{t.short}</p>
                <div className="mod-meta">
                  <div className="mod-bar"><div className="mod-fill" style={{ width: pct + '%' }} /></div>
                  <span>{dc}/{total}</span>
                </div>
                <Link className="cta small" href={t.href}>
                  {finished ? 'Открыть снова' : started ? 'Продолжить' : 'Открыть трек'} →
                </Link>
              </div>
            </li>
          );
        })}

        <li className="roadmap-step capstone">
          <span className="roadmap-num">🏁</span>
          <div className="roadmap-card">
            <span className="eyebrow">Финал · портфолио</span>
            <h2>Enterprise Integration Simulator</h2>
            <p>
              Рабочий backend, связывающий mock-SAP и mock-банк: платежи, webhook, integration
              logs, idempotency и retry. Запускается одной командой в Docker.
            </p>
            <Link className="cta small" href="/track/backend">К финальному проекту →</Link>
          </div>
        </li>
      </ol>
    </div>
  );
}
