import React, { useState, useMemo } from 'react';
import { useGame } from '../hooks/useGameState';
import { useAuth } from '../hooks/useAuth';
import { CreatureCanvas } from '../components/creatures/CreatureCanvas';
import { MFASetup } from '../components/auth/MFASetup';
import { RadarChart } from '../components/RadarChart';
import type { CreatureId, Domain } from '../types';
import {
  CREATURE_NAMES, EVOLUTION_STAGE_NAMES, DOMAIN_COLORS,
  DOMAIN_TO_CREATURE,
} from '../types';

const DOMAINS: Domain[] = ['health', 'mind', 'discipline', 'career', 'finance', 'social'];

export function HubScreen() {
  const { state, selectCreature, setTab } = useGame();
  const { authState, signOut } = useAuth();
  const [showMFASetup, setShowMFASetup] = useState(false);
  const { player, creatures, genes } = state;

  if (!player) return null;

  const activeCreatureId = state.selectedCreature || 'gore_maw';
  const activeCreature = creatures.find(c => c.id === activeCreatureId) || creatures[0];

  const rankColor = player.hunter_rank === 'S' || player.hunter_rank === 'SS' || player.hunter_rank === 'SSS'
    ? '#FFD700' : player.hunter_rank === 'Monarch' || player.hunter_rank === 'National'
    ? '#ff44ff' : '#00ccff';

  const todayCompleted = state.tasks.filter(t => t.completed_today).length;
  const todayTotal = state.tasks.filter(t => t.type === 'daily').length;

  // Domain power data for radar chart
  const domainPower = useMemo(() => {
    const power: Record<Domain, number> = {
      health: 0, mind: 0, discipline: 0, career: 0, finance: 0, social: 0,
    };
    for (const c of creatures) {
      power[c.domain] = c.total_power;
    }
    return power;
  }, [creatures]);

  // Recent gene feed (last 5)
  const recentGenes = genes.slice(-5).reverse();

  return (
    <div style={{ padding: '16px 16px 80px', maxWidth: 480, margin: '0 auto' }}>
      {/* Hunter Rank Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
      }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: 3, color: rankColor, fontWeight: 600 }}>
            ⌜ HUNTER RANK ⌝
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#fff', fontFamily: 'Cinzel, serif' }}>
            {player.hunter_rank}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>TOTAL POWER</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#fff' }}>{player.total_power}</div>
        </div>
      </div>

      {/* Player Info Bar */}
      <div style={{
        display: 'flex',
        gap: 16,
        marginBottom: 16,
        padding: '10px 14px',
        background: 'rgba(10, 15, 30, 0.8)',
        borderRadius: 8,
        border: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#FFD700' }}>{player.gold}</div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>GOLD</div>
        </div>
        <div style={{ width: 1, background: 'rgba(255,255,255,0.1)' }} />
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#00ccff' }}>{player.streak_current}</div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>STREAK</div>
        </div>
        <div style={{ width: 1, background: 'rgba(255,255,255,0.1)' }} />
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>{player.total_genes_acquired}</div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>GENES</div>
        </div>
      </div>

      {/* Active Creature Display */}
      <div style={{
        position: 'relative',
        background: 'rgba(10, 15, 30, 0.6)',
        borderRadius: 12,
        border: `1px solid ${DOMAIN_COLORS[activeCreature?.domain || 'health']}30`,
        padding: 16,
        marginBottom: 16,
        textAlign: 'center',
      }}>
        <div style={{ fontSize: 11, letterSpacing: 2, color: DOMAIN_COLORS[activeCreature?.domain || 'health'], marginBottom: 8 }}>
          {activeCreature?.domain.toUpperCase()}
        </div>
        {activeCreature && (
          <CreatureCanvas
            creature={activeCreature}
            width={280}
            height={280}
            style={{ margin: '0 auto', display: 'block' }}
            onClick={() => {
              selectCreature(activeCreature.id);
              setTab('creatures');
            }}
          />
        )}
        <div style={{ marginTop: 8 }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#fff', fontFamily: 'Cinzel, serif' }}>
            {CREATURE_NAMES[activeCreatureId]}
          </div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>
            Stage: {EVOLUTION_STAGE_NAMES[activeCreature?.evolution_stage || 0]} — {activeCreature?.total_genes || 0} Genes — Power: {activeCreature?.total_power || 0}
          </div>
        </div>
      </div>

      {/* Daily Summary */}
      <div style={{
        padding: '12px 14px',
        background: 'rgba(10, 15, 30, 0.8)',
        borderRadius: 8,
        border: '1px solid rgba(255,255,255,0.06)',
        marginBottom: 16,
      }}>
        <div style={{ fontSize: 11, letterSpacing: 2, color: '#00ccff', marginBottom: 6 }}>DAILY PROGRESS</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            flex: 1, height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden',
          }}>
            <div style={{
              height: '100%', width: `${todayTotal > 0 ? (todayCompleted / todayTotal) * 100 : 0}%`,
              background: 'linear-gradient(90deg, #00ccff, #aa66ff)',
              borderRadius: 3,
              transition: 'width 0.3s ease',
            }} />
          </div>
          <div style={{ fontSize: 13, color: '#fff', fontWeight: 600, minWidth: 40, textAlign: 'right' }}>
            {todayCompleted}/{todayTotal}
          </div>
        </div>
      </div>

      {/* Domain Power Radar Chart */}
      <div style={{ marginBottom: 16 }}>
        <RadarChart data={domainPower} size={280} />
      </div>

      {/* Domain Creature Quick-Switch */}
      <div style={{
        display: 'flex',
        gap: 8,
        overflowX: 'auto',
        paddingBottom: 8,
        marginBottom: 16,
      }}>
        {DOMAINS.map(domain => {
          const cId = DOMAIN_TO_CREATURE[domain];
          const c = creatures.find(cr => cr.id === cId);
          const isActive = cId === activeCreatureId;
          return (
            <div
              key={domain}
              onClick={() => selectCreature(cId)}
              style={{
                minWidth: 64,
                padding: '8px 6px',
                background: isActive ? `${DOMAIN_COLORS[domain]}15` : 'rgba(10, 15, 30, 0.8)',
                border: `1px solid ${isActive ? DOMAIN_COLORS[domain] + '60' : 'rgba(255,255,255,0.06)'}`,
                borderRadius: 8,
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              {c && <CreatureCanvas creature={c} width={48} height={48} style={{ margin: '0 auto' }} />}
              <div style={{ fontSize: 9, color: DOMAIN_COLORS[domain], marginTop: 4, fontWeight: 600 }}>
                {domain.slice(0, 6).toUpperCase()}
              </div>
              <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.4)' }}>
                {c?.total_genes || 0}
              </div>
            </div>
          );
        })}
      </div>

      {/* Gene Feed */}
      {recentGenes.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, letterSpacing: 2, color: '#aa66ff', marginBottom: 8 }}>RECENT GENES</div>
          {recentGenes.map(gene => (
            <div key={gene.id} style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '8px 12px',
              background: 'rgba(10, 15, 30, 0.6)',
              borderRadius: 6,
              marginBottom: 4,
              border: `1px solid ${DOMAIN_COLORS[gene.domain]}15`,
            }}>
              <div style={{ fontSize: 16 }}>🧬</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, color: '#fff', fontWeight: 600 }}>
                  {gene.type.replace(/_/g, ' ')}
                </div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>
                  +{gene.stat_value} {gene.stat_key} — {gene.tier}
                </div>
              </div>
              <div style={{
                fontSize: 10,
                color: DOMAIN_COLORS[gene.domain],
                padding: '2px 6px',
                border: `1px solid ${DOMAIN_COLORS[gene.domain]}40`,
                borderRadius: 4,
              }}>
                {gene.domain}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Account & Security */}
      <div style={{
        background: 'rgba(10, 15, 30, 0.8)',
        borderRadius: 8,
        padding: '12px 14px',
        border: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{ fontSize: 11, letterSpacing: 2, color: 'rgba(255,255,255,0.3)', marginBottom: 10 }}>ACCOUNT & SECURITY</div>

        {authState.status === 'authenticated' && (
          <>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '8px 0',
              borderBottom: '1px solid rgba(255,255,255,0.04)',
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
              borderBottom: '1px solid rgba(255,255,255,0.04)',
            }}>
              <div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>MFA (Authenticator)</div>
                <div style={{ fontSize: 13, color: authState.user.mfaEnabled ? '#44dd44' : 'rgba(255,255,255,0.4)' }}>
                  {authState.user.mfaEnabled ? 'Enabled' : 'Disabled'}
                </div>
              </div>
              <button
                onClick={() => setShowMFASetup(true)}
                style={{
                  padding: '6px 12px',
                  background: authState.user.mfaEnabled ? 'rgba(255,255,255,0.05)' : '#aa66ff15',
                  border: `1px solid ${authState.user.mfaEnabled ? 'rgba(255,255,255,0.1)' : '#aa66ff40'}`,
                  borderRadius: 4,
                  color: authState.user.mfaEnabled ? 'rgba(255,255,255,0.5)' : '#aa66ff',
                  fontSize: 11,
                  cursor: 'pointer',
                  fontFamily: 'Rajdhani, sans-serif',
                  fontWeight: 600,
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
                padding: '8px 0',
                background: 'rgba(255, 50, 50, 0.08)',
                border: '1px solid rgba(255, 50, 50, 0.2)',
                borderRadius: 4,
                color: '#ff6666',
                fontSize: 12,
                cursor: 'pointer',
                fontFamily: 'Rajdhani, sans-serif',
                fontWeight: 600,
              }}
            >
              Sign Out
            </button>
          </>
        )}
      </div>

      {/* MFA Setup Modal */}
      {showMFASetup && authState.status === 'authenticated' && (
        <MFASetup
          userId={authState.user.id}
          mfaEnabled={authState.user.mfaEnabled}
          onClose={() => setShowMFASetup(false)}
        />
      )}
    </div>
  );
}
