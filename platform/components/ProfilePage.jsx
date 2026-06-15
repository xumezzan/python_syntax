'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getProgress, setEditorTheme, setPaiSkin, PROGRESS_EVENT } from '@/lib/progress';
import { levelFor } from '@/lib/levels';
import { BADGES } from '@/lib/badges';
import { THEMES } from '@/lib/themes';
import { SKINS } from '@/lib/skins';
import { getSyncCode, enableSync, pullProgress } from '@/lib/sync';
import { splitIcon, pluralDays } from '@/lib/ui';

export default function ProfilePage({ modules, tracks = [] }) {
  const [p, setP] = useState(null);

  useEffect(() => {
    const update = () => setP(getProgress());
    update();
    window.addEventListener(PROGRESS_EVENT, update);
    return () => window.removeEventListener(PROGRESS_EVENT, update);
  }, []);

  if (!p) return <div className="chapter" />;

  const level = levelFor(p.xp);
  // экраны по модулям: ключи вида s:3.4:1
  const screensByModule = {};
  for (const key of Object.keys(p.screens)) {
    const m = key.match(/^s:(\d+)\./);
    if (m) screensByModule[m[1]] = (screensByModule[m[1]] || 0) + 1;
  }
  const activeDays = Object.values(p.daily).filter((v) => v > 0).length;

  // группируем модули по трекам; если треков нет в пропсах — один общий список
  const trackList = tracks.length
    ? tracks
    : [{ slug: null, title: null }];
  const modulesOfTrack = (slug) =>
    slug ? modules.filter((m) => m.track === slug) : modules;
  const shortTrackTitle = (title) =>
    (title || '').replace(/\s*\p{Extended_Pictographic}+\s*$/u, '').split(':')[0].trim();

  return (
    <div className="chapter profile">
      <nav className="crumbs2">
        <Link href="/">Карта</Link>
        <span className="sep">/</span>
        <span className="here">Профиль</span>
      </nav>

      {/* ---------- уровень ---------- */}
      <header className="profile-hero">
        <div className="profile-level">
          <div className="profile-lv-num">{level.level}</div>
          <div>
            <h1>Уровень {level.level} · {level.title}</h1>
            <div className="level-bar profile-bar">
              <div className="level-fill" style={{ width: `${(level.into / level.need) * 100}%` }} />
            </div>
            <span className="level-left">{level.into}/{level.need} XP · до уровня {level.level + 1} — {level.need - level.into} XP</span>
          </div>
        </div>
        <ul className="records">
          <li><b>{p.xp}</b><span>всего XP</span></li>
          <li><b>🔥 {p.best}</b><span>рекорд серии</span></li>
          <li><b>{activeDays}</b><span>{pluralDays(activeDays)} занятий</span></li>
          <li><b>◉ {Object.keys(p.perfect).length}</b><span>идеальных</span></li>
          <li><b>❄ {p.freezes}</b><span>заморозки</span></li>
        </ul>
      </header>

      {/* ---------- навыки ---------- */}
      <section className="profile-sec">
        <h2>Навыки</h2>
        {trackList.map((t) => (
          <div key={t.slug || 'all'} className="track-group">
            {t.title && <h3 className="track-group-title">{shortTrackTitle(t.title)}</h3>}
            <div className="skills">
              {modulesOfTrack(t.slug).map((m) => {
                const { name, icon } = splitIcon(m.title);
                const pct = Math.round(((screensByModule[m.id] || 0) / m.totalScreens) * 100);
                return (
                  <Link href={`/module/${m.id}`} className="skill" key={m.id}>
                    <span className="skill-glyph">{icon}</span>
                    <span className="skill-name">{name}</span>
                    <span className="skill-bar"><i style={{ width: pct + '%' }} /></span>
                    <span className="skill-pct">{pct}%</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </section>

      {/* ---------- печати глав ---------- */}
      <section className="profile-sec">
        <h2>Печати модулей</h2>
        {trackList.map((t) => (
          <div key={t.slug || 'all'} className="track-group">
            {t.title && <h3 className="track-group-title">{shortTrackTitle(t.title)}</h3>}
            <div className="seals">
              {modulesOfTrack(t.slug).map((m) => {
                const { name, icon } = splitIcon(m.title);
                const sealed = m.lessonIds.every((id) => p.lessons[id]);
                return (
                  <Link href={`/module/${m.id}`} key={m.id}
                    className={'seal-slot' + (sealed ? ' sealed' : '')} title={name}>
                    <span className="seal">{sealed ? icon : (m.trackNum ?? m.id)}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </section>

      {/* ---------- скины Пая ---------- */}
      <section className="profile-sec">
        <h2>Скины Пая</h2>
        <div className="themes">
          {SKINS.map((s) => {
            const unlocked = s.unlock(p);
            const active = (p.paiSkin || 'snake') === s.id;
            return (
              <button
                key={s.id}
                className={'theme-card' + (active ? ' active' : '') + (unlocked ? '' : ' locked')}
                onClick={() => unlocked && setPaiSkin(s.id)}
                disabled={!unlocked}
                title={unlocked ? 'Выбрать' : `Откроется: ${s.hint}`}
              >
                <span className="skin-emoji">{s.emoji}</span>
                <b>{s.name}</b>
                <span className="theme-hint">
                  {active ? '✓ выбран' : unlocked ? 'доступен' : `🔒 ${s.hint}`}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* ---------- синхронизация ---------- */}
      <SyncSection />

      {/* ---------- темы редактора ---------- */}
      <section className="profile-sec">
        <h2>Темы редактора</h2>
        <div className="themes">
          {THEMES.map((t) => {
            const unlocked = t.unlock(p);
            const active = (p.editorTheme || 'vs-dark') === t.id;
            return (
              <button
                key={t.id}
                className={'theme-card' + (active ? ' active' : '') + (unlocked ? '' : ' locked')}
                onClick={() => unlocked && setEditorTheme(t.id)}
                disabled={!unlocked}
                title={unlocked ? 'Применить' : `Откроется: ${t.hint}`}
              >
                <span className="theme-dots">
                  {t.colors.map((c, i) => (
                    <i key={i} style={{ background: c }} />
                  ))}
                </span>
                <b>{t.name}</b>
                <span className="theme-hint">
                  {active ? '✓ выбрана' : unlocked ? 'доступна' : `🔒 ${t.hint}`}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* ---------- теплокарта ---------- */}
      <section className="profile-sec">
        <h2>Активность · 12 недель</h2>
        <Heatmap daily={p.daily} />
      </section>

      {/* ---------- достижения ---------- */}
      <section className="profile-sec">
        <h2>Достижения · {Object.keys(p.badges).length} из {BADGES.length}</h2>
        <div className="badges">
          {BADGES.map((b) => {
            const earned = Boolean(p.badges[b.id]);
            const [cur, target] = b.progress(p);
            return (
              <div className={'badge' + (earned ? ' earned' : '')} key={b.id}>
                <span className="badge-ico">{earned ? b.icon : '·'}</span>
                <b>{b.name}</b>
                <span className="badge-desc">{b.desc}</span>
                {!earned && (
                  <span className="badge-progress">
                    <i style={{ width: Math.min(100, (cur / target) * 100) + '%' }} />
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function SyncSection() {
  const [code, setCode] = useState(null);
  const [input, setInput] = useState('');
  const [status, setStatus] = useState(null);

  useEffect(() => setCode(getSyncCode()), []);

  const create = () => {
    setCode(enableSync());
    setStatus('Код создан — прогресс теперь сохраняется автоматически.');
  };

  const restore = async () => {
    const c = input.trim().toLowerCase();
    if (!/^pys-[a-z2-9]{8}$/.test(c)) {
      setStatus('Код выглядит как pys-xxxxxxxx — проверь и попробуй снова.');
      return;
    }
    if (!window.confirm('Заменить прогресс на этом устройстве данными с сервера?')) return;
    const ok = await pullProgress(c);
    if (ok) {
      setCode(c);
      setInput('');
      setStatus('Готово! Прогресс загружен.');
    } else {
      setStatus('Не нашёл прогресс по этому коду.');
    }
  };

  return (
    <section className="profile-sec">
      <h2>Твой прогресс и вход</h2>
      <div className="sync-card">
        {code ? (
          <>
            <div className="sync-row">
              <span>✓ Прогресс сохраняется автоматически. Твой код для входа:</span>
            </div>
            <div className="sync-row">
              <code className="sync-code">{code}</code>
              <button className="btn" onClick={() => navigator.clipboard?.writeText(code)}>
                Копировать
              </button>
              <span className="sync-note">
                запиши его — это ключ, чтобы продолжить на другом устройстве или
                восстановить прогресс после очистки браузера
              </span>
            </div>
          </>
        ) : (
          <div className="sync-row">
            <span>Код появится сам, как только начнёшь учиться. Или создай сейчас:</span>
            <button className="btn primary" onClick={create}>Создать код входа</button>
          </div>
        )}
        <div className="sync-row">
          <span>Входишь с другого устройства? Введи свой код:</span>
          <input
            className="sync-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="pys-xxxxxxxx"
            spellCheck={false}
          />
          <button className="btn" onClick={restore} disabled={!input.trim()}>Загрузить</button>
        </div>
        {status && <p className="sync-status">{status}</p>}
      </div>
    </section>
  );
}

function Heatmap({ daily }) {
  // 12 недель, колонки — недели, строки — дни (пн…вс)
  const today = new Date();
  const dow = today.getDay() || 7;
  const cells = [];
  for (let w = 11; w >= 0; w--) {
    const col = [];
    for (let d = 1; d <= 7; d++) {
      const offset = w * 7 + (dow - d);
      if (offset < 0) { col.push(null); continue; }
      const date = new Date(Date.now() - offset * 86400000).toISOString().slice(0, 10);
      col.push({ date, xp: daily[date] || 0 });
    }
    cells.push(col);
  }
  const lvl = (xp) => (xp === 0 ? 0 : xp < 20 ? 1 : xp < 40 ? 2 : 3);
  return (
    <div className="heatmap">
      {cells.map((col, i) => (
        <div className="hm-col" key={i}>
          {col.map((c, j) =>
            c === null ? (
              <i key={j} className="hm-cell empty" />
            ) : (
              <i key={j} className={`hm-cell l${lvl(c.xp)}`} title={`${c.date}: ${c.xp} XP`} />
            )
          )}
        </div>
      ))}
    </div>
  );
}
