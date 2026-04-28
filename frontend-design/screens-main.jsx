
// Screens: Home, Matches List, Match Detail
(function() {
'use strict';
const { useState, useEffect, useRef } = React;
const { FACTIONS, SESSIONS, PLAYERS, computeOverview } = window.GOT;
const { MatchCard, StatTile, WinrateBar, AvatarCircle, FactionBadge, PlacementRow, LeaderboardRow, EmptyState } = window;

// ── HOME ─────────────────────────────────────────────────────────────────────
function HomeScreen({ navigate }) {
  const [loaded, setLoaded] = useState(false);
  const ov = computeOverview();
  useEffect(() => { setTimeout(() => setLoaded(true), 50); }, []);

  const anim = (delay) => ({
    opacity: loaded ? 1 : 0,
    transform: loaded ? 'translateY(0)' : 'translateY(20px)',
    transition: `opacity 0.5s ${delay}ms, transform 0.5s ${delay}ms`,
  });

  const nextDate = ov.nextMatch ? new Date(ov.nextMatch.scheduledAt) : null;
  const nextDateStr = nextDate ? nextDate.toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' }) : '';
  const nextTimeStr = nextDate ? nextDate.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) : '';

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto' }}>
      {/* Hero — next match */}
      <div style={{ ...anim(0), marginBottom: 32 }}>
        {ov.nextMatch ? (
          <div style={{
            background: 'linear-gradient(135deg, #17171F 0%, #1F1F2A 100%)',
            borderRadius: 16, padding: '32px 36px',
            border: '1px solid #C9A44C33',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 24 }}>
              <div>
                <div style={{ color: '#C9A44C', fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>⚔️ Ближайшая партия</div>
                <h2 style={{ fontFamily: "'Cinzel', serif", fontSize: 28, fontWeight: 700, color: '#F0E6D2', margin: '0 0 8px' }}>
                  {nextDateStr}, {nextTimeStr}
                </h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: '#A8A8B3', fontSize: 14 }}>
                  <span>🐉 {ov.nextMatch.mode.name}</span>
                  <span>•</span>
                  <span>📖 {ov.nextMatch.deck.name}</span>
                  <span>•</span>
                  <span>{ov.nextMatch.participations.length} игроков</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <button style={{ background: '#C9A44C', color: '#0E0E12', border: 'none', borderRadius: 8, padding: '10px 20px', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>
                  ✓ Я иду
                </button>
                <button style={{ background: 'transparent', color: '#A8A8B3', border: '1px solid #3A3A46', borderRadius: 8, padding: '10px 20px', cursor: 'pointer', fontSize: 14 }}>
                  Под вопросом
                </button>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 24, flexWrap: 'wrap' }}>
              {ov.nextMatch.participations.map(part => (
                <div key={part.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <AvatarCircle user={part.user} faction={part.faction} size={44} />
                  <span style={{ fontSize: 11, color: '#A8A8B3' }}>{part.user.nickname}</span>
                </div>
              ))}
            </div>
            {ov.nextMatch.planningNote && (
              <div style={{ marginTop: 16, color: '#6B6B75', fontSize: 13, fontStyle: 'italic' }}>"{ov.nextMatch.planningNote}"</div>
            )}
          </div>
        ) : (
          <div style={{ background: '#17171F', borderRadius: 16, padding: '32px', border: '1px solid #2A2A36', textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🗡️</div>
            <div style={{ color: '#A8A8B3', marginBottom: 16 }}>Нет запланированных партий</div>
            <button onClick={() => navigate('create')} style={{ background: '#C9A44C', color: '#0E0E12', border: 'none', borderRadius: 8, padding: '10px 24px', fontWeight: 700, cursor: 'pointer' }}>
              Запланировать партию
            </button>
          </div>
        )}
      </div>

      {/* Stats tiles */}
      <div style={{ ...anim(80), display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 32 }}>
        <StatTile label="Всего партий" value={ov.totalMatches} icon="⚔️" />
        <StatTile label="Активных игроков" value={ov.activePlayers} icon="👥" />
        {ov.mostPopularFaction && (
          <div style={{
            background: '#17171F', borderRadius: 12, padding: '20px 24px',
            border: '1px solid #2A2A36', display: 'flex', flexDirection: 'column', gap: 8,
          }}>
            <span style={{ fontSize: 20 }}>🏆</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <FactionBadge factionSlug={ov.mostPopularFaction.faction.slug} size="md" />
              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 28, fontWeight: 700, color: ov.mostPopularFaction.faction.color }}>{ov.mostPopularFaction.games}</span>
            </div>
            <div style={{ color: '#A8A8B3', fontSize: 13, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Топ фракция</div>
            <div style={{ color: '#6B6B75', fontSize: 12 }}>{ov.mostPopularFaction.faction.name}</div>
          </div>
        )}
        {ov.currentLeader && (
          <div style={{
            background: '#17171F', borderRadius: 12, padding: '20px 24px',
            border: '1px solid #C9A44C33', display: 'flex', flexDirection: 'column', gap: 8,
          }}>
            <span style={{ fontSize: 20 }}>👑</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <AvatarCircle user={ov.currentLeader.user} size={36} />
              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 28, fontWeight: 700, color: '#C9A44C' }}>{ov.currentLeader.wins}</span>
            </div>
            <div style={{ color: '#A8A8B3', fontSize: 13, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Лидер</div>
            <div style={{ color: '#6B6B75', fontSize: 12 }}>{ov.currentLeader.user.nickname}</div>
          </div>
        )}
      </div>

      {/* Recent matches */}
      <div style={{ ...anim(160), marginBottom: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontFamily: "'Cinzel',serif", fontSize: 20, color: '#F0E6D2', margin: 0 }}>Последние партии</h2>
          <button onClick={() => navigate('matches')} style={{ background: 'none', border: 'none', color: '#C9A44C', cursor: 'pointer', fontSize: 13 }}>Все партии →</button>
        </div>
        <div style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 8 }}>
          {ov.recentMatches.map(m => (
            <div key={m.id} style={{ minWidth: 260, flexShrink: 0 }}>
              <MatchCard match={m} onClick={(id) => navigate('match', { id })} compact />
            </div>
          ))}
        </div>
      </div>

      {/* Two-column section */}
      <div style={{ ...anim(240), display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24, marginBottom: 32 }}>
        {/* Top winrate */}
        <div style={{ background: '#17171F', borderRadius: 12, padding: '24px', border: '1px solid #2A2A36' }}>
          <h3 style={{ fontFamily: "'Cinzel',serif", fontSize: 16, color: '#F0E6D2', margin: '0 0 16px', display: 'flex', justifyContent: 'space-between' }}>
            Топ по победам
            <button onClick={() => navigate('leaderboard')} style={{ background: 'none', border: 'none', color: '#C9A44C', cursor: 'pointer', fontSize: 12 }}>Все →</button>
          </h3>
          {ov.topWinrate.map((entry, i) => (
            <LeaderboardRow
              key={entry.user.id}
              rank={i + 1}
              user={entry.user}
              metricValue={entry.winrate}
              metricLabel="Винрейт"
              faction={entry.user.favoriteFaction}
              onClick={(id) => navigate('profile', { id })}
            />
          ))}
        </div>

        {/* Faction winrates */}
        <div style={{ background: '#17171F', borderRadius: 12, padding: '24px', border: '1px solid #2A2A36' }}>
          <h3 style={{ fontFamily: "'Cinzel',serif", fontSize: 16, color: '#F0E6D2', margin: '0 0 16px', display: 'flex', justifyContent: 'space-between' }}>
            Метагейм фракций
            <button onClick={() => navigate('factions')} style={{ background: 'none', border: 'none', color: '#C9A44C', cursor: 'pointer', fontSize: 12 }}>Все →</button>
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {ov.factionWinrates.map(fw => (
              <WinrateBar key={fw.faction.slug} faction={fw.faction} value={fw.winrate} max={1} />
            ))}
          </div>
        </div>
      </div>

      {/* Fun facts */}
      <div style={{ ...anim(320), display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
        {ov.funFacts.map((ff, i) => (
          <div key={i} style={{ background: 'linear-gradient(135deg, #17171F, #1A1A22)', borderRadius: 12, padding: '20px', border: '1px solid #2A2A36' }}>
            <div style={{ fontSize: 28, marginBottom: 10 }}>{ff.icon}</div>
            <div style={{ color: '#C9A44C', fontWeight: 600, fontSize: 14, marginBottom: 6 }}>{ff.title}</div>
            <div style={{ color: '#A8A8B3', fontSize: 13 }}>{ff.description}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── MATCHES LIST ─────────────────────────────────────────────────────────────
function MatchesScreen({ navigate }) {
  const [statusFilter, setStatusFilter] = useState('all');
  const [modeFilter, setModeFilter] = useState('all');
  const [sort, setSort] = useState('newest');

  const all = [...SESSIONS].filter(s => {
    if (statusFilter !== 'all' && s.status !== statusFilter) return false;
    if (modeFilter !== 'all' && s.mode.slug !== modeFilter) return false;
    return true;
  }).sort((a, b) => {
    if (sort === 'newest') return new Date(b.scheduledAt) - new Date(a.scheduledAt);
    if (sort === 'oldest') return new Date(a.scheduledAt) - new Date(b.scheduledAt);
    if (sort === 'longest') return (b.outcome?.roundsPlayed || 0) - (a.outcome?.roundsPlayed || 0);
    return 0;
  });

  const chipStyle = (active) => ({
    background: active ? '#C9A44C' : '#17171F',
    color: active ? '#0E0E12' : '#A8A8B3',
    border: `1px solid ${active ? '#C9A44C' : '#2A2A36'}`,
    borderRadius: 100, padding: '4px 14px', cursor: 'pointer', fontSize: 13,
    fontWeight: active ? 700 : 400, transition: 'all 0.15s',
  });

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto' }}>
      <h1 style={{ fontFamily: "'Cinzel',serif", fontSize: 28, color: '#F0E6D2', marginBottom: 24 }}>Все партии</h1>

      {/* Filters */}
      <div style={{ background: '#17171F', borderRadius: 12, padding: '20px', border: '1px solid #2A2A36', marginBottom: 24 }}>
        <div style={{ marginBottom: 12 }}>
          <div style={{ color: '#6B6B75', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>Статус</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {[['all', 'Все'], ['completed', 'Сыграны'], ['planned', 'Запланированы'], ['cancelled', 'Отменены']].map(([v, l]) => (
              <button key={v} style={chipStyle(statusFilter === v)} onClick={() => setStatusFilter(v)}>{l}</button>
            ))}
          </div>
        </div>
        <div style={{ marginBottom: 12 }}>
          <div style={{ color: '#6B6B75', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>Режим</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {[['all', 'Все'], ['classic', '⚔️ Классика'], ['quests', '📜 Квесты'], ['alternative', '🔀 Альтернатива'], ['dragons', '🐉 Драконы']].map(([v, l]) => (
              <button key={v} style={chipStyle(modeFilter === v)} onClick={() => setModeFilter(v)}>{l}</button>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: '#6B6B75', fontSize: 12 }}>Сортировка:</span>
          {[['newest', 'Новые'], ['oldest', 'Старые'], ['longest', 'По раундам']].map(([v, l]) => (
            <button key={v} style={chipStyle(sort === v)} onClick={() => setSort(v)}>{l}</button>
          ))}
        </div>
      </div>

      {all.length === 0 ? (
        <EmptyState icon="⚔️" title="Партий не найдено" description="Попробуйте изменить фильтры" />
      ) : (
        <div>
          <div style={{ color: '#6B6B75', fontSize: 13, marginBottom: 16 }}>{all.length} партий</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            {all.map(m => (
              <MatchCard key={m.id} match={m} onClick={(id) => navigate('match', { id })} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── MATCH DETAIL ─────────────────────────────────────────────────────────────
function MatchDetailScreen({ matchId, navigate }) {
  const match = SESSIONS.find(s => s.id === matchId) || SESSIONS[0];
  const [votes, setVotes] = useState(match.votes || []);
  const [comments, setComments] = useState(match.comments || []);
  const [newComment, setNewComment] = useState('');
  const [voteEffect, setVoteEffect] = useState(null);
  const currentUser = window.GOT.PLAYERS[0];

  const date = new Date(match.scheduledAt);
  const dateStr = date.toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const timeStr = date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

  const statusLabels = { completed: 'Завершена', planned: 'Запланирована', cancelled: 'Отменена' };
  const statusColors = { completed: '#4F7D4F', planned: '#C9A44C', cancelled: '#6B6B75' };
  const endReasonLabels = { castles_7: '7 замков', timer: 'Таймер', rounds_end: 'Конец раундов', early: 'Досрочно', other: 'Другое' };
  const modeEmoji = { classic: '⚔️', quests: '📜', alternative: '🔀', dragons: '🐉' };

  const sortedParticipations = [...match.participations].sort((a, b) => (a.place || 99) - (b.place || 99));

  function handleVote(toUserId, type) {
    const existing = votes.find(v => v.fromUser.id === currentUser.id && v.toUser.id === toUserId);
    if (existing) {
      if (existing.voteType === type) { setVotes(votes.filter(v => v.id !== existing.id)); return; }
      setVotes(votes.map(v => v.id === existing.id ? { ...v, voteType: type } : v));
    } else {
      const toUser = PLAYERS.find(p => p.id === toUserId);
      setVotes([...votes, { id: Date.now(), fromUser: currentUser, toUser, voteType: type, createdAt: new Date().toISOString() }]);
    }
    setVoteEffect({ userId: toUserId, type });
    setTimeout(() => setVoteEffect(null), 800);
  }

  function handleComment(e) {
    e.preventDefault();
    if (!newComment.trim()) return;
    setComments([...comments, { id: Date.now(), author: currentUser, body: newComment, createdAt: new Date().toISOString(), editedAt: null }]);
    setNewComment('');
  }

  const voteSummary = (userId) => ({
    crowns: votes.filter(v => v.toUser.id === userId && v.voteType === 'positive').length,
    shits: votes.filter(v => v.toUser.id === userId && v.voteType === 'negative').length,
    myVote: votes.find(v => v.fromUser.id === currentUser.id && v.toUser.id === userId)?.voteType || null,
  });

  function relTime(iso) {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'только что';
    if (mins < 60) return `${mins} мин назад`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}ч назад`;
    return `${Math.floor(hrs / 24)}д назад`;
  }

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>
      {/* Back */}
      <button onClick={() => navigate('matches')} style={{ background: 'none', border: 'none', color: '#C9A44C', cursor: 'pointer', fontSize: 13, marginBottom: 16, padding: 0 }}>← Все партии</button>

      {/* Hero */}
      <div style={{
        background: 'linear-gradient(135deg, #17171F 0%, #1F1F2A 100%)',
        borderRadius: 16, padding: '28px 32px', marginBottom: 24,
        border: '1px solid #2A2A36',
        animation: 'scaleIn 0.2s ease-out',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span style={{ fontFamily: "'JetBrains Mono',monospace", color: '#6B6B75', fontSize: 13 }}>Партия #{match.id}</span>
              <span style={{ background: statusColors[match.status] + '22', color: statusColors[match.status], fontSize: 11, padding: '2px 10px', borderRadius: 100, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{statusLabels[match.status]}</span>
            </div>
            <h1 style={{ fontFamily: "'Cinzel',serif", fontSize: 24, color: '#F0E6D2', margin: '0 0 8px' }}>{dateStr}</h1>
            <div style={{ color: '#A8A8B3', fontSize: 14, display: 'flex', gap: 12 }}>
              <span>🕐 {timeStr}</span>
              <span>{modeEmoji[match.mode.slug]} {match.mode.name}</span>
              <span>📖 {match.deck.name}</span>
            </div>
          </div>
          {match.status === 'planned' && (
            <button onClick={() => navigate('finalize', { id: match.id })} style={{ background: '#C9A44C', color: '#0E0E12', border: 'none', borderRadius: 8, padding: '10px 20px', fontWeight: 700, cursor: 'pointer' }}>
              Завершить партию
            </button>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 280px', gap: 24, alignItems: 'start' }}>
        <div>
          {/* Result board */}
          {match.status === 'completed' && (
            <div style={{ background: '#17171F', borderRadius: 12, padding: '20px', border: '1px solid #2A2A36', marginBottom: 24 }}>
              <h3 style={{ fontFamily: "'Cinzel',serif", fontSize: 16, color: '#F0E6D2', margin: '0 0 16px' }}>Итоговый расклад</h3>
              {sortedParticipations.map((part, i) => (
                <PlacementRow key={part.id} participation={part} rank={part.place || i + 1} onClick={(id) => navigate('profile', { id })} />
              ))}
            </div>
          )}

          {/* Outcome summary */}
          {match.outcome && (
            <div style={{ background: '#17171F', borderRadius: 12, padding: '20px', border: '1px solid #2A2A36', marginBottom: 24 }}>
              <h3 style={{ fontFamily: "'Cinzel',serif", fontSize: 16, color: '#F0E6D2', margin: '0 0 16px' }}>Итоги</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
                <div style={{ background: '#1F1F2A', borderRadius: 8, padding: '12px 16px' }}>
                  <div style={{ color: '#6B6B75', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Раундов</div>
                  <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 28, fontWeight: 700, color: '#C9A44C' }}>{match.outcome.roundsPlayed}</div>
                </div>
                <div style={{ background: '#1F1F2A', borderRadius: 8, padding: '12px 16px' }}>
                  <div style={{ color: '#6B6B75', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Конец</div>
                  <div style={{ color: '#F0E6D2', fontSize: 14, fontWeight: 600 }}>{endReasonLabels[match.outcome.endReason] || match.outcome.endReason}</div>
                </div>
                {match.outcome.mvp && (
                  <div style={{ background: '#1F1F2A', borderRadius: 8, padding: '12px 16px' }}>
                    <div style={{ color: '#6B6B75', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>MVP</div>
                    <div style={{ color: '#C9A44C', fontWeight: 600 }}>{match.outcome.mvp.nickname}</div>
                  </div>
                )}
              </div>
              {match.outcome.finalNote && (
                <div style={{ marginTop: 12, color: '#A8A8B3', fontSize: 13, fontStyle: 'italic', borderTop: '1px solid #2A2A36', paddingTop: 12 }}>"{match.outcome.finalNote}"</div>
              )}
            </div>
          )}

          {/* Votes */}
          {match.status === 'completed' && (
            <div style={{ background: '#17171F', borderRadius: 12, padding: '20px', border: '1px solid #2A2A36', marginBottom: 24 }}>
              <h3 style={{ fontFamily: "'Cinzel',serif", fontSize: 16, color: '#F0E6D2', margin: '0 0 4px' }}>👑 Голосование</h3>
              <div style={{ color: '#6B6B75', fontSize: 12, marginBottom: 16 }}>Поставь корону лучшему и говно худшему</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {match.participations.filter(p => p.user.id !== currentUser.id).map(part => {
                  const vs = voteSummary(part.user.id);
                  const isEffect = voteEffect?.userId === part.user.id;
                  const f = FACTIONS[part.faction];
                  return (
                    <div key={part.id} style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                      background: '#1F1F2A', borderRadius: 10,
                      border: `1px solid ${isEffect ? (voteEffect.type === 'positive' ? '#C9A44C' : '#8B4513') : '#2A2A36'}`,
                      transition: 'border-color 0.3s',
                    }}>
                      <AvatarCircle user={part.user} faction={part.faction} size={36} />
                      <div style={{ flex: 1 }}>
                        <div style={{ color: '#F0E6D2', fontWeight: 600, fontSize: 14 }}>{part.user.nickname}</div>
                        <div style={{ color: f.color, fontSize: 12 }}>{f.name}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#6B6B75', fontSize: 12 }}>
                        <span>👑 {vs.crowns}</span>
                        <span>💩 {vs.shits}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => handleVote(part.user.id, 'positive')} style={{
                          background: vs.myVote === 'positive' ? '#C9A44C22' : 'transparent',
                          border: `1.5px solid ${vs.myVote === 'positive' ? '#C9A44C' : '#3A3A46'}`,
                          borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 18,
                          transform: isEffect && voteEffect.type === 'positive' ? 'scale(1.3)' : 'scale(1)',
                          transition: 'transform 0.2s',
                        }}>👑</button>
                        <button onClick={() => handleVote(part.user.id, 'negative')} style={{
                          background: vs.myVote === 'negative' ? '#8B451322' : 'transparent',
                          border: `1.5px solid ${vs.myVote === 'negative' ? '#B73E3E' : '#3A3A46'}`,
                          borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 18,
                          transform: isEffect && voteEffect.type === 'negative' ? 'scale(1.3)' : 'scale(1)',
                          transition: 'transform 0.2s',
                        }}>💩</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Comments */}
          <div style={{ background: '#17171F', borderRadius: 12, padding: '20px', border: '1px solid #2A2A36' }}>
            <h3 style={{ fontFamily: "'Cinzel',serif", fontSize: 16, color: '#F0E6D2', margin: '0 0 16px' }}>💬 Комментарии ({comments.length})</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 20 }}>
              {comments.map(c => (
                <div key={c.id} style={{ display: 'flex', gap: 12 }}>
                  <AvatarCircle user={c.author} size={36} />
                  <div style={{ flex: 1, background: '#1F1F2A', borderRadius: 10, padding: '10px 14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ color: '#C9A44C', fontWeight: 600, fontSize: 13 }}>{c.author.nickname}</span>
                      <span style={{ color: '#6B6B75', fontSize: 11 }}>{relTime(c.createdAt)}</span>
                    </div>
                    <div style={{ color: '#F0E6D2', fontSize: 14 }}>{c.body}</div>
                  </div>
                </div>
              ))}
              {comments.length === 0 && <div style={{ color: '#6B6B75', fontSize: 13 }}>Пока нет комментариев. Будьте первым!</div>}
            </div>
            <form onSubmit={handleComment} style={{ display: 'flex', gap: 10 }}>
              <AvatarCircle user={currentUser} size={36} />
              <input
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                placeholder="Напишите комментарий..."
                style={{
                  flex: 1, background: '#1F1F2A', border: '1px solid #2A2A36',
                  borderRadius: 10, padding: '10px 14px', color: '#F0E6D2', fontSize: 14,
                  outline: 'none',
                }}
                onFocus={e => e.target.style.borderColor = '#C9A44C66'}
                onBlur={e => e.target.style.borderColor = '#2A2A36'}
              />
              <button type="submit" style={{ background: '#C9A44C', color: '#0E0E12', border: 'none', borderRadius: 10, padding: '0 16px', fontWeight: 700, cursor: 'pointer', fontSize: 16 }}>→</button>
            </form>
          </div>
        </div>

        {/* Sidebar widgets (desktop) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: '#17171F', borderRadius: 12, padding: '20px', border: '1px solid #2A2A36' }}>
            <h4 style={{ fontFamily: "'Cinzel',serif", fontSize: 14, color: '#F0E6D2', margin: '0 0 12px' }}>Состав</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {sortedParticipations.map(part => {
                const f = FACTIONS[part.faction];
                return (
                  <button key={part.id} onClick={() => navigate('profile', { id: part.user.id })} style={{
                    display: 'flex', alignItems: 'center', gap: 8, background: 'none',
                    border: 'none', cursor: 'pointer', padding: '4px 0', textAlign: 'left',
                  }}>
                    <AvatarCircle user={part.user} faction={part.faction} size={28} />
                    <div>
                      <div style={{ color: '#F0E6D2', fontSize: 13, fontWeight: 500 }}>{part.user.nickname}</div>
                      <div style={{ color: f.color, fontSize: 11 }}>{f.name}</div>
                    </div>
                    {part.place && <span style={{ marginLeft: 'auto', fontFamily: "'JetBrains Mono',monospace", color: part.place === 1 ? '#C9A44C' : '#6B6B75', fontSize: 12 }}>#{part.place}</span>}
                  </button>
                );
              })}
            </div>
          </div>
          {match.planningNote && (
            <div style={{ background: '#17171F', borderRadius: 12, padding: '20px', border: '1px solid #2A2A36' }}>
              <h4 style={{ fontFamily: "'Cinzel',serif", fontSize: 14, color: '#F0E6D2', margin: '0 0 8px' }}>Заметка</h4>
              <p style={{ color: '#A8A8B3', fontSize: 13, margin: 0, fontStyle: 'italic' }}>"{match.planningNote}"</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { HomeScreen, MatchesScreen, MatchDetailScreen });
})();
