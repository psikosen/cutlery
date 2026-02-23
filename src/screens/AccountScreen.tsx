import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useGame } from '../hooks/useGameState';
import { MFASetup } from '../components/auth/MFASetup';

export function AccountScreen() {
  const { authState, signOut } = useAuth();
  const { state } = useGame();
  const [showMFASetup, setShowMFASetup] = useState(false);

  if (!state.player || authState.status !== 'authenticated') return null;

  return (
    <div className="app-screen account-screen" style={{ padding: '16px 16px 80px', maxWidth: 480, margin: '0 auto' }}>
      <div style={{ fontSize: 11, letterSpacing: 3, color: '#aa66ff', marginBottom: 16, fontWeight: 600 }}>
        ⌜ ACCOUNT & SECURITY ⌝
      </div>

      <div style={{
        background: 'rgba(10, 15, 30, 0.86)',
        borderRadius: 10,
        border: '1px solid rgba(255,255,255,0.08)',
        padding: '12px 14px',
        marginBottom: 14,
      }}>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', marginBottom: 4 }}>Hunter Name</div>
        <div style={{ fontSize: 20, color: '#fff', fontWeight: 700, fontFamily: 'Cinzel, serif', marginBottom: 10 }}>
          {state.player.name}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{
            flex: 1,
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 8,
            padding: '8px 10px',
          }}>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)' }}>Rank</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>{state.player.hunter_rank}</div>
          </div>
          <div style={{
            flex: 1,
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 8,
            padding: '8px 10px',
          }}>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)' }}>Power</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>{state.player.total_power}</div>
          </div>
        </div>
      </div>

      <div style={{
        background: 'rgba(10, 15, 30, 0.8)',
        borderRadius: 10,
        border: '1px solid rgba(255,255,255,0.08)',
        padding: '12px 14px',
      }}>
        <div style={{ fontSize: 11, letterSpacing: 2, color: 'rgba(255,255,255,0.5)', marginBottom: 10 }}>
          LOGIN
        </div>

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '8px 0',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
        }}>
          <div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>Email</div>
            <div style={{ fontSize: 13, color: '#fff' }}>{authState.user.email}</div>
          </div>
          {authState.user.emailVerified && (
            <div style={{ fontSize: 10, color: '#44dd44', padding: '2px 6px', border: '1px solid #44dd4440', borderRadius: 4 }}>
              Verified
            </div>
          )}
        </div>

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '10px 0',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
        }}>
          <div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>MFA (Authenticator)</div>
            <div style={{ fontSize: 13, color: authState.user.mfaEnabled ? '#44dd44' : 'rgba(255,255,255,0.45)' }}>
              {authState.user.mfaEnabled ? 'Enabled' : 'Disabled'}
            </div>
          </div>
          <button
            onClick={() => setShowMFASetup(true)}
            style={{
              padding: '6px 12px',
              background: authState.user.mfaEnabled ? 'rgba(255,255,255,0.06)' : '#aa66ff15',
              border: `1px solid ${authState.user.mfaEnabled ? 'rgba(255,255,255,0.12)' : '#aa66ff40'}`,
              borderRadius: 6,
              color: authState.user.mfaEnabled ? 'rgba(255,255,255,0.75)' : '#aa66ff',
              fontSize: 11,
              cursor: 'pointer',
              fontFamily: 'Rajdhani, sans-serif',
              fontWeight: 700,
            }}
          >
            {authState.user.mfaEnabled ? 'Manage' : 'Enable'}
          </button>
        </div>

        <button
          onClick={signOut}
          style={{
            width: '100%',
            marginTop: 10,
            padding: '9px 0',
            background: 'rgba(255, 50, 50, 0.08)',
            border: '1px solid rgba(255, 50, 50, 0.2)',
            borderRadius: 6,
            color: '#ff6666',
            fontSize: 12,
            cursor: 'pointer',
            fontFamily: 'Rajdhani, sans-serif',
            fontWeight: 700,
            letterSpacing: 1,
          }}
        >
          Sign Out
        </button>
      </div>

      {showMFASetup && (
        <MFASetup
          userId={authState.user.id}
          mfaEnabled={authState.user.mfaEnabled}
          onClose={() => setShowMFASetup(false)}
        />
      )}
    </div>
  );
}
