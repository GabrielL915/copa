/*  Variation B — Scoreboard Dark
    Stadium night, LED scoreboard. Deep navy, mono numerals, electric lime.
    Dense data feel — minimal chrome, lots of counts.
*/
(function () {
  const { useState, useEffect, useRef, useMemo } = React;
  const { GROUPS, PER_TEAM, FWC_COUNT, CC_COUNT, TOTAL, getAllIds } = window.ALBUM;
  const STORAGE_KEY = 'album-v1-scoreboard';

  // ── theme tokens ──────────────────────────────────────────────
  const t = {
    bg:       '#0b1014',       // near-black blue
    surface:  '#141b22',
    surface2: '#1a232c',
    line:     '#222c36',
    lineSoft: '#1a232c',
    ink:      '#e9eef2',
    inkDim:   '#7a8590',
    inkSoft:  '#4a5560',
    accent:   '#cfff3e',       // electric lime
    accentDim:'#5b6b1c',
    red:      '#ff5a4a',
    sans:     "'Geist', 'Inter', system-ui, sans-serif",
    mono:     "'JetBrains Mono', ui-monospace, monospace",
    display:  "'Geist', 'Inter', system-ui, sans-serif",
  };

  // ── persistence ───────────────────────────────────────────────
  function loadState() {
    try { const r = localStorage.getItem(STORAGE_KEY); if (r) return JSON.parse(r); } catch (e) {}
    return { collected: {} };
  }
  function saveState(s) { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch (e) {} }

  // ── tap / long-press handler ──────────────────────────────────
  function useStickerPress(onTap, onLong) {
    return React.useCallback((id) => {
      let timer, fired = false;
      const down = () => {
        fired = false;
        timer = setTimeout(() => { fired = true; onLong(id); if (navigator.vibrate) navigator.vibrate(20); }, 450);
      };
      const cancel = () => clearTimeout(timer);
      const up = () => {
        clearTimeout(timer);
        if (!fired) onTap(id);
      };
      return {
        onPointerDown: down,
        onPointerUp: up,
        onPointerLeave: cancel,
        onPointerCancel: cancel,
        onContextMenu: (e) => { e.preventDefault(); onLong(id); },
      };
    }, [onTap, onLong]);
  }

  // ── sticker cell — LED look ───────────────────────────────────
  function Sticker({ id, label, count, handlers }) {
    const owned = count > 0;
    const hasDup = count > 1;
    return (
      <button
        {...handlers(id)}
        style={{
          aspectRatio: '1',
          background: owned ? t.accent : t.surface,
          color: owned ? '#0b1014' : t.inkSoft,
          border: owned ? `1px solid ${t.accent}` : `1px solid ${t.line}`,
          borderRadius: 6,
          fontFamily: t.mono,
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: 0.2,
          padding: 0,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          touchAction: 'manipulation',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          boxShadow: owned ? `0 0 0 1px rgba(207,255,62,.15), 0 0 8px rgba(207,255,62,.18)` : 'none',
        }}>
        {label}
        {hasDup && (
          <span style={{
            position: 'absolute', top: -6, right: -6,
            background: '#ffd13c', color: '#0b1014',
            fontSize: 9, fontWeight: 800,
            padding: '1px 4px', borderRadius: 4,
            fontFamily: t.mono,
            minWidth: 14, height: 14,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>×{count}</span>
        )}
      </button>
    );
  }

  // ── thin LED progress ─────────────────────────────────────────
  function ProgressBar({ value, color = t.accent }) {
    return (
      <div style={{ height: 4, background: t.surface, borderRadius: 0, overflow: 'hidden', border: `1px solid ${t.line}` }}>
        <div style={{ width: `${value * 100}%`, height: '100%', background: color, transition: 'width .25s', boxShadow: `0 0 6px ${color}88` }} />
      </div>
    );
  }

  // ── team row — dense, scoreboard line ─────────────────────────
  function TeamCard({ team, collected, handlers }) {
    let owned = 0;
    for (let i = 1; i <= PER_TEAM; i++) if ((collected[`${team.c} ${i}`] || 0) > 0) owned++;
    const pct = owned / PER_TEAM;
    const complete = owned === PER_TEAM;
    return (
      <div style={{
        background: t.surface,
        border: `1px solid ${t.line}`,
        borderRadius: 8,
        padding: '12px 12px 12px',
        marginBottom: 8,
        position: 'relative',
      }}>
        {/* left flag-color rail */}
        <div style={{ position: 'absolute', left: 0, top: 12, bottom: 12, width: 3, background: team.k, borderRadius: 99 }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, paddingLeft: 7 }}>
          <span style={{ fontSize: 20, lineHeight: 1 }}>{team.f}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: t.display, fontSize: 15, fontWeight: 600, color: t.ink, lineHeight: 1.1, letterSpacing: '-0.005em' }}>
              {team.n}
            </div>
            <div style={{ fontFamily: t.mono, fontSize: 9, color: t.inkDim, letterSpacing: 1.2, marginTop: 2 }}>
              {team.c}
            </div>
          </div>
          <div style={{ textAlign: 'right', fontFamily: t.mono, lineHeight: 1 }}>
            <div style={{ fontSize: 18, color: complete ? t.accent : t.ink, fontWeight: 600 }}>
              {String(owned).padStart(2, '0')}
              <span style={{ color: t.inkSoft, fontSize: 13 }}>/{PER_TEAM}</span>
            </div>
            {complete && (
              <div style={{ fontSize: 8, color: t.accent, letterSpacing: 1.8, marginTop: 3, fontWeight: 600 }}>
                COMPLETO ✓
              </div>
            )}
          </div>
        </div>

        <div style={{ paddingLeft: 7, marginBottom: 10 }}>
          <ProgressBar value={pct} color={complete ? t.accent : team.k} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: 4, paddingLeft: 7 }}>
          {Array.from({ length: PER_TEAM }, (_, i) => {
            const id = `${team.c} ${i + 1}`;
            return <Sticker key={id} id={id} label={i + 1} count={collected[id] || 0} handlers={handlers} />;
          })}
        </div>
      </div>
    );
  }

  // ── group header — score banner ───────────────────────────────
  function GroupHeader({ letter, teams, collected, death }) {
    let owned = 0;
    teams.forEach(team => {
      for (let i = 1; i <= PER_TEAM; i++) if ((collected[`${team.c} ${i}`] || 0) > 0) owned++;
    });
    const total = teams.length * PER_TEAM;
    const pct = owned / total;
    return (
      <div style={{ marginTop: 18, marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 6,
            background: death ? t.red : t.accent,
            color: '#0b1014',
            fontFamily: t.mono, fontWeight: 700, fontSize: 14,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>{letter}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: t.mono, fontSize: 9, color: t.inkDim, letterSpacing: 2, textTransform: 'uppercase' }}>
              Grupo {death && <span style={{ color: t.red, marginLeft: 6 }}>· da Morte</span>}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
              <ProgressBar value={pct} color={death ? t.red : t.accent} />
            </div>
          </div>
          <div style={{ fontFamily: t.mono, fontSize: 13, color: t.ink, fontWeight: 600 }}>
            {owned}<span style={{ color: t.inkSoft }}>/{total}</span>
          </div>
        </div>
      </div>
    );
  }

  // ── special section ───────────────────────────────────────────
  function SpecialSection({ kicker, title, ids, collected, handlers, cols = 7 }) {
    let owned = 0;
    ids.forEach(id => { if ((collected[id] || 0) > 0) owned++; });
    return (
      <div style={{
        background: t.surface,
        border: `1px solid ${t.line}`,
        borderRadius: 8, padding: 12, marginBottom: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div>
            <div style={{ fontFamily: t.mono, fontSize: 9, color: t.inkDim, letterSpacing: 2, textTransform: 'uppercase' }}>
              {kicker}
            </div>
            <div style={{ fontFamily: t.display, fontSize: 15, fontWeight: 600, color: t.ink, marginTop: 2 }}>
              {title}
            </div>
          </div>
          <div style={{ fontFamily: t.mono, fontSize: 16, color: t.ink, fontWeight: 600 }}>
            {String(owned).padStart(2, '0')}<span style={{ color: t.inkSoft, fontSize: 12 }}>/{ids.length}</span>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 4 }}>
          {ids.map((id, i) => (
            <Sticker key={id} id={id} label={ids.length === 1 ? '00' : (i + 1)} count={collected[id] || 0} handlers={handlers} />
          ))}
        </div>
      </div>
    );
  }

  // ── main app ──────────────────────────────────────────────────
  function ScoreboardApp() {
    const [state, setState] = useState(loadState);
    const [tab, setTab] = useState('album');
    const [query, setQuery] = useState('');
    const [toast, setToast] = useState('');
    const toastTimer = useRef();
    useEffect(() => { saveState(state); }, [state]);

    const showToast = (msg) => {
      setToast(msg);
      clearTimeout(toastTimer.current);
      toastTimer.current = setTimeout(() => setToast(''), 1500);
    };

    const onTap = (id) => setState(s => {
      const c = { ...s.collected };
      if ((c[id] || 0) > 0) delete c[id]; else c[id] = 1;
      return { ...s, collected: c };
    });
    const onLong = (id) => setState(s => {
      const c = { ...s.collected };
      c[id] = Math.min((c[id] || 0) + 1, 9);
      return { ...s, collected: c };
    });
    const handlers = useStickerPress(onTap, onLong);

    const owned = Object.values(state.collected).filter(n => n > 0).length;
    const pct = owned / TOTAL;
    const dupTotal = Object.values(state.collected).reduce((a, n) => a + (n > 1 ? n - 1 : 0), 0);

    const q = query.trim().toLowerCase();
    const groupMatch = q.match(/^(?:grupo\s*)?([a-l])$/i);
    const groupLetter = groupMatch ? groupMatch[1].toUpperCase() : null;
    const teamMatches = (team, letter) => {
      if (!q) return true;
      if (groupLetter === letter) return true;
      return team.n.toLowerCase().includes(q) || team.c.toLowerCase().includes(q);
    };

    const missing = useMemo(() => getAllIds().filter(id => !state.collected[id]), [state]);
    const dups = useMemo(() => Object.entries(state.collected).filter(([, n]) => n > 1).map(([id, n]) => ({ id, n: n - 1 })), [state]);

    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: t.bg, fontFamily: t.sans, color: t.ink, overflow: 'hidden' }}>
        {/* scoreboard header */}
        <div style={{ padding: '14px 16px 12px', borderBottom: `1px solid ${t.line}`, background: t.bg }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
            <div>
              <div style={{ fontFamily: t.mono, fontSize: 9, color: t.inkDim, letterSpacing: 2.5, textTransform: 'uppercase' }}>
                ▸ Álbum 2026 · LIVE
              </div>
              <div style={{ fontFamily: t.display, fontSize: 22, fontWeight: 700, color: t.ink, marginTop: 2, letterSpacing: '-0.02em' }}>
                MUNDIAL <span style={{ color: t.accent }}>26</span>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: t.mono, fontSize: 9, color: t.inkDim, letterSpacing: 1.5 }}>COLETADAS</div>
              <div style={{ fontFamily: t.mono, fontSize: 28, fontWeight: 700, color: t.accent, lineHeight: 1, marginTop: 2, textShadow: `0 0 14px rgba(207,255,62,.4)` }}>
                {String(owned).padStart(3, '0')}
              </div>
              <div style={{ fontFamily: t.mono, fontSize: 10, color: t.inkDim, marginTop: 2 }}>
                /{TOTAL} · {Math.round(pct * 100)}%
              </div>
            </div>
          </div>
          <ProgressBar value={pct} />

          {/* mini stat strip */}
          <div style={{ display: 'flex', gap: 0, marginTop: 12, borderTop: `1px solid ${t.line}`, paddingTop: 10 }}>
            <Stat label="Faltam"    value={TOTAL - owned} />
            <Stat label="Repetidas" value={dupTotal} accent />
            <Stat label="Times completos" value={Object.values(GROUPS).flat().filter(team => {
              for (let i = 1; i <= PER_TEAM; i++) if (!state.collected[`${team.c} ${i}`]) return false;
              return true;
            }).length} />
          </div>
        </div>

        {/* tabs */}
        <div style={{ display: 'flex', background: t.bg, borderBottom: `1px solid ${t.line}` }}>
          {[['album', 'ÁLBUM'], ['troca', 'TROCAS']].map(([k, label]) => (
            <button key={k} onClick={() => setTab(k)}
              style={{
                flex: 1, padding: '11px 0', background: 'none', border: 'none',
                fontFamily: t.mono, fontSize: 11, fontWeight: 600,
                color: tab === k ? t.accent : t.inkDim, letterSpacing: 2,
                borderBottom: tab === k ? `2px solid ${t.accent}` : '2px solid transparent',
                marginBottom: -1, cursor: 'pointer',
              }}>
              {label}
              {k === 'troca' && dups.length > 0 && (
                <span style={{
                  marginLeft: 6, fontFamily: t.mono, fontSize: 9, letterSpacing: 0.5,
                  background: t.accent, color: '#0b1014', padding: '1px 5px', borderRadius: 3,
                }}>{dups.length}</span>
              )}
            </button>
          ))}
        </div>

        {/* content */}
        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
          {tab === 'album' && (
            <div style={{ padding: '12px 12px 80px' }}>
              <div style={{ position: 'relative', marginBottom: 10 }}>
                <input
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="› buscar país, sigla, grupo…"
                  style={{
                    width: '100%', padding: '10px 32px 10px 12px',
                    background: t.surface, border: `1px solid ${t.line}`, borderRadius: 6,
                    fontFamily: t.mono, fontSize: 12, color: t.ink, outline: 'none',
                  }}
                  onFocus={e => e.target.style.borderColor = t.accent}
                  onBlur={e => e.target.style.borderColor = t.line}
                />
                {query && (
                  <button onClick={() => setQuery('')}
                    style={{ position: 'absolute', right: 4, top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', color: t.inkDim, fontSize: 18, padding: '2px 8px', cursor: 'pointer' }}>×</button>
                )}
              </div>

              <div style={{ fontFamily: t.mono, fontSize: 9, color: t.inkSoft, letterSpacing: 1.8, textTransform: 'uppercase', textAlign: 'center', padding: '4px 0 10px' }}>
                tap ▸ marca · hold ▸ +repetida
              </div>

              {!q && (
                <SpecialSection
                  kicker="00 · ABERTURA"
                  title="Capa"
                  ids={['00']}
                  collected={state.collected}
                  handlers={handlers}
                  cols={5}
                />
              )}

              {!q && (
                <SpecialSection
                  kicker={`FWC · 01—${FWC_COUNT}`}
                  title="Páginas oficiais"
                  ids={Array.from({ length: FWC_COUNT }, (_, i) => `FWC ${i + 1}`)}
                  collected={state.collected}
                  handlers={handlers}
                />
              )}

              {Object.entries(GROUPS).map(([letter, teams]) => {
                const visible = teams.filter(team => teamMatches(team, letter));
                if (visible.length === 0) return null;
                return (
                  <div key={letter}>
                    <GroupHeader letter={letter} teams={teams} collected={state.collected} death={letter === 'I'} />
                    {visible.map(team => (
                      <TeamCard key={team.c} team={team} collected={state.collected} handlers={handlers} />
                    ))}
                  </div>
                );
              })}

              {!q && (
                <SpecialSection
                  kicker={`CC · 01—${CC_COUNT}`}
                  title="Seção Final"
                  ids={Array.from({ length: CC_COUNT }, (_, i) => `CC ${i + 1}`)}
                  collected={state.collected}
                  handlers={handlers}
                />
              )}

              {q && Object.entries(GROUPS).every(([letter, teams]) => teams.filter(team => teamMatches(team, letter)).length === 0) && (
                <div style={{ textAlign: 'center', padding: '40px 0', color: t.inkDim, fontSize: 12, fontFamily: t.mono }}>
                  › nenhum resultado.
                </div>
              )}
            </div>
          )}

          {tab === 'troca' && (
            <TradePanel
              missing={missing}
              dups={dups}
              setState={setState}
              showToast={showToast}
              t={t}
            />
          )}
        </div>

        {/* toast */}
        <div style={{
          position: 'absolute', bottom: 24, left: '50%',
          transform: `translateX(-50%) translateY(${toast ? 0 : 80}px)`,
          background: t.accent, color: '#0b1014', padding: '8px 16px', borderRadius: 6,
          fontFamily: t.mono, fontSize: 12, fontWeight: 600, letterSpacing: 0.5,
          opacity: toast ? 1 : 0, transition: 'all .22s', pointerEvents: 'none',
          whiteSpace: 'nowrap',
        }}>{toast}</div>
      </div>
    );
  }

  function Stat({ label, value, accent }) {
    return (
      <div style={{ flex: 1, textAlign: 'left' }}>
        <div style={{ fontFamily: t.mono, fontSize: 8, color: t.inkDim, letterSpacing: 1.5, textTransform: 'uppercase' }}>
          {label}
        </div>
        <div style={{ fontFamily: t.mono, fontSize: 17, fontWeight: 600, color: accent ? '#ffd13c' : t.ink, lineHeight: 1, marginTop: 3 }}>
          {String(value).padStart(2, '0')}
        </div>
      </div>
    );
  }

  function TradePanel({ missing, dups, setState, showToast, t }) {
    const reset = () => {
      if (confirm('Zerar todo o álbum?')) {
        setState({ collected: {} });
        showToast('Álbum zerado');
      }
    };
    return (
      <div style={{ padding: '12px 12px 80px' }}>
        <Block kicker="A CONSEGUIR" count={missing.length} accent={t.red} t={t}>
          {missing.length === 0
            ? <div style={{ fontFamily: t.mono, fontSize: 12, color: t.inkDim }}>› álbum completo 🏆</div>
            : <Chips items={missing} t={t} />}
        </Block>
        <Block kicker="A TROCAR" count={dups.length} accent={t.accent} t={t}>
          {dups.length === 0
            ? <div style={{ fontFamily: t.mono, fontSize: 12, color: t.inkDim }}>› nenhuma repetida</div>
            : <Chips items={dups.map(d => `${d.id}×${d.n}`)} t={t} highlight />}
        </Block>
        <div style={{ padding: '12px 0', textAlign: 'center' }}>
          <button onClick={reset} style={{
            background: 'transparent', border: `1px solid ${t.line}`, color: t.inkDim,
            padding: '8px 14px', borderRadius: 6, fontFamily: t.mono, fontSize: 11,
            cursor: 'pointer', letterSpacing: 1.2, textTransform: 'uppercase',
          }}>Zerar álbum</button>
        </div>
      </div>
    );
  }

  function Block({ kicker, count, accent, children, t }) {
    return (
      <div style={{ background: t.surface, border: `1px solid ${t.line}`, borderRadius: 8, padding: 14, marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, paddingBottom: 10, borderBottom: `1px dashed ${t.line}` }}>
          <div style={{ fontFamily: t.mono, fontSize: 10, color: t.inkDim, letterSpacing: 2, textTransform: 'uppercase' }}>
            {kicker}
          </div>
          <div style={{ fontFamily: t.mono, fontSize: 22, fontWeight: 700, color: accent, lineHeight: 1, textShadow: `0 0 12px ${accent}55` }}>
            {String(count).padStart(3, '0')}
          </div>
        </div>
        {children}
      </div>
    );
  }

  function Chips({ items, t, highlight }) {
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        {items.map((x, i) => (
          <span key={i} style={{
            fontFamily: t.mono, fontSize: 10.5,
            color: highlight ? '#0b1014' : t.ink,
            background: highlight ? t.accent : t.surface2,
            border: `1px solid ${highlight ? t.accent : t.line}`,
            padding: '3px 6px', borderRadius: 4, letterSpacing: 0.3, fontWeight: highlight ? 600 : 500,
          }}>{x}</span>
        ))}
      </div>
    );
  }

  window.ScoreboardApp = ScoreboardApp;
})();
