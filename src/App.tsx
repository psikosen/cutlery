import { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { GameProvider, useGame } from './hooks/useGameState';
import { LoginScreen } from './components/auth/LoginScreen';
import { NameInput } from './components/common/NameInput';
import { NotificationStack } from './components/common/NotificationStack';
import { EvolutionOverlay } from './components/common/EvolutionOverlay';
import { HubScreen } from './screens/HubScreen';
import { CalendarScreen } from './screens/CalendarScreen';
import { QuestScreen } from './screens/QuestScreen';
import { CreaturesScreen } from './screens/CreaturesScreen';
import { RaidsScreen } from './screens/RaidsScreen';
import { TimelineScreen } from './screens/TimelineScreen';
import { LabScreen } from './screens/LabScreen';
import { TrophiesScreen } from './screens/TrophiesScreen';
import { AccountScreen } from './screens/AccountScreen';
import type { TabId } from './types';

const TAB_CONFIG: { id: TabId; icon: string; label: string }[] = [
  { id: 'quests', icon: '⚔️', label: 'Quests' },
  { id: 'creatures', icon: '🧬', label: 'Creatures' },
  { id: 'hub', icon: '🏠', label: 'Hub' },
  { id: 'raids', icon: '👹', label: 'Raids' },
  { id: 'calendar', icon: '📅', label: 'Calendar' },
  { id: 'timeline', icon: '🗺️', label: 'Timeline' },
  { id: 'lab', icon: '🧪', label: 'Lab' },
  { id: 'trophies', icon: '🏆', label: 'Trophies' },
  { id: 'account', icon: '🔐', label: 'Account' },
];

function useDesktopShell() {
  const [isDesktop, setIsDesktop] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(min-width: 1024px)').matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const media = window.matchMedia('(min-width: 1024px)');
    const update = () => setIsDesktop(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  return isDesktop;
}

function GameContent() {
  const {
    state,
    initializeGame,
    setTab,
    selectCreature,
    dismissNotification,
    dismissEvolution,
  } = useGame();
  const isDesktop = useDesktopShell();

  if (state.loading) {
    return (
      <div style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#050208',
        fontFamily: 'Cinzel, serif',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontSize: 10,
            letterSpacing: 6,
            color: '#00ccff',
            marginBottom: 12,
          }}>
            ⌜ SYSTEM ⌝
          </div>
          <div style={{ fontSize: 24, color: '#fff' }}>Awakening...</div>
        </div>
      </div>
    );
  }

  if (state.showNameInput) {
    return <NameInput onSubmit={initializeGame} />;
  }

  return (
    <div
      className={`app-shell ${isDesktop ? 'app-desktop' : 'app-mobile'}`}
      style={{
        minHeight: '100vh',
        background: '#050208',
        color: '#fff',
        fontFamily: 'Rajdhani, sans-serif',
      }}
    >
      <NotificationStack
        notifications={state.notifications}
        onDismiss={dismissNotification}
      />

      {state.showEvolution && (
        <EvolutionOverlay
          creatureId={state.showEvolution.creatureId}
          oldStage={state.showEvolution.oldStage}
          newStage={state.showEvolution.newStage}
          onDismiss={() => {
            const evolvedCreatureId = state.showEvolution?.creatureId ?? null;
            if (evolvedCreatureId) {
              selectCreature(evolvedCreatureId);
              setTab('creatures');
            }
            dismissEvolution();
          }}
        />
      )}

      <div className={`app-frame ${isDesktop ? 'app-frame-desktop' : 'app-frame-mobile'}`}>
        {isDesktop && (
          <aside className="app-sidebar">
            <div className="app-sidebar-brand">
              <div className="app-sidebar-system">⌜ SYSTEM ⌝</div>
              <div className="app-sidebar-title">SHADOW SYSTEM</div>
              <div className="app-sidebar-subtitle">Desktop Command View</div>
            </div>
            <nav className="app-sidebar-nav">
              {TAB_CONFIG.map(tab => {
                const isActive = state.activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setTab(tab.id)}
                    className={`app-sidebar-tab ${isActive ? 'active' : ''}`}
                  >
                    <span className="app-sidebar-tab-icon">{tab.icon}</span>
                    <span className="app-sidebar-tab-label">{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </aside>
        )}

        <main className="app-main">
          <div style={{ opacity: 1, transition: 'opacity 0.2s ease' }}>
            {state.activeTab === 'hub' && <HubScreen />}
            {state.activeTab === 'raids' && <RaidsScreen />}
            {state.activeTab === 'calendar' && <CalendarScreen />}
            {state.activeTab === 'timeline' && <TimelineScreen />}
            {state.activeTab === 'quests' && <QuestScreen />}
            {state.activeTab === 'creatures' && <CreaturesScreen />}
            {state.activeTab === 'lab' && <LabScreen />}
            {state.activeTab === 'trophies' && <TrophiesScreen />}
            {state.activeTab === 'account' && <AccountScreen />}
          </div>
        </main>
      </div>

      {!isDesktop && (
        <nav style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'rgba(5, 2, 8, 0.95)',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          justifyContent: 'center',
          padding: '0 0 env(safe-area-inset-bottom)',
          zIndex: 900,
          backdropFilter: 'blur(10px)',
        }}>
          <div style={{
            display: 'flex',
            width: '100%',
            maxWidth: '100%',
            overflowX: 'auto',
            scrollbarWidth: 'none',
          }}>
            {TAB_CONFIG.map(tab => {
              const isActive = state.activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setTab(tab.id)}
                  style={{
                    flex: '0 0 74px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 2,
                    padding: '8px 0 6px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    position: 'relative',
                  }}
                >
                  {isActive && (
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: '20%',
                      right: '20%',
                      height: 2,
                      background: '#00ccff',
                      borderRadius: '0 0 2px 2px',
                      boxShadow: '0 0 8px #00ccff60',
                    }} />
                  )}
                  <span style={{
                    fontSize: 18,
                    filter: isActive ? 'none' : 'grayscale(0.8) brightness(0.5)',
                    transition: 'filter 0.2s ease',
                  }}>
                    {tab.icon}
                  </span>
                  <span style={{
                    fontSize: 9,
                    fontWeight: isActive ? 700 : 400,
                    color: isActive ? '#00ccff' : 'rgba(255,255,255,0.3)',
                    letterSpacing: 1,
                    textTransform: 'uppercase',
                    transition: 'color 0.2s ease',
                  }}>
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}

function AuthGate() {
  const { authState } = useAuth();

  // Show loading while checking auth
  if (authState.status === 'loading') {
    return (
      <div style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#050208',
        fontFamily: 'Cinzel, serif',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontSize: 10,
            letterSpacing: 6,
            color: '#00ccff',
            marginBottom: 12,
          }}>
            ⌜ SYSTEM ⌝
          </div>
          <div style={{ fontSize: 24, color: '#fff' }}>Initializing...</div>
        </div>
      </div>
    );
  }

  // Show login for unauthenticated, awaiting_otp, awaiting_mfa
  if (authState.status !== 'authenticated') {
    return <LoginScreen />;
  }

  // Authenticated — show the game
  return (
    <GameProvider>
      <GameContent />
    </GameProvider>
  );
}

function App() {
  return (
    <AuthProvider>
      <AuthGate />
    </AuthProvider>
  );
}

export default App;
