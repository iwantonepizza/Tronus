
// Layout — AppShell, Sidebar, TopBar, BottomNav
(function() {
'use strict';
const { useState, useEffect } = React;
const { PLAYERS } = window.GOT;

const NAV_ITEMS = [
  { id: 'home',        label: 'Обзор',      icon: '🏰', hash: '#/' },
  { id: 'matches',     label: 'Партии',     icon: '⚔️', hash: '#/matches' },
  { id: 'players',     label: 'Игроки',     icon: '👤', hash: '#/players' },
  { id: 'leaderboard', label: 'Рейтинг',    icon: '🏆', hash: '#/leaderboard' },
  { id: 'factions',    label: 'Фракции',    icon: '🐉', hash: '#/factions' },
  { id: 'h2h',         label: 'H2H',        icon: '⚡', hash: '#/h2h' },
];

function Sidebar({ currentPage, navigate }) {
  const [pulse, setPulse] = useState(false);
  useEffect(() => {
    const t = setInterval(() => { setPulse(true); setTimeout(() => setPulse(false), 1000); }, 10000);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{
      width: 240, background: '#0E0E12', borderRight: '1px solid #1A1A22',
      display: 'flex', flexDirection: 'column', height: '100%', position: 'fixed',
      top: 64, left: 0, bottom: 0, zIndex: 40, overflowY: 'auto',
    }}>
      <nav style={{ padding: '16px 12px', flex: 1 }}>
        {NAV_ITEMS.map(item => {
          const active = currentPage === item.id;
          return (
            <button key={item.id} onClick={() => navigate(item.id)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 14px', borderRadius: 8, marginBottom: 2,
                background: active ? '#C9A44C14' : 'transparent',
                border: 'none', cursor: 'pointer', textAlign: 'left',
                borderLeft: active ? '3px solid #C9A44C' : '3px solid transparent',
                color: active ? '#C9A44C' : '#A8A8B3',
                transition: 'all 0.15s',
                fontSize: 15,
              }}
              onMouseEnter={e => { if (!active) { e.currentTarget.style.background = '#17171F'; e.currentTarget.style.color = '#F0E6D2'; }}}
              onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#A8A8B3'; }}}
            >
              <span style={{ fontSize: 18, width: 24, textAlign: 'center' }}>{item.icon}</span>
              <span style={{ fontWeight: active ? 600 : 400 }}>{item.label}</span>
            </button>
          );
        })}
      </nav>
      <div style={{ padding: '16px 12px', borderTop: '1px solid #1A1A22' }}>
        <button
          onClick={() => navigate('create')}
          style={{
            width: '100%', background: '#C9A44C', color: '#0E0E12',
            border: 'none', borderRadius: 8, padding: '12px', fontWeight: 700,
            fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center',
            justifyContent: 'center', gap: 8,
            boxShadow: pulse ? '0 0 20px #C9A44C88' : '0 4px 20px rgba(201,164,76,0.3)',
            transition: 'box-shadow 0.5s, transform 0.15s',
            transform: pulse ? 'scale(1.02)' : 'scale(1)',
          }}
        >
          <span style={{ fontSize: 18 }}>+</span>
          Новая партия
        </button>
      </div>
    </div>
  );
}

function TopBar({ currentUser, navigate, onSearch }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [notifOpen, setNotifOpen] = useState(false);
  const notifs = [
    { id: 1, text: 'IronFist запланировал партию на 26 апреля', time: '2ч назад', icon: '⚔️' },
    { id: 2, text: 'DireWolf поставил тебе корону в партии #5', time: '1д назад', icon: '👑' },
    { id: 3, text: 'FireQueen прокомментировала партию #6', time: '3д назад', icon: '💬' },
  ];

  return (
    <div style={{
      height: 64, background: '#0E0E12CC', backdropFilter: 'blur(12px)',
      borderBottom: '1px solid #1A1A22', position: 'fixed', top: 0, left: 0, right: 0,
      zIndex: 50, display: 'flex', alignItems: 'center', padding: '0 24px', gap: 16,
    }}>
      {/* Logo */}
      <button onClick={() => navigate('home')} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, padding: 0 }}>
        <span style={{ fontSize: 24 }}>⚜️</span>
        <span style={{ fontFamily: "'Cinzel', serif", color: '#C9A44C', fontSize: 20, fontWeight: 700, letterSpacing: '0.1em' }}>TRONUS</span>
      </button>

      {/* Search */}
      <div style={{ flex: 1, maxWidth: 400, margin: '0 auto' }}>
        {searchOpen ? (
          <div style={{ position: 'relative' }}>
            <input
              autoFocus
              value={query}
              onChange={e => setQuery(e.target.value)}
              onBlur={() => { setSearchOpen(false); setQuery(''); }}
              placeholder="Партии, игроки..."
              style={{
                width: '100%', background: '#17171F', border: '1px solid #C9A44C66',
                borderRadius: 8, padding: '8px 16px', color: '#F0E6D2', fontSize: 14,
                outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>
        ) : (
          <button onClick={() => setSearchOpen(true)} style={{
            background: '#17171F', border: '1px solid #2A2A36', borderRadius: 8,
            padding: '8px 16px', color: '#6B6B75', fontSize: 14, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 8, width: '100%',
          }}>
            <span>🔍</span><span>Поиск...</span>
            <span style={{ marginLeft: 'auto', fontSize: 11, opacity: 0.5 }}>⌘K</span>
          </button>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginLeft: 'auto' }}>
        {/* Notifications */}
        <div style={{ position: 'relative' }}>
          <button onClick={() => setNotifOpen(!notifOpen)} style={{
            background: 'none', border: '1px solid #2A2A36', borderRadius: 8,
            padding: '8px 10px', cursor: 'pointer', color: '#A8A8B3', fontSize: 18,
            position: 'relative',
          }}>
            🔔
            <span style={{ position: 'absolute', top: 4, right: 4, width: 8, height: 8, background: '#B73E3E', borderRadius: '50%' }}/>
          </button>
          {notifOpen && (
            <div style={{
              position: 'absolute', right: 0, top: 48, width: 320,
              background: '#17171F', border: '1px solid #2A2A36', borderRadius: 12,
              boxShadow: '0 20px 60px rgba(0,0,0,0.8)', zIndex: 100,
            }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid #2A2A36', color: '#F0E6D2', fontWeight: 600 }}>Уведомления</div>
              {notifs.map(n => (
                <div key={n.id} style={{ padding: '12px 16px', borderBottom: '1px solid #1A1A22', display: 'flex', gap: 10 }}>
                  <span style={{ fontSize: 18 }}>{n.icon}</span>
                  <div>
                    <div style={{ color: '#F0E6D2', fontSize: 13 }}>{n.text}</div>
                    <div style={{ color: '#6B6B75', fontSize: 11, marginTop: 2 }}>{n.time}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Avatar */}
        {currentUser && (
          <button onClick={() => navigate('profile', { id: currentUser.id })} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            <window.AvatarCircle user={currentUser} size={36} />
          </button>
        )}
      </div>
    </div>
  );
}

function BottomNav({ currentPage, navigate }) {
  const items = [
    { id: 'home',        icon: '🏰', label: 'Главная' },
    { id: 'matches',     icon: '⚔️', label: 'Партии' },
    { id: 'create',      icon: '+',  label: 'Новая',  isFab: true },
    { id: 'leaderboard', icon: '🏆', label: 'Рейтинг' },
    { id: 'profile',     icon: '👤', label: 'Я', profileId: 1 },
  ];
  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, height: 64,
      background: '#0E0E12EE', backdropFilter: 'blur(12px)',
      borderTop: '1px solid #1A1A22', display: 'flex', alignItems: 'center',
      justifyContent: 'space-around', zIndex: 50, padding: '0 8px',
    }}>
      {items.map(item => {
        const active = currentPage === item.id;
        if (item.isFab) return (
          <button key={item.id} onClick={() => navigate('create')} style={{
            width: 52, height: 52, borderRadius: '50%', background: '#C9A44C',
            color: '#0E0E12', border: 'none', fontSize: 28, fontWeight: 700,
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 20px rgba(201,164,76,0.5)', marginBottom: 8,
          }}>+</button>
        );
        return (
          <button key={item.id} onClick={() => navigate(item.id, item.profileId ? { id: item.profileId } : undefined)}
            style={{
              flex: 1, background: 'none', border: 'none', cursor: 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
              padding: '8px 0', color: active ? '#C9A44C' : '#6B6B75',
            }}>
            <span style={{ fontSize: 20 }}>{item.icon}</span>
            <span style={{ fontSize: 10, fontWeight: active ? 600 : 400 }}>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function AppShell({ children, currentPage, navigate }) {
  const currentUser = PLAYERS[0]; // IronFist as logged-in user
  const isMobile = window.innerWidth < 640;
  const [mobile, setMobile] = useState(window.innerWidth < 640);
  useEffect(() => {
    const handler = () => setMobile(window.innerWidth < 640);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: '#0E0E12', color: '#F0E6D2' }}>
      <TopBar currentUser={currentUser} navigate={navigate} />
      {!mobile && <Sidebar currentPage={currentPage} navigate={navigate} />}
      <main style={{
        marginTop: 64,
        marginLeft: mobile ? 0 : 240,
        padding: mobile ? '16px 16px 80px' : '32px',
        minHeight: 'calc(100vh - 64px)',
        maxWidth: mobile ? 'none' : 'calc(100% - 240px)',
      }}>
        {children}
      </main>
      {mobile && <BottomNav currentPage={currentPage} navigate={navigate} />}
    </div>
  );
}

Object.assign(window, { AppShell, Sidebar, TopBar, BottomNav, NAV_ITEMS });
})();
