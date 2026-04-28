
// Screens: Player Profile, Players List, Leaderboard, H2H
(function() {
'use strict';
const { useState, useEffect } = React;
const { FACTIONS, PLAYERS, SESSIONS, computePlayerStats, computeLeaderboard, computeH2H } = window.GOT;
const { AvatarCircle, FactionBadge, StatTile, MatchCard, LeaderboardRow, EmptyState } = window;

// Mini line chart using SVG
function MiniLineChart({ data, color = '#C9A44C', height = 80 }) {
  if (!data || data.length < 2) return null;
  const w = 300, h = height;
  const pad = 8;
  const min = Math.min(...data), max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * (w - pad * 2);
    const y = h - pad - ((v - min) / range) * (h - pad * 2);
    return `${x},${y}`;
  });
  const path = 'M' + pts.join(' L');
  const area = path + ` L${w - pad},${h - pad} L${pad},${h - pad} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height }} preserveAspectRatio="none">
      <defs>
        <linearGradient id="lgrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      <path d={area} fill="url(#lgrad)"/>
      <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      {pts.map((pt, i) => {
        const [x, y] = pt.split(',').map(Number);
        return <circle key={i} cx={x} cy={y} r="3" fill={color}/>;
      })}
    </svg>
  );
}

// ── PLAYERS LIST ─────────────────────────────────────────────────────────────
function PlayersScreen({ navigate }) {
  return (
    <div style={{ maxWidth: 1280, margin: '0 auto' }}>
      <h1 style={{ fontFamily: "'Cinzel',serif", fontSize: 28, color: '#F0E6D2', marginBottom: 24 }}>Игроки</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
        {PLAYERS.map(player => {
          const stats = computePlayerStats(player.id);
          const ff = player.favoriteFaction ? FACTIONS[player.favoriteFaction] : null;
          return (
            <button key={player.id} onClick={() => navigate('profile', { id: player.id })}
              style={{
                background: '#17171F', borderRadius: 12, padding: '20px',
                border: `1px solid ${ff ? ff.color + '33' : '#2A2A36'}`,
                borderLeft: ff ? `3px solid ${ff.color}` : '1px solid #2A2A36',
                cursor: 'pointer', textAlign: 'left', transition: 'transform 0.15s, box-shadow 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 40px -10px rgba(0,0,0,0.6)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <AvatarCircle user={player} size={48} />
                <div>
                  <div style={{ color: '#F0E6D2', fontWeight: 700, fontSize: 16 }}>{player.nickname}</div>
                  {ff && <div style={{ color: ff.color, fontSize: 12, marginTop: 2 }}>{ff.name}</div>}
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                {[
                  { label: 'Партий', val: stats.totalGames },
                  { label: 'Побед', val: stats.wins },
                  { label: 'WR', val: `${Math.round(stats.winrate * 100)}%` },
                ].map(s => (
                  <div key={s.label} style={{ background: '#1F1F2A', borderRadius: 6, padding: '8px', textAlign: 'center' }}>
                    <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 18, fontWeight: 700, color: '#C9A44C' }}>{s.val}</div>
                    <div style={{ color: '#6B6B75', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── PLAYER PROFILE ────────────────────────────────────────────────────────────
function PlayerProfileScreen({ playerId, navigate }) {
  const [tab, setTab] = useState('overview');
  const player = PLAYERS.find(p => p.id === playerId) || PLAYERS[0];
  const stats = computePlayerStats(player.id);
  const ff = player.favoriteFaction ? FACTIONS[player.favoriteFaction] : null;
  const currentUser = PLAYERS[0];

  const completedSessions = SESSIONS.filter(s =>
    s.status === 'completed' && s.participations.some(p => p.user.id === player.id)
  );

  // Winrate over last 20 games
  const last20 = completedSessions.slice(-20);
  const winrateHistory = last20.map((_, i) => {
    const slice = last20.slice(0, i + 1);
    const wins = slice.filter(s => s.participations.find(p => p.user.id === player.id)?.isWinner).length;
    return wins / slice.length;
  });

  const joinDate = new Date(player.dateJoined).toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });

  const tabStyle = (active) => ({
    background: active ? '#C9A44C14' : 'none',
    border: 'none', borderBottom: active ? '2px solid #C9A44C' : '2px solid transparent',
    color: active ? '#C9A44C' : '#A8A8B3', padding: '10px 16px',
    cursor: 'pointer', fontSize: 14, fontWeight: active ? 600 : 400,
    transition: 'all 0.15s',
  });

  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>
      <button onClick={() => navigate('players')} style={{ background: 'none', border: 'none', color: '#C9A44C', cursor: 'pointer', fontSize: 13, marginBottom: 16, padding: 0 }}>← Все игроки</button>

      {/* Hero */}
      <div style={{
        background: 'linear-gradient(135deg, #17171F, #1F1F2A)',
        borderRadius: 16, padding: '28px 32px', marginBottom: 24,
        border: `1px solid ${ff ? ff.color + '33' : '#2A2A36'}`,
        borderLeft: ff ? `4px solid ${ff.color}` : undefined,
      }}>
        <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <AvatarCircle user={player} size={80} />
          <div style={{ flex: 1 }}>
            <h1 style={{ fontFamily: "'Cinzel',serif", fontSize: 28, color: '#F0E6D2', margin: '0 0 4px' }}>{player.nickname}</h1>
            <div style={{ color: '#6B6B75', fontSize: 13, marginBottom: 12 }}>
              Играет с {joinDate} · {stats.totalGames} партий · {stats.wins} побед
            </div>
            {ff && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FactionBadge factionSlug={player.favoriteFaction} size="md" showLabel />
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            {playerId !== currentUser.id && (
              <button onClick={() => navigate('h2h', { a: currentUser.id, b: player.id })} style={{
                background: 'transparent', border: '1px solid #3A3A46', borderRadius: 8,
                padding: '8px 16px', color: '#A8A8B3', cursor: 'pointer', fontSize: 13,
              }}>⚡ H2H со мной</button>
            )}
            {playerId === currentUser.id && (
              <button style={{ background: '#C9A44C', color: '#0E0E12', border: 'none', borderRadius: 8, padding: '8px 16px', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>
                ✏️ Редактировать
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ borderBottom: '1px solid #2A2A36', marginBottom: 24, display: 'flex', gap: 4, overflowX: 'auto' }}>
        {[['overview', '📊 Обзор'], ['matches', '⚔️ Партии'], ['factions', '🐉 Фракции'], ['achievements', '🏆 Ачивки'], ['votes', '👑 Голоса']].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} style={tabStyle(tab === id)}>{label}</button>
        ))}
      </div>

      {/* Overview tab */}
      {tab === 'overview' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 16, marginBottom: 24 }}>
            <StatTile label="Партий" value={stats.totalGames} icon="⚔️" />
            <StatTile label="Побед" value={stats.wins} icon="👑" />
            <StatTile label="Винрейт" value={stats.winrate} icon="%" />
            <StatTile label="Ср. место" value={stats.avgPlace} icon="📍" />
            <StatTile label="Ср. замков" value={stats.avgCastles} icon="🏰" />
            <StatTile label="Короны" value={stats.crownsReceived} icon="👑" accent="#C9A44C" />
            <StatTile label="Говно" value={stats.shitsReceived} icon="💩" accent="#B73E3E" />
            {stats.currentStreak && (
              <div style={{ background: '#17171F', borderRadius: 12, padding: '20px 24px', border: '1px solid #2A2A36' }}>
                <div style={{ fontSize: 20 }}>{stats.currentStreak.type === 'win' ? '🔥' : '❄️'}</div>
                <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 32, fontWeight: 700, color: stats.currentStreak.type === 'win' ? '#4F7D4F' : '#B73E3E', lineHeight: 1, marginTop: 8 }}>{stats.currentStreak.count}</div>
                <div style={{ color: '#A8A8B3', fontSize: 13, marginTop: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{stats.currentStreak.type === 'win' ? 'Серия побед' : 'Серия поражений'}</div>
              </div>
            )}
          </div>

          {/* Winrate chart */}
          {winrateHistory.length > 1 && (
            <div style={{ background: '#17171F', borderRadius: 12, padding: '20px', border: '1px solid #2A2A36', marginBottom: 24 }}>
              <h3 style={{ fontFamily: "'Cinzel',serif", fontSize: 15, color: '#F0E6D2', margin: '0 0 16px' }}>Динамика винрейта (последние {last20.length} партий)</h3>
              <MiniLineChart data={winrateHistory} color={ff?.color || '#C9A44C'} height={80} />
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#6B6B75', fontSize: 11, marginTop: 4 }}>
                <span>1 партия</span>
                <span>{last20.length} партий</span>
              </div>
            </div>
          )}

          {/* Last 10 matches mini */}
          <div style={{ background: '#17171F', borderRadius: 12, padding: '20px', border: '1px solid #2A2A36' }}>
            <h3 style={{ fontFamily: "'Cinzel',serif", fontSize: 15, color: '#F0E6D2', margin: '0 0 16px' }}>Последние партии</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {stats.last10.map((entry, i) => {
                const f = FACTIONS[entry.faction];
                const session = SESSIONS.find(s => s.id === entry.matchId);
                return (
                  <button key={i} onClick={() => navigate('match', { id: entry.matchId })} style={{
                    display: 'flex', alignItems: 'center', gap: 12, background: 'none',
                    border: 'none', cursor: 'pointer', padding: '8px 12px',
                    borderRadius: 8, borderLeft: `3px solid ${f.color}`,
                    transition: 'background 0.15s', textAlign: 'left',
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = '#1F1F2A'}
                    onMouseLeave={e => e.currentTarget.style.background = 'none'}
                  >
                    <FactionBadge factionSlug={entry.faction} size="sm" />
                    <span style={{ color: '#A8A8B3', fontSize: 13, flex: 1 }}>
                      {session ? new Date(session.scheduledAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }) : `#${entry.matchId}`}
                    </span>
                    <span style={{
                      fontFamily: "'JetBrains Mono',monospace", fontSize: 16, fontWeight: 700,
                      color: entry.place === 1 ? '#C9A44C' : '#A8A8B3',
                    }}>#{entry.place}</span>
                    {entry.place === 1 && <span>👑</span>}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Matches tab */}
      {tab === 'matches' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {completedSessions.reverse().map(m => (
            <MatchCard key={m.id} match={m} onClick={(id) => navigate('match', { id })} />
          ))}
        </div>
      )}

      {/* Factions tab */}
      {tab === 'factions' && (
        <div style={{ background: '#17171F', borderRadius: 12, border: '1px solid #2A2A36', overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px 100px 100px 100px', padding: '12px 20px', borderBottom: '1px solid #2A2A36', color: '#6B6B75', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            <span>Фракция</span><span style={{ textAlign: 'center' }}>Партий</span><span style={{ textAlign: 'center' }}>Побед</span>
            <span style={{ textAlign: 'center' }}>Винрейт</span><span style={{ textAlign: 'center' }}>Ср. место</span><span style={{ textAlign: 'center' }}>Ср. замков</span>
          </div>
          {stats.factionBreakdown.sort((a, b) => b.games - a.games).map(fb => {
            const f = FACTIONS[fb.slug];
            return (
              <div key={fb.slug} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px 100px 100px 100px', padding: '14px 20px', borderBottom: '1px solid #1A1A22', borderLeft: `3px solid ${f.color}`, alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FactionBadge factionSlug={fb.slug} size="sm" showLabel />
                </div>
                <span style={{ fontFamily: "'JetBrains Mono',monospace", color: '#F0E6D2', textAlign: 'center' }}>{fb.games}</span>
                <span style={{ fontFamily: "'JetBrains Mono',monospace", color: '#4F7D4F', textAlign: 'center' }}>{fb.wins}</span>
                <span style={{ fontFamily: "'JetBrains Mono',monospace", color: '#C9A44C', textAlign: 'center', fontWeight: 700 }}>{Math.round(fb.winrate * 100)}%</span>
                <span style={{ fontFamily: "'JetBrains Mono',monospace", color: '#A8A8B3', textAlign: 'center' }}>—</span>
                <span style={{ fontFamily: "'JetBrains Mono',monospace", color: '#A8A8B3', textAlign: 'center' }}>—</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Achievements tab */}
      {tab === 'achievements' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
            {[
              { slug: 'first_win', title: 'Первая победа', desc: 'Выиграй свою первую партию', icon: '🏆', unlocked: stats.wins > 0, progress: { current: Math.min(stats.wins, 1), target: 1 } },
              { slug: 'ten_games', title: '10 партий', desc: 'Сыграй 10 партий', icon: '⚔️', unlocked: stats.totalGames >= 10, progress: { current: Math.min(stats.totalGames, 10), target: 10 } },
              { slug: 'hat_trick', title: 'Хет-трик', desc: '3 победы подряд', icon: '🔥', unlocked: stats.currentStreak.type === 'win' && stats.currentStreak.count >= 3, progress: { current: stats.currentStreak.type === 'win' ? stats.currentStreak.count : 0, target: 3 } },
              { slug: 'crown_king', title: 'Король корон', desc: 'Получи 10 корон', icon: '👑', unlocked: stats.crownsReceived >= 10, progress: { current: stats.crownsReceived, target: 10 } },
              { slug: 'faction_master', title: 'Мастер фракции', desc: 'Выиграй 5 раз одной фракцией', icon: '🎭', unlocked: (stats.factionBreakdown || []).some(f => f.wins >= 5), progress: { current: Math.max(...(stats.factionBreakdown || []).map(f => f.wins), 0), target: 5 } },
              { slug: 'veteran', title: 'Ветеран', desc: 'Сыграй 20 партий', icon: '🛡️', unlocked: stats.totalGames >= 20, progress: { current: Math.min(stats.totalGames, 20), target: 20 } },
            ].map(ach => (
              <div key={ach.slug} style={{
                background: '#17171F', borderRadius: 12, padding: '20px',
                border: `1px solid ${ach.unlocked ? '#C9A44C44' : '#2A2A36'}`,
                opacity: ach.unlocked ? 1 : 0.5,
              }}>
                <div style={{ fontSize: 36, marginBottom: 8, filter: ach.unlocked ? 'none' : 'grayscale(1)' }}>{ach.icon}</div>
                <div style={{ color: ach.unlocked ? '#C9A44C' : '#A8A8B3', fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{ach.title}</div>
                <div style={{ color: '#6B6B75', fontSize: 12, marginBottom: 10 }}>{ach.desc}</div>
                <div style={{ background: '#1F1F2A', borderRadius: 4, height: 6 }}>
                  <div style={{ width: `${Math.min(100, (ach.progress.current / ach.progress.target) * 100)}%`, height: '100%', background: '#C9A44C', borderRadius: 4, transition: 'width 0.6s' }}/>
                </div>
                <div style={{ color: '#6B6B75', fontSize: 11, marginTop: 4 }}>{ach.progress.current}/{ach.progress.target}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Votes tab */}
      {tab === 'votes' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
            <div style={{ background: '#17171F', borderRadius: 12, padding: '24px', border: '1px solid #C9A44C33', textAlign: 'center' }}>
              <div style={{ fontSize: 40 }}>👑</div>
              <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 48, fontWeight: 700, color: '#C9A44C' }}>{stats.crownsReceived}</div>
              <div style={{ color: '#A8A8B3', fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Корон получено</div>
            </div>
            <div style={{ background: '#17171F', borderRadius: 12, padding: '24px', border: '1px solid #B73E3E33', textAlign: 'center' }}>
              <div style={{ fontSize: 40 }}>💩</div>
              <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 48, fontWeight: 700, color: '#B73E3E' }}>{stats.shitsReceived}</div>
              <div style={{ color: '#A8A8B3', fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Говна получено</div>
            </div>
          </div>
          <MiniLineChart data={Array.from({ length: Math.min(20, stats.totalGames) }, (_, i) => Math.random())} color="#C9A44C" />
        </div>
      )}
    </div>
  );
}

// ── LEADERBOARD ───────────────────────────────────────────────────────────────
function LeaderboardScreen({ navigate }) {
  const [metric, setMetric] = useState('winrate');
  const metrics = [
    { id: 'winrate', label: 'Винрейт' },
    { id: 'wins', label: 'Победы' },
    { id: 'games', label: 'Партии' },
    { id: 'crowns', label: 'Короны' },
    { id: 'shits', label: 'Говно' },
    { id: 'avgplace', label: 'Ср. место' },
  ];
  const [prev, setPrev] = useState(null);
  const [data, setData] = useState(() => computeLeaderboard('winrate'));

  function switchMetric(m) {
    setPrev(metric);
    setMetric(m);
    setData(computeLeaderboard(m));
  }

  const metricLabel = metrics.find(m => m.id === metric)?.label;

  const pillStyle = (active) => ({
    background: active ? '#C9A44C' : '#17171F',
    color: active ? '#0E0E12' : '#A8A8B3',
    border: `1px solid ${active ? '#C9A44C' : '#2A2A36'}`,
    borderRadius: 100, padding: '6px 16px', cursor: 'pointer', fontSize: 13,
    fontWeight: active ? 700 : 400, transition: 'all 0.15s',
  });

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <h1 style={{ fontFamily: "'Cinzel',serif", fontSize: 28, color: '#F0E6D2', marginBottom: 24 }}>🏆 Рейтинг</h1>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 32 }}>
        {metrics.map(m => (
          <button key={m.id} style={pillStyle(metric === m.id)} onClick={() => switchMetric(m.id)}>{m.label}</button>
        ))}
      </div>

      <div style={{ background: '#17171F', borderRadius: 16, border: '1px solid #2A2A36', overflow: 'hidden', padding: '8px' }}>
        {data.map((entry, i) => (
          <div key={entry.user.id} style={{ animation: 'fadeIn 0.3s ease-out', animationDelay: `${i * 30}ms`, animationFillMode: 'both' }}>
            <LeaderboardRow
              rank={i + 1}
              user={entry.user}
              metricValue={entry.value}
              metricLabel={metricLabel}
              faction={entry.user.favoriteFaction}
              onClick={(id) => navigate('profile', { id })}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── HEAD-TO-HEAD ─────────────────────────────────────────────────────────────
function H2HScreen({ playerAId, playerBId, navigate }) {
  const [selA, setSelA] = useState(playerAId || PLAYERS[0].id);
  const [selB, setSelB] = useState(playerBId || PLAYERS[1].id);

  const h2h = computeH2H(selA, selB);
  const playerA = h2h.userA;
  const playerB = h2h.userB;
  const ffA = playerA.favoriteFaction ? FACTIONS[playerA.favoriteFaction] : null;
  const ffB = playerB.favoriteFaction ? FACTIONS[playerB.favoriteFaction] : null;

  const selStyle = { background: '#17171F', border: '1px solid #2A2A36', borderRadius: 8, color: '#F0E6D2', padding: '8px 12px', fontSize: 14, cursor: 'pointer', width: '100%' };

  const total = h2h.winsA + h2h.winsB || 1;
  const pctA = Math.round((h2h.winsA / total) * 100);
  const pctB = Math.round((h2h.winsB / total) * 100);

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <h1 style={{ fontFamily: "'Cinzel',serif", fontSize: 28, color: '#F0E6D2', marginBottom: 24 }}>⚡ Head-to-Head</h1>

      {/* Selectors */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 16, alignItems: 'center', marginBottom: 32 }}>
        <select style={selStyle} value={selA} onChange={e => setSelA(Number(e.target.value))}>
          {PLAYERS.map(p => <option key={p.id} value={p.id}>{p.nickname}</option>)}
        </select>
        <div style={{ fontFamily: "'Cinzel',serif", color: '#C9A44C', fontWeight: 700, fontSize: 20, textAlign: 'center' }}>VS</div>
        <select style={selStyle} value={selB} onChange={e => setSelB(Number(e.target.value))}>
          {PLAYERS.map(p => <option key={p.id} value={p.id}>{p.nickname}</option>)}
        </select>
      </div>

      {/* Hero comparison */}
      <div style={{ background: 'linear-gradient(135deg, #17171F, #1F1F2A)', borderRadius: 16, padding: '32px', marginBottom: 24, border: '1px solid #2A2A36' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 24, alignItems: 'center' }}>
          {/* Player A */}
          <div style={{ textAlign: 'center' }}>
            <AvatarCircle user={playerA} faction={playerA.favoriteFaction} size={72} />
            <div style={{ fontFamily: "'Cinzel',serif", fontSize: 20, color: '#F0E6D2', marginTop: 12, fontWeight: 700 }}>{playerA.nickname}</div>
            {ffA && <div style={{ color: ffA.color, fontSize: 13, marginTop: 4 }}>{ffA.name}</div>}
            <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 48, fontWeight: 700, color: h2h.winsA >= h2h.winsB ? '#C9A44C' : '#A8A8B3', marginTop: 16 }}>{h2h.winsA}</div>
            <div style={{ color: '#6B6B75', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em' }}>победы</div>
          </div>

          {/* Center */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: "'Cinzel',serif", color: '#C9A44C', fontSize: 32, fontWeight: 700 }}>VS</div>
            <div style={{ color: '#6B6B75', fontSize: 12, marginTop: 8 }}>{h2h.gamesTogetherCount} партий вместе</div>
            {/* Win bar */}
            <div style={{ marginTop: 16, display: 'flex', height: 8, borderRadius: 4, overflow: 'hidden', width: 160 }}>
              <div style={{ width: `${pctA}%`, background: ffA?.color || '#C9A44C', transition: 'width 0.6s' }}/>
              <div style={{ width: `${pctB}%`, background: ffB?.color || '#A8A8B3', transition: 'width 0.6s' }}/>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#6B6B75', fontSize: 10, marginTop: 4, width: 160 }}>
              <span>{pctA}%</span><span>{pctB}%</span>
            </div>
          </div>

          {/* Player B */}
          <div style={{ textAlign: 'center' }}>
            <AvatarCircle user={playerB} faction={playerB.favoriteFaction} size={72} />
            <div style={{ fontFamily: "'Cinzel',serif", fontSize: 20, color: '#F0E6D2', marginTop: 12, fontWeight: 700 }}>{playerB.nickname}</div>
            {ffB && <div style={{ color: ffB.color, fontSize: 13, marginTop: 4 }}>{ffB.name}</div>}
            <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 48, fontWeight: 700, color: h2h.winsB > h2h.winsA ? '#C9A44C' : '#A8A8B3', marginTop: 16 }}>{h2h.winsB}</div>
            <div style={{ color: '#6B6B75', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em' }}>победы</div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Партий вместе', a: h2h.gamesTogetherCount, b: '', single: true },
          { label: 'Среднее место', a: h2h.avgPlaceA, b: h2h.avgPlaceB },
        ].map((s, i) => (
          <div key={i} style={{ background: '#17171F', borderRadius: 12, padding: '16px 20px', border: '1px solid #2A2A36' }}>
            <div style={{ color: '#6B6B75', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>{s.label}</div>
            {s.single ? (
              <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 32, fontWeight: 700, color: '#C9A44C' }}>{s.a}</div>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 24, fontWeight: 700, color: ffA?.color || '#C9A44C' }}>{s.a}</div>
                <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 24, fontWeight: 700, color: ffB?.color || '#A8A8B3' }}>{s.b}</div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Shared matches */}
      {h2h.matches.length > 0 && (
        <div>
          <h3 style={{ fontFamily: "'Cinzel',serif", fontSize: 16, color: '#F0E6D2', marginBottom: 16 }}>Общие партии</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
            {h2h.matches.map(m => (
              <MatchCard key={m.id} match={m} onClick={(id) => navigate('match', { id })} compact />
            ))}
          </div>
        </div>
      )}
      {h2h.gamesTogetherCount === 0 && (
        <EmptyState icon="⚡" title="Общих партий нет" description="Эти игроки ещё не встречались в одной партии" />
      )}
    </div>
  );
}

Object.assign(window, { PlayersScreen, PlayerProfileScreen, LeaderboardScreen, H2HScreen });
})();
