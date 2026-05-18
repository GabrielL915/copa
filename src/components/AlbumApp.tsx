/*  Álbum Mundial 2026 — tema Anthropic Dark
    Anthropic design system dark mode: warm layered grays, terracotta accent.
    System sans, generous spacing, minimal aesthetic.
    Ported from variation-a.jsx to a typed React module.
*/
import {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
  type CSSProperties,
} from 'react';
import {
  GROUPS,
  PER_TEAM,
  FWC_COUNT,
  CC_COUNT,
  TOTAL,
  getAllIds,
  type Team,
} from '~/data/album';
import { buildShareUrl, readShareFromHash } from '~/data/share';

const STORAGE_KEY = 'album-v1-anthropic';

// ── Anthropic dark theme tokens ───────────────────────────────
const t = {
  bg: '#1a1815', // warm dark gray (not pure black)
  surface: '#29261b', // layered surface
  surface2: '#342f23', // lighter layer
  line: '#3d3830', // subtle border
  lineSoft: '#2d2922',
  text: '#f6f4ef', // cream text (not harsh white)
  textDim: '#9d9789', // muted text
  textSoft: '#6d6659', // very muted
  accent: '#d97757', // terracotta orange (Anthropic brand)
  accentDim: '#a85b42',
  accentBg: '#2d241f',
  red: '#e76f5a',
  sans: "-apple-system, BlinkMacSystemFont, 'SF Pro', system-ui, sans-serif",
  mono: "ui-monospace, 'SF Mono', Monaco, monospace",
};

type Collected = Record<string, number>;
interface State {
  collected: Collected;
}

// ── persistence ───────────────────────────────────────────────
function loadState(): State {
  try {
    if (typeof localStorage !== 'undefined') {
      const r = localStorage.getItem(STORAGE_KEY);
      if (r) return JSON.parse(r) as State;
    }
  } catch {
    /* ignore */
  }
  return { collected: {} };
}
function saveState(s: State) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    /* ignore */
  }
}

type PressHandlers = (id: string) => {
  onPointerDown: (e: React.PointerEvent) => void;
  onPointerMove: (e: React.PointerEvent) => void;
  onPointerUp: () => void;
  onPointerCancel: () => void;
  onClick: (e: React.MouseEvent) => void;
  onContextMenu: (e: React.MouseEvent) => void;
};

// ── tap / long-press handler ──────────────────────────────────
// Tap = browser `click` (only fires on a real tap, never on a scroll —
// this is what makes it work reliably on mobile inside the scroll list).
// Long-press = a timer armed on pointer-down, cancelled if the finger
// moves (= a scroll). Press state lives in a ref so it survives the
// re-render that onLong/onTap triggers (otherwise the click after a
// long-press would also fire onTap).
const MOVE_TOLERANCE = 10; // px before a press counts as a scroll
const LONG_PRESS_MS = 450;

function useStickerPress(
  onTap: (id: string) => void,
  onLong: (id: string) => void,
): PressHandlers {
  const press = useRef({
    id: '',
    timer: 0 as ReturnType<typeof setTimeout> | 0,
    longFired: false,
    moved: false,
    x: 0,
    y: 0,
  });

  return useCallback(
    (id: string) => ({
      onPointerDown: (e: React.PointerEvent) => {
        const p = press.current;
        p.id = id;
        p.longFired = false;
        p.moved = false;
        p.x = e.clientX;
        p.y = e.clientY;
        clearTimeout(p.timer);
        p.timer = setTimeout(() => {
          p.longFired = true;
          onLong(id);
          if (navigator.vibrate) navigator.vibrate(20);
        }, LONG_PRESS_MS);
      },
      onPointerMove: (e: React.PointerEvent) => {
        const p = press.current;
        if (p.id !== id) return;
        if (
          Math.abs(e.clientX - p.x) > MOVE_TOLERANCE ||
          Math.abs(e.clientY - p.y) > MOVE_TOLERANCE
        ) {
          p.moved = true;
          clearTimeout(p.timer);
        }
      },
      onPointerUp: () => clearTimeout(press.current.timer),
      onPointerCancel: () => {
        const p = press.current;
        clearTimeout(p.timer);
        p.moved = true; // browser took over (scroll) — suppress the tap
      },
      onClick: (e: React.MouseEvent) => {
        const p = press.current;
        if (p.longFired || p.moved) {
          e.preventDefault();
          return;
        }
        onTap(id);
      },
      onContextMenu: (e: React.MouseEvent) => {
        e.preventDefault();
        const p = press.current;
        if (!p.longFired) {
          p.longFired = true;
          onLong(id);
        }
      },
    }),
    [onTap, onLong],
  );
}

// ── single sticker square ─────────────────────────────────────
function Sticker({
  id,
  label,
  count,
  handlers,
}: {
  id: string;
  label: React.ReactNode;
  count: number;
  handlers: PressHandlers;
}) {
  const owned = count > 0;
  const hasDup = count > 1;
  return (
    <button
      {...handlers(id)}
      style={{
        aspectRatio: '1',
        background: owned ? t.accent : t.surface,
        color: owned ? '#1a1815' : t.textSoft,
        border: `1px solid ${owned ? t.accent : t.line}`,
        borderRadius: 8,
        fontFamily: t.mono,
        fontSize: 12,
        fontWeight: 500,
        padding: 0,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        touchAction: 'manipulation',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        transition: 'all .15s',
      }}
    >
      {label}
      {hasDup && (
        <span
          style={{
            position: 'absolute',
            top: -7,
            right: -7,
            background: t.text,
            color: t.bg,
            fontSize: 10,
            fontWeight: 600,
            padding: '2px 5px',
            borderRadius: 8,
            fontFamily: t.mono,
            minWidth: 16,
            height: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,.3)',
          }}
        >
          ×{count}
        </span>
      )}
    </button>
  );
}

// ── thin progress bar ─────────────────────────────────────────
function ProgressBar({ value, color = t.accent }: { value: number; color?: string }) {
  return (
    <div style={{ height: 4, background: t.surface, borderRadius: 6, overflow: 'hidden' }}>
      <div
        style={{
          width: `${value * 100}%`,
          height: '100%',
          background: color,
          transition: 'width .3s ease',
        }}
      />
    </div>
  );
}

// ── team card ─────────────────────────────────────────────────
function TeamCard({
  team,
  collected,
  handlers,
}: {
  team: Team;
  collected: Collected;
  handlers: PressHandlers;
}) {
  let owned = 0;
  for (let i = 1; i <= PER_TEAM; i++)
    if ((collected[`${team.c} ${i}`] || 0) > 0) owned++;
  const pct = owned / PER_TEAM;
  const complete = owned === PER_TEAM;
  return (
    <div
      style={{
        background: t.surface,
        borderRadius: 10,
        padding: '16px',
        marginBottom: 12,
        border: `1px solid ${t.line}`,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <span style={{ fontSize: 28, lineHeight: 1 }}>{team.f}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontFamily: t.sans,
              fontSize: 17,
              fontWeight: 500,
              color: t.text,
              lineHeight: 1.2,
            }}
          >
            {team.n}
          </div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontFamily: t.mono,
              fontSize: 11,
              color: t.textDim,
              marginTop: 4,
            }}
          >
            <span
              style={{ width: 8, height: 8, borderRadius: 99, background: team.k }}
            />
            {team.c}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div
            style={{
              fontFamily: t.mono,
              fontSize: 18,
              color: complete ? t.accent : t.text,
              fontWeight: 600,
              lineHeight: 1,
            }}
          >
            {String(owned).padStart(2, '0')}
            <span style={{ color: t.textDim, fontSize: 13, fontWeight: 500 }}>
              /{PER_TEAM}
            </span>
          </div>
          {complete && (
            <div style={{ fontSize: 10, color: t.accent, marginTop: 4 }}>✓</div>
          )}
        </div>
      </div>
      <div style={{ marginBottom: 14 }}>
        <ProgressBar value={pct} color={complete ? t.accent : team.k} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: 6 }}>
        {Array.from({ length: PER_TEAM }, (_, i) => {
          const id = `${team.c} ${i + 1}`;
          return (
            <Sticker
              key={id}
              id={id}
              label={i + 1}
              count={collected[id] || 0}
              handlers={handlers}
            />
          );
        })}
      </div>
    </div>
  );
}

// ── group header ──────────────────────────────────────────────
function GroupHeader({
  letter,
  teams,
  collected,
  death,
}: {
  letter: string;
  teams: Team[];
  collected: Collected;
  death?: boolean;
}) {
  let owned = 0;
  teams.forEach((team) => {
    for (let i = 1; i <= PER_TEAM; i++)
      if ((collected[`${team.c} ${i}`] || 0) > 0) owned++;
  });
  const total = teams.length * PER_TEAM;
  return (
    <div style={{ marginTop: 24, marginBottom: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div
          style={{
            width: 32,
            height: 32,
            background: death ? t.red : t.surface2,
            border: `1px solid ${death ? t.red : t.line}`,
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: t.sans,
            fontSize: 16,
            fontWeight: 600,
            color: death ? '#fff' : t.text,
          }}
        >
          {letter}
        </div>
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontFamily: t.sans,
              fontSize: 13,
              color: t.textDim,
              textTransform: 'uppercase',
              letterSpacing: 0.8,
            }}
          >
            Grupo {death && <span style={{ color: t.red }}>· da Morte</span>}
          </div>
        </div>
        <div
          style={{ fontFamily: t.mono, fontSize: 14, color: t.text, fontWeight: 500 }}
        >
          {owned}
          <span style={{ color: t.textDim }}>/{total}</span>
        </div>
      </div>
    </div>
  );
}

// ── special section (00, FWC, CC) ─────────────────────────────
function SpecialSection({
  title,
  kicker,
  ids,
  collected,
  handlers,
}: {
  title: string;
  kicker: string;
  ids: string[];
  collected: Collected;
  handlers: PressHandlers;
}) {
  let owned = 0;
  ids.forEach((id) => {
    if ((collected[id] || 0) > 0) owned++;
  });
  return (
    <div
      style={{
        background: t.surface,
        borderRadius: 10,
        padding: 16,
        marginBottom: 12,
        border: `1px solid ${t.line}`,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 14,
        }}
      >
        <div>
          <div
            style={{
              fontFamily: t.sans,
              fontSize: 13,
              color: t.textDim,
              textTransform: 'uppercase',
              letterSpacing: 0.8,
            }}
          >
            {kicker}
          </div>
          <div
            style={{
              fontFamily: t.sans,
              fontSize: 17,
              lineHeight: 1.3,
              color: t.text,
              marginTop: 2,
              fontWeight: 500,
            }}
          >
            {title}
          </div>
        </div>
        <div
          style={{ fontFamily: t.mono, fontSize: 16, color: t.text, fontWeight: 500 }}
        >
          {owned}
          <span style={{ color: t.textDim, fontSize: 13 }}>/{ids.length}</span>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
        {ids.map((id, i) => (
          <Sticker
            key={id}
            id={id}
            label={ids.length === 1 ? '00' : i + 1}
            count={collected[id] || 0}
            handlers={handlers}
          />
        ))}
      </div>
    </div>
  );
}

function TradePanel({
  missing,
  dups,
  setState,
  showToast,
  share,
}: {
  missing: string[];
  dups: { id: string; n: number }[];
  setState: React.Dispatch<React.SetStateAction<State>>;
  showToast: (msg: string) => void;
  share: () => void;
}) {
  const reset = () => {
    if (confirm('Zerar todo o álbum?')) {
      setState({ collected: {} });
      showToast('Álbum zerado');
    }
  };

  const Section = ({
    kicker,
    title,
    count,
    items,
    empty,
  }: {
    kicker: string;
    title: string;
    count: number;
    items: string[];
    empty: string;
  }) => (
    <div
      style={{
        background: t.surface,
        borderRadius: 10,
        padding: 18,
        margin: '0 16px 12px',
        border: `1px solid ${t.line}`,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 12,
        }}
      >
        <div>
          <div
            style={{
              fontFamily: t.sans,
              fontSize: 13,
              color: t.textDim,
              textTransform: 'uppercase',
              letterSpacing: 0.8,
            }}
          >
            {kicker}
          </div>
          <div
            style={{
              fontFamily: t.sans,
              fontSize: 18,
              lineHeight: 1.3,
              color: t.text,
              fontWeight: 500,
              marginTop: 2,
            }}
          >
            {title}
          </div>
        </div>
        <div
          style={{
            fontFamily: t.mono,
            fontSize: 22,
            color: count > 0 ? t.accent : t.textDim,
            lineHeight: 1,
            fontWeight: 500,
          }}
        >
          {count}
        </div>
      </div>
      {items.length === 0 ? (
        <div style={{ color: t.textDim, fontSize: 14, padding: '8px 0' }}>{empty}</div>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
          {items.map((x, i) => (
            <span
              key={i}
              style={{
                fontFamily: t.mono,
                fontSize: 12,
                color: t.text,
                background: t.surface2,
                border: `1px solid ${t.line}`,
                padding: '4px 8px',
                borderRadius: 6,
              }}
            >
              {x}
            </span>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div style={{ paddingTop: 16, paddingBottom: 80 }}>
      <Section
        kicker="Para conseguir"
        title="Faltam"
        count={missing.length}
        items={missing}
        empty="Álbum completo! 🏆"
      />
      <Section
        kicker="Para trocar"
        title="Repetidas"
        count={dups.length}
        items={dups.map((d) => `${d.id} ×${d.n}`)}
        empty="Nenhuma repetida ainda."
      />
      <div
        style={{
          padding: '20px',
          display: 'flex',
          justifyContent: 'center',
          gap: 12,
        }}
      >
        <button
          onClick={share}
          style={{
            background: 'transparent',
            border: `1px solid ${t.accentDim}`,
            color: t.accent,
            padding: '10px 16px',
            borderRadius: 8,
            fontFamily: t.sans,
            fontSize: 13,
            cursor: 'pointer',
            transition: 'all .2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = t.accent;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = t.accentDim;
          }}
        >
          Compartilhar / sincronizar
        </button>
        <button
          onClick={reset}
          style={{
            background: 'transparent',
            border: `1px solid ${t.line}`,
            color: t.textDim,
            padding: '10px 16px',
            borderRadius: 8,
            fontFamily: t.sans,
            fontSize: 13,
            cursor: 'pointer',
            transition: 'all .2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = t.accent;
            e.currentTarget.style.color = t.accent;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = t.line;
            e.currentTarget.style.color = t.textDim;
          }}
        >
          Zerar álbum
        </button>
      </div>
    </div>
  );
}

// ── main app ──────────────────────────────────────────────────
export default function AlbumApp() {
  const [state, setState] = useState<State>(loadState);
  const [tab, setTab] = useState<'album' | 'troca'>('album');
  const [query, setQuery] = useState('');
  const [toast, setToast] = useState('');
  const toastTimer = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => {
    saveState(state);
  }, [state]);

  const showToast = (msg: string) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 1600);
  };

  // Import a shared album passed in the URL hash (#a=…). Runs once on mount;
  // confirms before overwriting, and always clears the hash so a reload
  // doesn't re-prompt.
  const importedRef = useRef(false);
  useEffect(() => {
    if (importedRef.current) return;
    importedRef.current = true;
    const incoming = readShareFromHash();
    history.replaceState(
      null,
      '',
      window.location.pathname + window.location.search,
    );
    if (!incoming) return;
    const n = Object.values(incoming).filter((v) => v > 0).length;
    if (
      window.confirm(
        `Importar álbum compartilhado (${n} figurinhas)? ` +
          'Isso substitui o álbum atual neste aparelho.',
      )
    ) {
      setState({ collected: incoming });
      showToast('Álbum importado');
    }
  }, []);

  const share = async () => {
    const url = buildShareUrl(state.collected);
    try {
      await navigator.clipboard.writeText(url);
      showToast('Link copiado');
    } catch {
      window.prompt('Copie o link do álbum:', url);
    }
  };

  const onTap = (id: string) =>
    setState((s) => {
      const c = { ...s.collected };
      if ((c[id] || 0) > 0) delete c[id];
      else c[id] = 1;
      return { ...s, collected: c };
    });
  const onLong = (id: string) =>
    setState((s) => {
      const c = { ...s.collected };
      c[id] = Math.min((c[id] || 0) + 1, 9);
      return { ...s, collected: c };
    });
  const handlers = useStickerPress(onTap, onLong);

  const owned = Object.values(state.collected).filter((n) => n > 0).length;
  const pct = owned / TOTAL;

  // search filter
  const q = query.trim().toLowerCase();
  const groupMatch = q.match(/^(?:grupo\s*)?([a-l])$/i);
  const groupLetter = groupMatch ? groupMatch[1].toUpperCase() : null;
  const teamMatches = (team: Team, letter: string) => {
    if (!q) return true;
    if (groupLetter === letter) return true;
    return team.n.toLowerCase().includes(q) || team.c.toLowerCase().includes(q);
  };

  // trade lists
  const missing = useMemo(
    () => getAllIds().filter((id) => !state.collected[id]),
    [state],
  );
  const dups = useMemo(
    () =>
      Object.entries(state.collected)
        .filter(([, n]) => n > 1)
        .map(([id, n]) => ({ id, n: n - 1 })),
    [state],
  );

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: t.bg,
        fontFamily: t.sans,
        color: t.text,
        overflow: 'hidden',
      }}
    >
      {/* header */}
      <div style={{ padding: '20px 20px 16px', borderBottom: `1px solid ${t.line}` }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            marginBottom: 14,
          }}
        >
          <div>
            <div
              style={{
                fontFamily: t.sans,
                fontSize: 13,
                color: t.textDim,
                textTransform: 'uppercase',
                letterSpacing: 0.8,
              }}
            >
              Mundial 2026
            </div>
            <h1
              style={{
                fontFamily: t.sans,
                fontSize: 24,
                lineHeight: 1.2,
                margin: '4px 0 0',
                fontWeight: 500,
                color: t.text,
              }}
            >
              Álbum de figurinhas
            </h1>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div
              style={{
                fontFamily: t.mono,
                fontSize: 28,
                lineHeight: 1,
                color: t.text,
                fontWeight: 500,
              }}
            >
              {owned}
              <span style={{ color: t.textDim, fontSize: 16 }}>/{TOTAL}</span>
            </div>
            <div
              style={{
                fontFamily: t.sans,
                fontSize: 12,
                color: t.textDim,
                marginTop: 4,
              }}
            >
              {Math.round(pct * 100)}% completo
            </div>
          </div>
        </div>
        <ProgressBar value={pct} />
      </div>

      {/* tabs */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${t.line}` }}>
        {(
          [
            ['album', 'Álbum'],
            ['troca', 'Trocas'],
          ] as const
        ).map(([k, label]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            style={{
              flex: 1,
              padding: '14px 0',
              background: 'none',
              border: 'none',
              fontFamily: t.sans,
              fontSize: 14,
              fontWeight: tab === k ? 500 : 400,
              color: tab === k ? t.text : t.textDim,
              borderBottom: tab === k ? `2px solid ${t.accent}` : '2px solid transparent',
              marginBottom: -1,
              cursor: 'pointer',
              transition: 'color .2s',
            }}
          >
            {label}
            {k === 'troca' && dups.length > 0 && (
              <span
                style={{
                  marginLeft: 6,
                  fontFamily: t.mono,
                  fontSize: 11,
                  background: t.accentBg,
                  color: t.accent,
                  padding: '2px 6px',
                  borderRadius: 6,
                  fontWeight: 500,
                }}
              >
                {dups.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* scrolling content */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
        {tab === 'album' && (
          <div style={{ padding: '16px 16px 80px' }}>
            {/* search */}
            <div style={{ position: 'relative', marginBottom: 10 }}>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar país, sigla ou grupo…"
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '12px 34px 12px 14px',
                  background: t.surface,
                  border: `1px solid ${t.line}`,
                  borderRadius: 8,
                  fontFamily: t.sans,
                  fontSize: 15,
                  color: t.text,
                  outline: 'none',
                  transition: 'border .2s',
                }}
                onFocus={(e) => (e.target.style.borderColor = t.accent)}
                onBlur={(e) => (e.target.style.borderColor = t.line)}
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  style={{
                    position: 'absolute',
                    right: 8,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: t.textDim,
                    fontSize: 20,
                    padding: '4px 8px',
                    cursor: 'pointer',
                  }}
                >
                  ×
                </button>
              )}
            </div>

            <div
              style={{
                fontFamily: t.sans,
                fontSize: 12,
                color: t.textSoft,
                textAlign: 'center',
                padding: '4px 0 12px',
              }}
            >
              Toque para marcar · Segure para adicionar repetida
            </div>

            {/* capa */}
            {!q && (
              <SpecialSection
                title="Capa"
                kicker="Abertura · 1 figurinha"
                ids={['00']}
                collected={state.collected}
                handlers={handlers}
              />
            )}

            {/* FWC */}
            {!q && (
              <SpecialSection
                title="Páginas oficiais"
                kicker={`FWC · 1—${FWC_COUNT}`}
                ids={Array.from({ length: FWC_COUNT }, (_, i) => `FWC ${i + 1}`)}
                collected={state.collected}
                handlers={handlers}
              />
            )}

            {/* groups */}
            {Object.entries(GROUPS).map(([letter, teams]) => {
              const visible = teams.filter((team) => teamMatches(team, letter));
              if (visible.length === 0) return null;
              return (
                <div key={letter}>
                  <GroupHeader
                    letter={letter}
                    teams={teams}
                    collected={state.collected}
                    death={letter === 'I'}
                  />
                  {visible.map((team) => (
                    <TeamCard
                      key={team.c}
                      team={team}
                      collected={state.collected}
                      handlers={handlers}
                    />
                  ))}
                </div>
              );
            })}

            {/* CC */}
            {!q && (
              <SpecialSection
                title="Seção Final"
                kicker={`CC · 1—${CC_COUNT}`}
                ids={Array.from({ length: CC_COUNT }, (_, i) => `CC ${i + 1}`)}
                collected={state.collected}
                handlers={handlers}
              />
            )}

            {q &&
              Object.entries(GROUPS).every(
                ([letter, teams]) =>
                  teams.filter((team) => teamMatches(team, letter)).length === 0,
              ) && (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '60px 20px',
                    color: t.textDim,
                    fontSize: 14,
                  }}
                >
                  Nenhum resultado.
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
            share={share}
          />
        )}
      </div>

      {/* toast */}
      <div
        style={{
          position: 'absolute',
          bottom: 28,
          left: '50%',
          transform: `translateX(-50%) translateY(${toast ? 0 : 90}px)`,
          background: t.surface2,
          color: t.text,
          padding: '10px 18px',
          borderRadius: 8,
          fontSize: 14,
          opacity: toast ? 1 : 0,
          transition: 'all .25s',
          pointerEvents: 'none',
          whiteSpace: 'nowrap',
          boxShadow: '0 8px 32px rgba(0,0,0,.4)',
          border: `1px solid ${t.line}`,
        } as CSSProperties}
      >
        {toast}
      </div>
    </div>
  );
}
