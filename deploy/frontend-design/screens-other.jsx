
// Screens: Factions Overview, Faction Detail, Login, Register, Create Session, Finalize, My Profile
(function() {
'use strict';
const { useState, useEffect, useRef } = React;
const { FACTIONS, MODES, DECKS, PLAYERS, SESSIONS, computeFactionStats } = window.GOT;
const { AvatarCircle, FactionBadge, StatTile, EmptyState, NumberStepper, SIGILS } = window;

// ── BAR CHART (pure SVG/div) ─────────────────────────────────────────────────
function BarChart({ data, color }) {
  const max = Math.max(...data.map(d => d.value), 0.01);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 120, padding: '0 4px' }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: '#A8A8B3' }}>{Math.round(d.value * 100)}%</span>
          <div style={{ width: '100%', background: '#1F1F2A', borderRadius: '4px 4px 0 0', display: 'flex', alignItems: 'flex-end', height: 80 }}>
            <div style={{ width: '100%', background: color, borderRadius: '4px 4px 0 0', height: `${(d.value / max) * 100}%`, transition: 'height 0.8s cubic-bezier(0.16,1,0.3,1)' }}/>
          </div>
          <span style={{ color: '#6B6B75', fontSize: 10, textAlign: 'center', lineHeight: 1.2 }}>{d.label}</span>
        </div>
      ))}
    </div>
  );
}

// ── FACTIONS OVERVIEW ────────────────────────────────────────────────────────
function FactionsScreen({ navigate }) {
  const [hovered, setHovered] = useState(null);

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto' }}>
      <h1 style={{ fontFamily: "'Cinzel',serif", fontSize: 28, color: '#F0E6D2', marginBottom: 8 }}>🐉 Фракции</h1>
      <p style={{ color: '#A8A8B3', marginBottom: 32, fontSize: 14 }}>Метагейм — кто правит Вестеросом на нашем столе</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
        {Object.values(FACTIONS).map(faction => {
          const stats = computeFactionStats(faction.slug);
          const isHov = hovered === faction.slug;
          return (
            <button
              key={faction.slug}
              onClick={() => navigate('faction', { slug: faction.slug })}
              onMouseEnter={() => setHovered(faction.slug)}
              onMouseLeave={() => setHovered(null)}
              style={{
                background: `linear-gradient(145deg, ${faction.color}22 0%, #0E0E12 80%)`,
                border: `1px solid ${isHov ? faction.color + '88' : faction.color + '33'}`,
                borderRadius: 16, padding: '28px 24px', cursor: 'pointer', textAlign: 'left',
                transform: isHov ? 'translateY(-4px)' : 'none',
                boxShadow: isHov ? `0 20px 60px ${faction.color}22` : 'none',
                transition: 'all 0.2s ease-out', position: 'relative', overflow: 'hidden',
              }}
            >
              {/* Background sigil */}
              <div style={{
                position: 'absolute', right: -10, top: -10, width: 100, height: 100,
                color: faction.color, opacity: isHov ? 0.2 : 0.1,
                transform: isHov ? 'scale(1.1)' : 'scale(1)', transition: 'all 0.3s',
              }}>
                {SIGILS[faction.slug]}
              </div>

              <div style={{ position: 'relative' }}>
                {/* Sigil + name */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                  <div style={{ width: 52, height: 52, borderRadius: '50%', background: faction.color + '22', border: `2px solid ${faction.color}66`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: faction.color }}>
                    <div style={{ width: 30, height: 30 }}>{SIGILS[faction.slug]}</div>
                  </div>
                  <h3 style={{ fontFamily: "'Cinzel',serif", color: '#F0E6D2', fontSize: 18, fontWeight: 700, margin: 0 }}>{faction.name}</h3>
                </div>

                {/* Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                  {[
                    { label: 'Партий', val: stats.totalGames },
                    { label: 'Побед', val: stats.wins },
                    { label: 'WR', val: `${Math.round(stats.winrate * 100)}%` },
                  ].map(s => (
                    <div key={s.label} style={{ background: '#0E0E1288', borderRadius: 8, padding: '10px 8px', textAlign: 'center' }}>
                      <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 20, fontWeight: 700, color: faction.color }}>{s.val}</div>
                      <div style={{ color: '#6B6B75', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2 }}>{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── FACTION DETAIL ────────────────────────────────────────────────────────────
function FactionDetailScreen({ factionSlug, navigate }) {
  const faction = FACTIONS[factionSlug];
  const stats = computeFactionStats(factionSlug);

  const modeLabels = { classic: 'Классика', quests: 'Квесты', alternative: 'Альтернатива', dragons: 'Драконы' };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <button onClick={() => navigate('factions')} style={{ background: 'none', border: 'none', color: '#C9A44C', cursor: 'pointer', fontSize: 13, marginBottom: 16, padding: 0 }}>← Все фракции</button>

      {/* Hero */}
      <div style={{
        background: `linear-gradient(135deg, ${faction.color}33 0%, #0E0E12 60%)`,
        borderRadius: 20, padding: '40px 36px', marginBottom: 28,
        border: `1px solid ${faction.color}44`,
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', right: 20, top: 20, width: 160, height: 160, color: faction.color, opacity: 0.12 }}>
          {SIGILS[factionSlug]}
        </div>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 24 }}>
          <div style={{ width: 88, height: 88, borderRadius: '50%', background: faction.color + '22', border: `3px solid ${faction.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: faction.color, flexShrink: 0 }}>
            <div style={{ width: 52, height: 52 }}>{SIGILS[factionSlug]}</div>
          </div>
          <div>
            <h1 style={{ fontFamily: "'Cinzel',serif", fontSize: 36, color: '#F0E6D2', margin: '0 0 8px', fontWeight: 700 }}>{faction.name}</h1>
            <div style={{ display: 'flex', gap: 16, color: '#A8A8B3', fontSize: 14 }}>
              <span>{stats.totalGames} партий</span>
              <span>•</span>
              <span>{stats.wins} побед</span>
              <span>•</span>
              <span style={{ color: faction.color, fontWeight: 600 }}>{Math.round(stats.winrate * 100)}% WR</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stat tiles */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 16, marginBottom: 28 }}>
        <StatTile label="Всего партий" value={stats.totalGames} icon="⚔️" accent={faction.color} />
        <StatTile label="Побед" value={stats.wins} icon="👑" accent={faction.color} />
        <StatTile label="Винрейт" value={stats.winrate} icon="%" accent={faction.color} />
        <StatTile label="Ср. место" value={stats.avgPlace} icon="📍" accent={faction.color} />
        <StatTile label="Ср. замков" value={stats.avgCastles} icon="🏰" accent={faction.color} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
        {/* By mode */}
        {stats.byMode.length > 0 && (
          <div style={{ background: '#17171F', borderRadius: 12, padding: '24px', border: '1px solid #2A2A36' }}>
            <h3 style={{ fontFamily: "'Cinzel',serif", fontSize: 15, color: '#F0E6D2', margin: '0 0 20px' }}>Винрейт по режимам</h3>
            <BarChart
              color={faction.color}
              data={stats.byMode.map(bm => ({ label: modeLabels[bm.mode] || bm.mode, value: bm.winrate }))}
            />
          </div>
        )}

        {/* Top players */}
        {stats.topPlayers.length > 0 && (
          <div style={{ background: '#17171F', borderRadius: 12, padding: '24px', border: '1px solid #2A2A36' }}>
            <h3 style={{ fontFamily: "'Cinzel',serif", fontSize: 15, color: '#F0E6D2', margin: '0 0 16px' }}>Лучшие игроки</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {stats.topPlayers.map((tp, i) => (
                <button key={tp.user.id} onClick={() => navigate('profile', { id: tp.user.id })} style={{
                  display: 'flex', alignItems: 'center', gap: 12, background: 'none',
                  border: 'none', cursor: 'pointer', textAlign: 'left', padding: '8px 12px',
                  borderRadius: 8, borderLeft: `3px solid ${faction.color}`,
                  transition: 'background 0.15s',
                }}
                  onMouseEnter={e => e.currentTarget.style.background = '#1F1F2A'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}
                >
                  <span style={{ fontFamily: "'JetBrains Mono',monospace", color: '#6B6B75', fontSize: 14, width: 20 }}>#{i + 1}</span>
                  <AvatarCircle user={tp.user} faction={factionSlug} size={36} />
                  <div style={{ flex: 1 }}>
                    <div style={{ color: '#F0E6D2', fontWeight: 600 }}>{tp.user.nickname}</div>
                    <div style={{ color: '#6B6B75', fontSize: 12 }}>{tp.games} партий</div>
                  </div>
                  <span style={{ fontFamily: "'JetBrains Mono',monospace", color: faction.color, fontWeight: 700 }}>{Math.round(tp.winrate * 100)}%</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── LOGIN ────────────────────────────────────────────────────────────────────
function LoginScreen({ navigate }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    if (!email || !password) { setError('Заполните все поля'); return; }
    navigate('home');
  }

  const inputStyle = {
    width: '100%', background: '#17171F', border: '1px solid #2A2A36',
    borderRadius: 10, padding: '12px 16px', color: '#F0E6D2', fontSize: 15,
    outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s',
  };

  return (
    <div style={{ minHeight: 'calc(100vh - 64px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      {/* BG pattern */}
      <div style={{ position: 'fixed', inset: 0, opacity: 0.04, pointerEvents: 'none', display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 20, padding: 20 }}>
        {Object.values(FACTIONS).concat(Object.values(FACTIONS)).map((f, i) => (
          <div key={i} style={{ color: f.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 40, height: 40 }}>{SIGILS[f.slug]}</div>
          </div>
        ))}
      </div>

      <div style={{ background: '#17171F', borderRadius: 20, padding: '40px', border: '1px solid #2A2A36', width: '100%', maxWidth: 420, position: 'relative', boxShadow: '0 40px 80px rgba(0,0,0,0.8)' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>⚜️</div>
          <h1 style={{ fontFamily: "'Cinzel',serif", fontSize: 24, color: '#F0E6D2', margin: '0 0 8px' }}>Войти</h1>
          <p style={{ color: '#6B6B75', fontSize: 14, margin: 0 }}>Доступ к трекеру партий</p>
        </div>

        {error && <div style={{ background: '#B73E3E22', border: '1px solid #B73E3E44', borderRadius: 8, padding: '10px 16px', color: '#B73E3E', fontSize: 13, marginBottom: 16 }}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ color: '#A8A8B3', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>Email</label>
            <input style={inputStyle} type="email" placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)}
              onFocus={e => e.target.style.borderColor = '#C9A44C66'} onBlur={e => e.target.style.borderColor = '#2A2A36'} />
          </div>
          <div>
            <label style={{ color: '#A8A8B3', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>Пароль</label>
            <input style={inputStyle} type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)}
              onFocus={e => e.target.style.borderColor = '#C9A44C66'} onBlur={e => e.target.style.borderColor = '#2A2A36'} />
          </div>
          <button type="submit" style={{ background: '#C9A44C', color: '#0E0E12', border: 'none', borderRadius: 10, padding: '14px', fontWeight: 700, fontSize: 16, cursor: 'pointer', marginTop: 8 }}>
            Войти
          </button>
        </form>
        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <button onClick={() => navigate('register')} style={{ background: 'none', border: 'none', color: '#C9A44C', cursor: 'pointer', fontSize: 14 }}>
            Нет аккаунта? Зарегистрироваться
          </button>
        </div>
      </div>
    </div>
  );
}

// ── REGISTER ─────────────────────────────────────────────────────────────────
function RegisterScreen({ navigate }) {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', nickname: '' });

  const inputStyle = { width: '100%', background: '#17171F', border: '1px solid #2A2A36', borderRadius: 10, padding: '12px 16px', color: '#F0E6D2', fontSize: 15, outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' };

  if (submitted) return (
    <div style={{ minHeight: 'calc(100vh - 64px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: '#17171F', borderRadius: 20, padding: '48px', border: '1px solid #2A2A36', maxWidth: 420, textAlign: 'center', boxShadow: '0 40px 80px rgba(0,0,0,0.8)' }}>
        <div style={{ fontSize: 64, marginBottom: 24 }}>⏳</div>
        <h2 style={{ fontFamily: "'Cinzel',serif", fontSize: 24, color: '#F0E6D2', marginBottom: 12 }}>Заявка отправлена</h2>
        <p style={{ color: '#A8A8B3', fontSize: 14, lineHeight: 1.6 }}>
          Когда владелец апрувит вашу заявку, вы получите доступ к трекеру. Обычно это занимает меньше суток.
        </p>
        <button onClick={() => navigate('login')} style={{ marginTop: 24, background: 'none', border: '1px solid #3A3A46', borderRadius: 8, padding: '10px 24px', color: '#A8A8B3', cursor: 'pointer', fontSize: 14 }}>
          На страницу входа
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: 'calc(100vh - 64px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: '#17171F', borderRadius: 20, padding: '40px', border: '1px solid #2A2A36', width: '100%', maxWidth: 420, boxShadow: '0 40px 80px rgba(0,0,0,0.8)' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>⚜️</div>
          <h1 style={{ fontFamily: "'Cinzel',serif", fontSize: 24, color: '#F0E6D2', margin: '0 0 8px' }}>Регистрация</h1>
          <p style={{ color: '#6B6B75', fontSize: 13, margin: 0 }}>Заявка будет одобрена владельцем</p>
        </div>
        <form onSubmit={e => { e.preventDefault(); setSubmitted(true); }} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[['nickname', 'Никнейм', 'text', 'IronFist'], ['email', 'Email', 'email', 'your@email.com'], ['password', 'Пароль', 'password', '••••••••']].map(([key, label, type, ph]) => (
            <div key={key}>
              <label style={{ color: '#A8A8B3', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>{label}</label>
              <input style={inputStyle} type={type} placeholder={ph} value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })}
                onFocus={e => e.target.style.borderColor = '#C9A44C66'} onBlur={e => e.target.style.borderColor = '#2A2A36'} />
            </div>
          ))}
          <button type="submit" style={{ background: '#C9A44C', color: '#0E0E12', border: 'none', borderRadius: 10, padding: '14px', fontWeight: 700, fontSize: 16, cursor: 'pointer', marginTop: 8 }}>
            Отправить заявку
          </button>
        </form>
        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <button onClick={() => navigate('login')} style={{ background: 'none', border: 'none', color: '#C9A44C', cursor: 'pointer', fontSize: 14 }}>
            Уже есть аккаунт? Войти
          </button>
        </div>
      </div>
    </div>
  );
}

// ── CREATE SESSION ────────────────────────────────────────────────────────────
function CreateSessionScreen({ navigate }) {
  const [mode, setMode] = useState('plan');
  const [gameMode, setGameMode] = useState('classic');
  const [deck, setDeck] = useState('original');
  const [date, setDate] = useState('2026-04-30');
  const [time, setTime] = useState('19:00');
  const [note, setNote] = useState('');
  const [invited, setInvited] = useState([]);
  const [search, setSearch] = useState('');
  const [factionAssign, setFactionAssign] = useState({});

  const usedFactions = Object.values(factionAssign);
  const available = PLAYERS.filter(p => !invited.some(i => i.id === p.id));
  const filtered = search ? available.filter(p => p.nickname.toLowerCase().includes(search.toLowerCase())) : available;

  const modeCards = [
    { slug: 'classic', name: 'Классика', icon: '⚔️', desc: '3–6 игроков' },
    { slug: 'quests', name: 'Квесты', icon: '📜', desc: '3–6 игроков' },
    { slug: 'alternative', name: 'Альтернатива', icon: '🔀', desc: '3–6 игроков' },
    { slug: 'dragons', name: 'Драконы', icon: '🐉', desc: '3–6 игроков' },
  ];

  const inputStyle = { width: '100%', background: '#17171F', border: '1px solid #2A2A36', borderRadius: 8, padding: '10px 14px', color: '#F0E6D2', fontSize: 14, outline: 'none', boxSizing: 'border-box' };
  const pillStyle = (active) => ({ background: active ? '#C9A44C' : '#17171F', color: active ? '#0E0E12' : '#A8A8B3', border: `1px solid ${active ? '#C9A44C' : '#2A2A36'}`, borderRadius: 100, padding: '6px 20px', cursor: 'pointer', fontSize: 14, fontWeight: active ? 700 : 400, transition: 'all 0.15s' });

  function addPlayer(player) {
    setInvited([...invited, player]);
  }
  function removePlayer(id) {
    setInvited(invited.filter(p => p.id !== id));
    const fa = { ...factionAssign };
    delete fa[id];
    setFactionAssign(fa);
  }

  return (
    <div style={{ maxWidth: 700, margin: '0 auto' }}>
      <h1 style={{ fontFamily: "'Cinzel',serif", fontSize: 28, color: '#F0E6D2', marginBottom: 8 }}>Новая партия</h1>

      {/* Mode switcher */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 32 }}>
        <button style={pillStyle(mode === 'plan')} onClick={() => setMode('plan')}>📅 Запланировать</button>
        <button style={pillStyle(mode === 'record')} onClick={() => setMode('record')}>⚔️ Записать сыгранную</button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Date/time */}
        <div style={{ background: '#17171F', borderRadius: 12, padding: '20px', border: '1px solid #2A2A36' }}>
          <h3 style={{ fontFamily: "'Cinzel',serif", fontSize: 15, color: '#F0E6D2', margin: '0 0 16px' }}>📅 Дата и время</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ color: '#6B6B75', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>Дата</label>
              <input style={inputStyle} type="date" value={date} onChange={e => setDate(e.target.value)} />
            </div>
            <div>
              <label style={{ color: '#6B6B75', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>Время</label>
              <input style={inputStyle} type="time" value={time} onChange={e => setTime(e.target.value)} />
            </div>
          </div>
        </div>

        {/* Game mode */}
        <div style={{ background: '#17171F', borderRadius: 12, padding: '20px', border: '1px solid #2A2A36' }}>
          <h3 style={{ fontFamily: "'Cinzel',serif", fontSize: 15, color: '#F0E6D2', margin: '0 0 16px' }}>🎮 Режим игры</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
            {modeCards.map(m => (
              <button key={m.slug} onClick={() => setGameMode(m.slug)} style={{
                background: gameMode === m.slug ? '#C9A44C14' : '#1F1F2A',
                border: `1.5px solid ${gameMode === m.slug ? '#C9A44C' : '#2A2A36'}`,
                borderRadius: 10, padding: '14px', cursor: 'pointer', textAlign: 'left',
                transform: gameMode === m.slug ? 'scale(1.02)' : 'scale(1)', transition: 'all 0.15s',
              }}>
                <div style={{ fontSize: 24, marginBottom: 4 }}>{m.icon}</div>
                <div style={{ color: gameMode === m.slug ? '#C9A44C' : '#F0E6D2', fontWeight: 600, fontSize: 14 }}>{m.name}</div>
                <div style={{ color: '#6B6B75', fontSize: 12, marginTop: 2 }}>{m.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Deck */}
        <div style={{ background: '#17171F', borderRadius: 12, padding: '20px', border: '1px solid #2A2A36' }}>
          <h3 style={{ fontFamily: "'Cinzel',serif", fontSize: 15, color: '#F0E6D2', margin: '0 0 16px' }}>📖 Колода</h3>
          <div style={{ display: 'flex', gap: 8 }}>
            {Object.values(DECKS).map(d => (
              <button key={d.slug} style={pillStyle(deck === d.slug)} onClick={() => setDeck(d.slug)}>{d.name}</button>
            ))}
          </div>
        </div>

        {/* Players */}
        <div style={{ background: '#17171F', borderRadius: 12, padding: '20px', border: '1px solid #2A2A36' }}>
          <h3 style={{ fontFamily: "'Cinzel',serif", fontSize: 15, color: '#F0E6D2', margin: '0 0 16px' }}>👥 Игроки ({invited.length})</h3>
          <input style={{ ...inputStyle, marginBottom: 12 }} placeholder="Поиск по нику..." value={search} onChange={e => setSearch(e.target.value)} />
          {search && filtered.length > 0 && (
            <div style={{ background: '#1F1F2A', borderRadius: 8, marginBottom: 12, overflow: 'hidden' }}>
              {filtered.map(p => (
                <button key={p.id} onClick={() => { addPlayer(p); setSearch(''); }} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', background: 'none', border: 'none', padding: '10px 14px', cursor: 'pointer', color: '#F0E6D2', borderBottom: '1px solid #2A2A36' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#2A2A36'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}
                >
                  <window.AvatarCircle user={p} size={28} />
                  <span>{p.nickname}</span>
                  <span style={{ marginLeft: 'auto', color: '#C9A44C', fontSize: 18 }}>+</span>
                </button>
              ))}
            </div>
          )}
          {invited.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {invited.map(p => (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#1F1F2A', borderRadius: 8, padding: '10px 14px' }}>
                  <window.AvatarCircle user={p} faction={factionAssign[p.id]} size={32} />
                  <span style={{ color: '#F0E6D2', flex: 1 }}>{p.nickname}</span>
                  <select
                    value={factionAssign[p.id] || ''}
                    onChange={e => setFactionAssign({ ...factionAssign, [p.id]: e.target.value })}
                    style={{ background: '#17171F', border: '1px solid #2A2A36', borderRadius: 6, color: '#A8A8B3', padding: '4px 8px', fontSize: 12, cursor: 'pointer' }}
                  >
                    <option value="">— Фракция —</option>
                    {Object.values(FACTIONS).map(f => (
                      <option key={f.slug} value={f.slug} disabled={usedFactions.includes(f.slug) && factionAssign[p.id] !== f.slug}>{f.name}</option>
                    ))}
                  </select>
                  <button onClick={() => removePlayer(p.id)} style={{ background: 'none', border: 'none', color: '#6B6B75', cursor: 'pointer', fontSize: 18 }}>×</button>
                </div>
              ))}
            </div>
          )}
          {invited.length === 0 && <div style={{ color: '#6B6B75', fontSize: 13 }}>Найдите и добавьте игроков выше</div>}
        </div>

        {/* Note */}
        <div style={{ background: '#17171F', borderRadius: 12, padding: '20px', border: '1px solid #2A2A36' }}>
          <h3 style={{ fontFamily: "'Cinzel',serif", fontSize: 15, color: '#F0E6D2', margin: '0 0 12px' }}>📝 Заметка (опционально)</h3>
          <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Что-нибудь о партии..." style={{ ...inputStyle, minHeight: 80, resize: 'vertical', fontFamily: 'Inter, sans-serif' }} />
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={() => navigate('home')} style={{ flex: 1, background: 'transparent', border: '1px solid #3A3A46', borderRadius: 10, padding: '14px', color: '#A8A8B3', cursor: 'pointer', fontSize: 15 }}>Отмена</button>
          <button onClick={() => navigate('home')} style={{ flex: 2, background: '#C9A44C', color: '#0E0E12', border: 'none', borderRadius: 10, padding: '14px', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>
            {mode === 'plan' ? '📅 Запланировать' : '⚔️ Записать партию'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── FINALIZE SESSION ─────────────────────────────────────────────────────────
function FinalizeScreen({ matchId, navigate }) {
  const match = SESSIONS.find(s => s.id === matchId) || SESSIONS[0];
  const [step, setStep] = useState(0);
  const [order, setOrder] = useState([...match.participations]);
  const [castles, setCastles] = useState(Object.fromEntries(match.participations.map(p => [p.id, p.castles || 4])));
  const [rounds, setRounds] = useState(9);
  const [endReason, setEndReason] = useState('castles_7');
  const [mvp, setMvp] = useState(null);
  const [finalNote, setFinalNote] = useState('');
  const [done, setDone] = useState(false);
  const [confetti, setConfetti] = useState(false);

  const steps = ['Места', 'Замки', 'Детали', 'Подтверждение'];
  const endReasons = [
    { slug: 'castles_7', label: '7 замков' },
    { slug: 'timer', label: 'Таймер' },
    { slug: 'rounds_end', label: 'Конец раундов' },
    { slug: 'early', label: 'Досрочно' },
    { slug: 'other', label: 'Другое' },
  ];

  function moveUp(i) { if (i === 0) return; const arr = [...order]; [arr[i-1], arr[i]] = [arr[i], arr[i-1]]; setOrder(arr); }
  function moveDown(i) { if (i === order.length-1) return; const arr = [...order]; [arr[i], arr[i+1]] = [arr[i+1], arr[i]]; setOrder(arr); }

  function finalize() {
    setConfetti(true);
    setTimeout(() => { setConfetti(false); setDone(true); }, 3000);
  }

  if (done) { navigate('match', { id: match.id }); return null; }

  const winner = order[0];
  const winnerFaction = winner ? FACTIONS[winner.faction] : null;

  return (
    <div style={{ maxWidth: 680, margin: '0 auto' }}>
      {/* Confetti overlay */}
      {confetti && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, pointerEvents: 'none', overflow: 'hidden' }}>
          {Array.from({ length: 60 }).map((_, i) => (
            <div key={i} style={{
              position: 'absolute',
              left: `${Math.random() * 100}%`,
              top: -20,
              width: 8, height: 8,
              background: [winnerFaction?.color || '#C9A44C', '#F0E6D2', '#C9A44C', '#4F7D4F'][i % 4],
              borderRadius: Math.random() > 0.5 ? '50%' : 0,
              animation: `confettiFall ${1.5 + Math.random() * 2}s ease-in forwards`,
              animationDelay: `${Math.random() * 1}s`,
            }}/>
          ))}
        </div>
      )}

      <button onClick={() => navigate('match', { id: match.id })} style={{ background: 'none', border: 'none', color: '#C9A44C', cursor: 'pointer', fontSize: 13, marginBottom: 16, padding: 0 }}>← Партия #{match.id}</button>
      <h1 style={{ fontFamily: "'Cinzel',serif", fontSize: 28, color: '#F0E6D2', marginBottom: 24 }}>Завершить партию</h1>

      {/* Progress */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 32 }}>
        {steps.map((s, i) => (
          <div key={i} style={{ flex: 1 }}>
            <div style={{ height: 4, borderRadius: 2, background: i <= step ? '#C9A44C' : '#2A2A36', transition: 'background 0.3s', marginBottom: 6 }}/>
            <div style={{ color: i === step ? '#C9A44C' : i < step ? '#6B6B75' : '#3A3A46', fontSize: 11, textAlign: 'center', fontWeight: i === step ? 600 : 400 }}>{s}</div>
          </div>
        ))}
      </div>

      {/* Step 0 — Places */}
      {step === 0 && (
        <div style={{ background: '#17171F', borderRadius: 12, padding: '24px', border: '1px solid #2A2A36' }}>
          <h3 style={{ fontFamily: "'Cinzel',serif", color: '#F0E6D2', margin: '0 0 8px' }}>Расставьте игроков по местам</h3>
          <p style={{ color: '#6B6B75', fontSize: 13, marginBottom: 20 }}>Первый в списке — победитель. Используйте кнопки ↑↓ для сортировки.</p>
          {order.map((part, i) => {
            const f = FACTIONS[part.faction];
            return (
              <div key={part.id} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                background: i === 0 ? '#C9A44C0A' : '#1F1F2A', borderRadius: 10, marginBottom: 8,
                borderLeft: `3px solid ${f.color}`,
              }}>
                <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 20, fontWeight: 700, color: i === 0 ? '#C9A44C' : '#6B6B75', width: 32 }}>{i === 0 ? '👑' : i + 1}</span>
                <window.AvatarCircle user={part.user} faction={part.faction} size={36} />
                <div style={{ flex: 1 }}>
                  <div style={{ color: '#F0E6D2', fontWeight: 600 }}>{part.user.nickname}</div>
                  <div style={{ color: f.color, fontSize: 12 }}>{f.name}</div>
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button onClick={() => moveUp(i)} style={{ background: '#2A2A36', border: 'none', borderRadius: 6, width: 28, height: 28, cursor: 'pointer', color: '#A8A8B3' }}>↑</button>
                  <button onClick={() => moveDown(i)} style={{ background: '#2A2A36', border: 'none', borderRadius: 6, width: 28, height: 28, cursor: 'pointer', color: '#A8A8B3' }}>↓</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Step 1 — Castles */}
      {step === 1 && (
        <div style={{ background: '#17171F', borderRadius: 12, padding: '24px', border: '1px solid #2A2A36' }}>
          <h3 style={{ fontFamily: "'Cinzel',serif", color: '#F0E6D2', margin: '0 0 20px' }}>Количество замков</h3>
          {order.map((part, i) => {
            const f = FACTIONS[part.faction];
            return (
              <div key={part.id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '12px 0', borderBottom: '1px solid #1A1A22' }}>
                <span style={{ fontFamily: "'JetBrains Mono',monospace", color: '#6B6B75', width: 20, textAlign: 'center' }}>{i + 1}</span>
                <window.AvatarCircle user={part.user} faction={part.faction} size={32} />
                <span style={{ color: '#F0E6D2', fontWeight: 600, flex: 1 }}>{part.user.nickname}</span>
                <NumberStepper
                  value={castles[part.id] || 0}
                  onChange={v => setCastles({ ...castles, [part.id]: v })}
                  min={0} max={15}
                />
              </div>
            );
          })}
        </div>
      )}

      {/* Step 2 — Details */}
      {step === 2 && (
        <div style={{ background: '#17171F', borderRadius: 12, padding: '24px', border: '1px solid #2A2A36', display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <label style={{ color: '#6B6B75', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 8 }}>Раундов сыграно</label>
            <NumberStepper value={rounds} onChange={setRounds} min={1} max={20} icon="🔄" />
          </div>
          <div>
            <label style={{ color: '#6B6B75', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 12 }}>Причина окончания</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 8 }}>
              {endReasons.map(r => (
                <button key={r.slug} onClick={() => setEndReason(r.slug)} style={{
                  background: endReason === r.slug ? '#C9A44C14' : '#1F1F2A',
                  border: `1.5px solid ${endReason === r.slug ? '#C9A44C' : '#2A2A36'}`,
                  borderRadius: 8, padding: '10px', cursor: 'pointer',
                  color: endReason === r.slug ? '#C9A44C' : '#A8A8B3', fontSize: 13, fontWeight: endReason === r.slug ? 600 : 400,
                }}>{r.label}</button>
              ))}
            </div>
          </div>
          <div>
            <label style={{ color: '#6B6B75', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 8 }}>MVP (опционально)</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {order.map(p => (
                <button key={p.id} onClick={() => setMvp(mvp?.id === p.id ? null : p)} style={{
                  background: mvp?.id === p.id ? '#C9A44C14' : '#1F1F2A',
                  border: `1px solid ${mvp?.id === p.id ? '#C9A44C' : '#2A2A36'}`,
                  borderRadius: 100, padding: '6px 12px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  <window.AvatarCircle user={p.user} size={22} />
                  <span style={{ color: '#F0E6D2', fontSize: 13 }}>{p.user.nickname}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label style={{ color: '#6B6B75', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 8 }}>Финальная заметка</label>
            <textarea value={finalNote} onChange={e => setFinalNote(e.target.value)} placeholder="Что запомнится..." style={{ width: '100%', background: '#1F1F2A', border: '1px solid #2A2A36', borderRadius: 8, padding: '10px 14px', color: '#F0E6D2', fontSize: 14, outline: 'none', minHeight: 70, resize: 'vertical', boxSizing: 'border-box', fontFamily: 'Inter' }} />
          </div>
        </div>
      )}

      {/* Step 3 — Confirm */}
      {step === 3 && (
        <div style={{ background: '#17171F', borderRadius: 12, padding: '24px', border: '1px solid #2A2A36' }}>
          <h3 style={{ fontFamily: "'Cinzel',serif", color: '#F0E6D2', margin: '0 0 20px' }}>Проверьте итоги</h3>
          {order.map((part, i) => {
            const f = FACTIONS[part.faction];
            return (
              <div key={part.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', background: i === 0 ? '#C9A44C0A' : '#1F1F2A', borderRadius: 10, borderLeft: `3px solid ${f.color}`, marginBottom: 8 }}>
                <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 20, color: i === 0 ? '#C9A44C' : '#6B6B75', width: 28 }}>{i === 0 ? '👑' : i + 1}</span>
                <window.AvatarCircle user={part.user} faction={part.faction} size={36} />
                <div style={{ flex: 1 }}>
                  <div style={{ color: '#F0E6D2', fontWeight: 600 }}>{part.user.nickname}</div>
                  <div style={{ color: f.color, fontSize: 12 }}>{f.name}</div>
                </div>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#A8A8B3' }}>
                  <span>🏰</span>
                  <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 18, fontWeight: 700, color: '#F0E6D2' }}>{castles[part.id]}</span>
                </span>
              </div>
            );
          })}
          <div style={{ marginTop: 16, padding: '12px 16px', background: '#1F1F2A', borderRadius: 10, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <span style={{ color: '#6B6B75', fontSize: 13 }}>🔄 {rounds} раундов</span>
            <span style={{ color: '#6B6B75', fontSize: 13 }}>🏁 {endReasons.find(r => r.slug === endReason)?.label}</span>
            {mvp && <span style={{ color: '#C9A44C', fontSize: 13 }}>⭐ MVP: {mvp.user.nickname}</span>}
          </div>
          {finalNote && <div style={{ marginTop: 12, color: '#A8A8B3', fontSize: 13, fontStyle: 'italic' }}>"{finalNote}"</div>}
        </div>
      )}

      {/* Navigation */}
      <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
        <button onClick={() => step > 0 ? setStep(step - 1) : navigate('matches')} style={{ flex: 1, background: 'transparent', border: '1px solid #3A3A46', borderRadius: 10, padding: '14px', color: '#A8A8B3', cursor: 'pointer', fontSize: 15 }}>
          {step === 0 ? 'Отмена' : '← Назад'}
        </button>
        {step < 3 ? (
          <button onClick={() => setStep(step + 1)} style={{ flex: 2, background: '#C9A44C', color: '#0E0E12', border: 'none', borderRadius: 10, padding: '14px', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>
            Далее →
          </button>
        ) : (
          <button onClick={finalize} style={{ flex: 2, background: '#C9A44C', color: '#0E0E12', border: 'none', borderRadius: 10, padding: '14px', fontWeight: 700, fontSize: 16, cursor: 'pointer', boxShadow: '0 8px 30px rgba(201,164,76,0.4)' }}>
            🏆 Финализировать
          </button>
        )}
      </div>
    </div>
  );
}

Object.assign(window, { FactionsScreen, FactionDetailScreen, LoginScreen, RegisterScreen, CreateSessionScreen, FinalizeScreen });
})();
