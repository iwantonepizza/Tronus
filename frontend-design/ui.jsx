
// UI Components — exported to window
// FactionBadge, PlayerPill, StatTile, WinrateBar, MatchCard, EmptyState, LoadingSkeleton, AvatarCircle

(function() {
'use strict';

const { useState, useEffect, useRef } = React;
const { FACTIONS } = window.GOT;

// ── Faction sigil SVGs (abstract, non-copyrighted) ──────────────────────────
const SIGILS = {
  stark:     <svg viewBox="0 0 40 40" fill="currentColor"><path d="M20 4 L24 14 L35 14 L26 21 L29 32 L20 25 L11 32 L14 21 L5 14 L16 14 Z" opacity="0.9"/></svg>,
  lannister: <svg viewBox="0 0 40 40" fill="currentColor"><ellipse cx="20" cy="18" rx="10" ry="8"/><path d="M12 22 Q8 30 12 34 Q20 38 28 34 Q32 30 28 22"/><path d="M16 10 L14 4 M24 10 L26 4" strokeWidth="2" stroke="currentColor" fill="none"/></svg>,
  baratheon: <svg viewBox="0 0 40 40" fill="currentColor"><path d="M20 6 L22 12 L28 10 L24 16 L30 18 L24 20 L28 26 L22 24 L20 30 L18 24 L12 26 L16 20 L10 18 L16 16 L12 10 L18 12 Z"/></svg>,
  greyjoy:   <svg viewBox="0 0 40 40" fill="currentColor"><circle cx="20" cy="16" r="6"/><path d="M20 22 L14 36 M20 22 L20 36 M20 22 L26 36 M20 22 L10 32 M20 22 L30 32"/></svg>,
  tyrell:    <svg viewBox="0 0 40 40" fill="currentColor"><circle cx="20" cy="20" r="4"/><path d="M20 4 Q24 10 20 16 Q16 10 20 4M36 20 Q30 24 24 20 Q30 16 36 20M20 36 Q16 30 20 24 Q24 30 20 36M4 20 Q10 16 16 20 Q10 24 4 20M8 8 Q14 12 12 18 Q8 14 8 8M32 8 Q32 14 28 18 Q26 12 32 8M32 32 Q26 28 28 22 Q32 26 32 32M8 32 Q8 26 12 22 Q14 28 8 32"/></svg>,
  martell:   <svg viewBox="0 0 40 40" fill="currentColor"><circle cx="20" cy="20" r="10" fillOpacity="0.3" stroke="currentColor" strokeWidth="2" fill="none"/><path d="M20 4 L20 16 M30 10 L22 16 M34 20 L22 20 M30 30 L22 24 M20 36 L20 24 M10 30 L18 24 M6 20 L18 20 M10 10 L18 16" stroke="currentColor" strokeWidth="2.5" fill="none"/></svg>,
  tully:     <svg viewBox="0 0 40 40" fill="currentColor"><path d="M6 20 Q10 10 20 8 Q30 10 34 20 Q30 32 20 34 Q10 32 6 20Z" fillOpacity="0.3" stroke="currentColor" strokeWidth="2"/><path d="M10 20 Q15 14 20 18 Q25 22 30 20"/></svg>,
  arryn:     <svg viewBox="0 0 40 40" fill="currentColor"><path d="M20 4 L28 20 L36 16 L24 30 L28 38 L20 32 L12 38 L16 30 L4 16 L12 20 Z"/></svg>,
  targaryen: <svg viewBox="0 0 40 40" fill="currentColor"><path d="M20 6 L26 18 L38 14 L28 24 L34 36 L20 28 L6 36 L12 24 L2 14 L14 18 Z" opacity="0.8"/><circle cx="20" cy="20" r="4" fill="currentColor"/></svg>,
};

// ── AvatarCircle ─────────────────────────────────────────────────────────────
function AvatarCircle({ user, faction, size = 40, showRing = true }) {
  const factionData = faction ? FACTIONS[faction] : (user.favoriteFaction ? FACTIONS[user.favoriteFaction] : null);
  const ringColor = factionData?.color || '#C9A44C';
  const initials = user.nickname.slice(0, 2).toUpperCase();
  const fontSize = size * 0.36;
  const ringWidth = Math.max(2, size * 0.07);

  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: `linear-gradient(135deg, #1F1F2A 0%, #2A2A36 100%)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      border: showRing ? `${ringWidth}px solid ${ringColor}` : 'none',
      color: ringColor, fontWeight: 700, fontSize,
      fontFamily: "'JetBrains Mono', monospace", position: 'relative',
      boxShadow: showRing ? `0 0 12px ${ringColor}40` : 'none',
    }}>
      {initials}
    </div>
  );
}

// ── FactionBadge ─────────────────────────────────────────────────────────────
function FactionBadge({ factionSlug, size = 'md', showLabel = false }) {
  const f = FACTIONS[factionSlug];
  if (!f) return null;
  const sizes = { sm: 20, md: 28, lg: 40, xl: 64 };
  const px = sizes[size] || 28;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <span style={{
        width: px, height: px, borderRadius: '50%',
        background: f.color + '22', color: f.color,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        border: `1.5px solid ${f.color}55`, flexShrink: 0,
      }}>
        <span style={{ width: px * 0.6, height: px * 0.6, display: 'flex' }}>{SIGILS[factionSlug]}</span>
      </span>
      {showLabel && <span style={{ color: f.color, fontSize: 13, fontWeight: 500 }}>{f.name}</span>}
    </span>
  );
}

// ── PlayerPill ───────────────────────────────────────────────────────────────
function PlayerPill({ user, faction, size = 'md', onClick }) {
  const f = faction ? FACTIONS[faction] : null;
  const avatarSize = size === 'sm' ? 22 : size === 'lg' ? 36 : 28;
  return (
    <span
      onClick={onClick}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        background: '#1F1F2A', borderRadius: 100,
        padding: size === 'sm' ? '2px 8px 2px 2px' : '4px 12px 4px 4px',
        border: `1px solid ${f ? f.color + '44' : '#2A2A36'}`,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'border-color 0.2s',
      }}
    >
      <AvatarCircle user={user} faction={faction} size={avatarSize} />
      <span style={{ color: '#F0E6D2', fontSize: size === 'sm' ? 12 : 14, fontWeight: 500 }}>{user.nickname}</span>
      {faction && <FactionBadge factionSlug={faction} size="sm" />}
    </span>
  );
}

// ── StatTile ─────────────────────────────────────────────────────────────────
function StatTile({ label, value, icon, sub, accent, large }) {
  const [displayed, setDisplayed] = useState(0);
  const ref = useRef(null);
  const numVal = typeof value === 'number' ? value : parseFloat(value);
  const isNum = !isNaN(numVal);

  useEffect(() => {
    if (!isNum) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        let start = 0;
        const dur = 600;
        const step = (ts) => {
          if (!start) start = ts;
          const prog = Math.min((ts - start) / dur, 1);
          const ease = 1 - Math.pow(1 - prog, 3);
          setDisplayed(numVal * ease);
          if (prog < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
        obs.disconnect();
      }
    }, { threshold: 0.3 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [numVal]);

  const displayVal = isNum
    ? (numVal % 1 !== 0 ? (displayed).toFixed(1) : Math.round(displayed))
    : value;

  return (
    <div ref={ref} style={{
      background: '#17171F', borderRadius: 12, padding: '20px 24px',
      border: `1px solid #2A2A36`, display: 'flex', flexDirection: 'column', gap: 8,
      transition: 'border-color 0.2s, transform 0.15s, box-shadow 0.15s',
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = '#C9A44C44'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 40px -10px rgba(0,0,0,0.6)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = '#2A2A36'; e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
    >
      {icon && <span style={{ fontSize: 20 }}>{icon}</span>}
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: large ? 48 : 32, fontWeight: 700, color: accent || '#C9A44C', lineHeight: 1 }}>
        {isNum && numVal <= 1 && numVal > 0 && numVal % 1 !== 0
          ? `${Math.round(displayed * 100)}%`
          : displayVal}
      </div>
      <div style={{ color: '#A8A8B3', fontSize: 13, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</div>
      {sub && <div style={{ color: '#6B6B75', fontSize: 12 }}>{sub}</div>}
    </div>
  );
}

// ── WinrateBar ───────────────────────────────────────────────────────────────
function WinrateBar({ faction, value, max = 1 }) {
  const f = FACTIONS[faction?.slug || faction];
  const pct = Math.round((value / max) * 100);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <FactionBadge factionSlug={faction?.slug || faction} size="sm" />
      <span style={{ color: '#A8A8B3', fontSize: 13, width: 90, flexShrink: 0 }}>{f?.name}</span>
      <div style={{ flex: 1, background: '#1F1F2A', borderRadius: 4, height: 8, overflow: 'hidden' }}>
        <div style={{
          width: `${pct}%`, height: '100%', borderRadius: 4,
          background: f?.color || '#C9A44C',
          transition: 'width 0.8s cubic-bezier(0.16,1,0.3,1)',
        }}/>
      </div>
      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: '#F0E6D2', width: 36, textAlign: 'right' }}>{pct}%</span>
    </div>
  );
}

// ── MatchCard ────────────────────────────────────────────────────────────────
function MatchCard({ match, onClick, compact }) {
  const winner = match.participations.find(p => p.isWinner);
  const winnerFaction = winner ? FACTIONS[winner.faction] : null;
  const statusColors = { completed: '#4F7D4F', planned: '#C9A44C', cancelled: '#6B6B75' };
  const statusLabels = { completed: 'Сыграна', planned: 'Запланирована', cancelled: 'Отменена' };
  const modeEmoji = { classic: '⚔️', quests: '📜', alternative: '🔀', dragons: '🐉' };

  const date = new Date(match.scheduledAt);
  const dateStr = date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div
      onClick={() => onClick && onClick(match.id)}
      style={{
        background: '#17171F', borderRadius: 12, padding: compact ? '12px 16px' : '16px 20px',
        border: `1px solid #2A2A36`,
        borderLeft: winnerFaction ? `3px solid ${winnerFaction.color}` : '1px solid #2A2A36',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.15s, box-shadow 0.15s, border-color 0.15s',
      }}
      onMouseEnter={e => { if(onClick){ e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 10px 40px -10px rgba(0,0,0,0.6)'; }}}
      onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow=''; }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ color: '#6B6B75', fontSize: 11, fontFamily: "'JetBrains Mono',monospace" }}>#{match.id}</span>
            <span style={{ background: statusColors[match.status] + '22', color: statusColors[match.status], fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 100, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              {statusLabels[match.status]}
            </span>
          </div>
          <div style={{ color: '#F0E6D2', fontSize: compact ? 13 : 15, fontWeight: 600 }}>{dateStr}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ color: '#A8A8B3', fontSize: 12 }}>{modeEmoji[match.mode.slug]} {match.mode.name}</div>
          {match.outcome && <div style={{ color: '#6B6B75', fontSize: 11, fontFamily: "'JetBrains Mono',monospace" }}>{match.outcome.roundsPlayed} раундов</div>}
        </div>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {match.participations.map(part => (
          <div key={part.id} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <AvatarCircle user={part.user} faction={part.faction} size={compact ? 22 : 28} />
            {!compact && part.place && <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: part.place === 1 ? '#C9A44C' : '#A8A8B3', fontWeight: part.place === 1 ? 700 : 400 }}>#{part.place}</span>}
          </div>
        ))}
      </div>
      {winner && !compact && (
        <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 6, color: '#C9A44C', fontSize: 12 }}>
          <span>👑</span>
          <span>{winner.user.nickname}</span>
          <FactionBadge factionSlug={winner.faction} size="sm" showLabel />
        </div>
      )}
    </div>
  );
}

// ── PlacementRow ─────────────────────────────────────────────────────────────
function PlacementRow({ participation, rank, onClick }) {
  const f = FACTIONS[participation.faction];
  const isFirst = rank === 1;
  return (
    <div
      onClick={() => onClick && onClick(participation.user.id)}
      style={{
        display: 'flex', alignItems: 'center', gap: 16, padding: '14px 20px',
        borderRadius: 10, cursor: onClick ? 'pointer' : 'default',
        background: isFirst ? 'linear-gradient(90deg, #C9A44C14 0%, transparent 100%)' : 'transparent',
        borderLeft: `3px solid ${f.color}`,
        transition: 'background 0.2s',
        marginBottom: 4,
      }}
      onMouseEnter={e => { e.currentTarget.style.background = isFirst ? `linear-gradient(90deg, #C9A44C20 0%, transparent 100%)` : '#1F1F2A'; }}
      onMouseLeave={e => { e.currentTarget.style.background = isFirst ? `linear-gradient(90deg, #C9A44C14 0%, transparent 100%)` : 'transparent'; }}
    >
      <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 24, fontWeight: 700, color: isFirst ? '#C9A44C' : '#6B6B75', width: 32, textAlign: 'center' }}>
        {isFirst ? '👑' : rank}
      </div>
      <AvatarCircle user={participation.user} faction={participation.faction} size={44} />
      <div style={{ flex: 1 }}>
        <div style={{ color: '#F0E6D2', fontWeight: 600, fontSize: 15 }}>{participation.user.nickname}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
          <FactionBadge factionSlug={participation.faction} size="sm" showLabel />
        </div>
      </div>
      {participation.castles != null && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#A8A8B3' }}>
          <span style={{ fontSize: 14 }}>🏰</span>
          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 18, fontWeight: 600, color: '#F0E6D2' }}>{participation.castles}</span>
        </div>
      )}
    </div>
  );
}

// ── EmptyState ────────────────────────────────────────────────────────────────
function EmptyState({ icon = '🗡️', title, description, cta }) {
  return (
    <div style={{ textAlign: 'center', padding: '60px 24px', color: '#6B6B75' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>{icon}</div>
      <div style={{ color: '#A8A8B3', fontSize: 18, fontWeight: 600, marginBottom: 8 }}>{title}</div>
      {description && <div style={{ fontSize: 14, marginBottom: 24 }}>{description}</div>}
      {cta && (
        <button onClick={cta.onClick} style={{ background: '#C9A44C', color: '#0E0E12', border: 'none', borderRadius: 8, padding: '10px 24px', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
          {cta.label}
        </button>
      )}
    </div>
  );
}

// ── LoadingSkeleton ──────────────────────────────────────────────────────────
function LoadingSkeleton({ variant = 'card', count = 3 }) {
  const shimmer = {
    background: 'linear-gradient(90deg, #17171F 25%, #1F1F2A 50%, #17171F 75%)',
    backgroundSize: '400% 100%',
    animation: 'shimmer 1.5s infinite',
    borderRadius: 8,
  };
  const items = Array.from({ length: count });
  if (variant === 'card') return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {items.map((_, i) => (
        <div key={i} style={{ background: '#17171F', borderRadius: 12, padding: 20, border: '1px solid #2A2A36' }}>
          <div style={{ ...shimmer, height: 16, width: '60%', marginBottom: 12 }}/>
          <div style={{ ...shimmer, height: 12, width: '40%' }}/>
        </div>
      ))}
    </div>
  );
  if (variant === 'tile') return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 16 }}>
      {items.map((_, i) => <div key={i} style={{ ...shimmer, height: 100, borderRadius: 12 }}/>)}
    </div>
  );
  return null;
}

// ── LeaderboardRow ───────────────────────────────────────────────────────────
function LeaderboardRow({ rank, user, metricValue, metricLabel, faction, onClick }) {
  const medals = { 1: '🥇', 2: '🥈', 3: '🥉' };
  const bgColors = { 1: '#C9A44C12', 2: '#A8A8B312', 3: '#C9753A12' };
  const f = faction ? FACTIONS[faction] : null;

  const formatValue = (v, label) => {
    if (label === 'Винрейт' || label === 'Win%') return `${Math.round(v * 100)}%`;
    if (typeof v === 'number' && v % 1 !== 0) return v.toFixed(1);
    return v;
  };

  return (
    <div
      onClick={() => onClick && onClick(user.id)}
      style={{
        display: 'flex', alignItems: 'center', gap: 16, padding: '12px 20px',
        borderRadius: 10, cursor: onClick ? 'pointer' : 'default',
        background: bgColors[rank] || 'transparent',
        border: rank <= 3 ? `1px solid ${rank === 1 ? '#C9A44C' : rank === 2 ? '#A8A8B3' : '#C9753A'}33` : '1px solid transparent',
        transition: 'background 0.2s',
        marginBottom: 4,
      }}
      onMouseEnter={e => { e.currentTarget.style.background = '#1F1F2A'; }}
      onMouseLeave={e => { e.currentTarget.style.background = bgColors[rank] || 'transparent'; }}
    >
      <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 20, width: 32, textAlign: 'center' }}>
        {medals[rank] || <span style={{ color: '#6B6B75', fontSize: 14 }}>{rank}</span>}
      </div>
      <AvatarCircle user={user} faction={faction} size={40} />
      <div style={{ flex: 1 }}>
        <div style={{ color: '#F0E6D2', fontWeight: 600 }}>{user.nickname}</div>
        {faction && <FactionBadge factionSlug={faction} size="sm" showLabel />}
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 24, fontWeight: 700, color: rank <= 3 ? '#C9A44C' : '#F0E6D2' }}>
          {formatValue(metricValue, metricLabel)}
        </div>
        <div style={{ color: '#6B6B75', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{metricLabel}</div>
      </div>
    </div>
  );
}

// ── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ message, type = 'info', onClose }) {
  const colors = { info: '#4B6FA5', success: '#4F7D4F', error: '#B73E3E', warning: '#D9883E' };
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, []);
  return (
    <div style={{
      position: 'fixed', bottom: 80, right: 24, zIndex: 9999,
      background: '#1F1F2A', border: `1px solid ${colors[type]}`,
      borderRadius: 10, padding: '12px 20px', color: '#F0E6D2', fontSize: 14,
      boxShadow: '0 10px 40px rgba(0,0,0,0.6)',
      animation: 'slideInRight 0.3s ease-out',
    }}>
      {message}
    </div>
  );
}

// ── NumberStepper ─────────────────────────────────────────────────────────────
function NumberStepper({ value, onChange, min = 0, max = 15, icon = '🏰' }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ fontSize: 18 }}>{icon}</span>
      <button onClick={() => onChange(Math.max(min, value - 1))} style={{ width: 32, height: 32, borderRadius: 6, background: '#2A2A36', border: '1px solid #3A3A46', color: '#F0E6D2', cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
      <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 20, fontWeight: 700, color: '#F0E6D2', width: 32, textAlign: 'center' }}>{value}</span>
      <button onClick={() => onChange(Math.min(max, value + 1))} style={{ width: 32, height: 32, borderRadius: 6, background: '#2A2A36', border: '1px solid #3A3A46', color: '#F0E6D2', cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
    </div>
  );
}

// Export
Object.assign(window, {
  AvatarCircle, FactionBadge, PlayerPill, StatTile, WinrateBar,
  MatchCard, PlacementRow, EmptyState, LoadingSkeleton,
  LeaderboardRow, Toast, NumberStepper, SIGILS,
});
})();
