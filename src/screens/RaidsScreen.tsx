import { useEffect, useMemo, useState } from 'react';
import { useGame } from '../hooks/useGameState';
import type { Domain } from '../types';
import { DOMAIN_COLORS } from '../types';

function extractMonIndex(path: string): number {
  const match = path.match(/mon(\d+)\.png$/i);
  return match ? Number(match[1]) : Number.MAX_SAFE_INTEGER;
}

const RAID_IMAGES = Object.entries(
  import.meta.glob('../../assets/mon*.png', { eager: true, import: 'default' }) as Record<string, string>,
)
  .sort((a, b) => extractMonIndex(a[0]) - extractMonIndex(b[0]))
  .map(([, src]) => src);

function hashRaidId(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function imageForRaid(raidId: string): string {
  if (RAID_IMAGES.length === 0) return '';
  return RAID_IMAGES[hashRaidId(raidId) % RAID_IMAGES.length];
}

function formatDomains(domains: Domain[]): string {
  return domains.map((d) => d[0].toUpperCase() + d.slice(1)).join(' + ');
}

export function RaidsScreen() {
  const { state, resolveRaidBattle } = useGame();
  const [selectedRaidId, setSelectedRaidId] = useState<string | null>(null);
  const [introRaidId, setIntroRaidId] = useState<string | null>(null);
  const [isBattling, setIsBattling] = useState(false);
  const [battleStatus, setBattleStatus] = useState('');
  const [shakeTick, setShakeTick] = useState(0);
  const [displayHp, setDisplayHp] = useState<number | null>(null);

  const raids = state.raids;
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (!raids.length) return;
    if (!selectedRaidId || !raids.some((raid) => raid.id === selectedRaidId)) {
      const openRaid = raids.find((raid) => !raid.completed_at) || raids[0];
      setSelectedRaidId(openRaid.id);
      setDisplayHp(openRaid.hp);
    }
  }, [raids, selectedRaidId]);

  const selectedRaid = useMemo(
    () => raids.find((raid) => raid.id === selectedRaidId) || raids[0] || null,
    [raids, selectedRaidId],
  );

  useEffect(() => {
    if (!selectedRaid) return;
    if (!isBattling) {
      setDisplayHp(selectedRaid.hp);
    }
  }, [selectedRaid, isBattling]);

  const canBattleToday = Boolean(
    selectedRaid && !selectedRaid.completed_at && selectedRaid.last_battle_date !== today,
  );

  const runAutoBattle = async () => {
    if (!selectedRaid || !state.player || isBattling) return;

    setBattleStatus('Auto-battle sequence engaged...');
    setIsBattling(true);

    const participatingPower = selectedRaid.required_domains.reduce((sum, domain) => {
      const creature = state.creatures.find((entry) => entry.domain === domain);
      return sum + (creature?.total_power || 0);
    }, 0);
    const baselinePower = Math.max(25, Math.round(state.player.total_power * 0.1));
    const synergyPower = Math.max(18, Math.round(participatingPower * 0.22));
    const minDamage = Math.max(24, Math.round((baselinePower + synergyPower) * 0.6));
    const maxDamage = Math.max(minDamage + 5, Math.round((baselinePower + synergyPower) * 1.05));

    const rounds = 8;
    const roundDamages: number[] = [];
    for (let i = 0; i < rounds; i += 1) {
      const fraction = i / Math.max(1, rounds - 1);
      const swing = Math.sin((fraction + 0.15) * Math.PI) * 0.35 + 0.85;
      const raw = minDamage + Math.random() * (maxDamage - minDamage);
      roundDamages.push(Math.max(8, Math.round(raw * swing / rounds * 2.4)));
    }

    let hpTracker = selectedRaid.hp;
    for (const damage of roundDamages) {
      await new Promise((resolve) => {
        setTimeout(() => {
          hpTracker = Math.max(0, hpTracker - damage);
          setDisplayHp(hpTracker);
          setShakeTick((tick) => tick + 1);
          resolve(undefined);
        }, 260);
      });
      if (hpTracker <= 0) break;
    }

    const totalDamage = Math.max(1, roundDamages.reduce((sum, value) => sum + value, 0));
    const result = await resolveRaidBattle(selectedRaid.id, totalDamage);
    setBattleStatus(result.message);
    setIsBattling(false);
  };

  if (!state.player) return null;

  return (
    <div className="app-screen raids-screen" style={{ padding: '16px 16px 80px', maxWidth: 980, margin: '0 auto' }}>
      <div style={{ fontSize: 11, letterSpacing: 3, color: '#ff6a6a', marginBottom: 12, fontWeight: 700 }}>
        ⌜ DOMAIN BOSS RAIDS ⌝
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: 12,
          marginBottom: 14,
        }}
      >
        {raids.map((raid) => {
          const active = selectedRaid?.id === raid.id;
          const hpPercent = Math.max(0, Math.min(100, (raid.hp / raid.max_hp) * 100));
          return (
            <button
              key={raid.id}
              onClick={() => {
                setSelectedRaidId(raid.id);
                setBattleStatus('');
              }}
              style={{
                textAlign: 'left',
                borderRadius: 12,
                border: `1px solid ${active ? DOMAIN_COLORS[raid.domain] + '88' : 'rgba(255,255,255,0.12)'}`,
                background: active ? `${DOMAIN_COLORS[raid.domain]}18` : 'rgba(10,15,30,0.82)',
                color: '#fff',
                padding: '10px 12px',
                cursor: 'pointer',
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 2 }}>{raid.name}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginBottom: 8 }}>
                {formatDomains(raid.required_domains)}
              </div>
              <div style={{ height: 6, borderRadius: 4, background: 'rgba(255,255,255,0.12)', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${hpPercent}%`,
                    height: '100%',
                    background: hpPercent > 0 ? `linear-gradient(90deg, ${DOMAIN_COLORS[raid.domain]}, #ff7a7a)` : 'rgba(255,255,255,0.2)',
                  }}
                />
              </div>
              <div style={{ marginTop: 6, fontSize: 11, color: hpPercent === 0 ? '#7BFFC3' : 'rgba(255,255,255,0.6)' }}>
                {hpPercent === 0 ? 'Defeated' : `${raid.hp}/${raid.max_hp} HP`}
              </div>
            </button>
          );
        })}
      </div>

      {selectedRaid && (
        <div
          style={{
            background: 'rgba(10, 15, 30, 0.86)',
            border: `1px solid ${DOMAIN_COLORS[selectedRaid.domain]}55`,
            borderRadius: 14,
            overflow: 'hidden',
          }}
        >
          <div style={{ position: 'relative', height: 250, overflow: 'hidden', background: '#071024' }}>
            {imageForRaid(selectedRaid.id) ? (
              <img
                src={imageForRaid(selectedRaid.id)}
                alt={selectedRaid.name}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  objectPosition: 'center 15%',
                  filter: 'brightness(0.55) saturate(1.05)',
                  transform: isBattling
                    ? `scale(1.18) translate(${Math.sin(shakeTick * 1.9) * 6}px, ${Math.cos(shakeTick * 1.6) * 4}px)`
                    : 'scale(1.18)',
                  transition: isBattling ? 'transform 120ms linear' : 'transform 200ms ease',
                }}
              />
            ) : (
              <div style={{ width: '100%', height: '100%', background: 'linear-gradient(145deg, #0f1f3f, #2a0f35)' }} />
            )}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(180deg, transparent 36%, rgba(5,8,20,0.88) 100%)',
              }}
            />
            <div style={{ position: 'absolute', left: 16, right: 16, bottom: 14 }}>
              <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'Cinzel, serif' }}>{selectedRaid.name}</div>
              <div style={{ marginTop: 4, fontSize: 12, color: 'rgba(255,255,255,0.72)' }}>{selectedRaid.flavor}</div>
            </div>
          </div>

          <div style={{ padding: 14 }}>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
              {selectedRaid.required_domains.map((domain) => (
                <div
                  key={domain}
                  style={{
                    padding: '4px 8px',
                    borderRadius: 999,
                    border: `1px solid ${DOMAIN_COLORS[domain]}66`,
                    color: DOMAIN_COLORS[domain],
                    fontSize: 10,
                    letterSpacing: 1,
                    textTransform: 'uppercase',
                    background: `${DOMAIN_COLORS[domain]}14`,
                    fontWeight: 700,
                  }}
                >
                  {domain}
                </div>
              ))}
            </div>

            <div style={{ height: 10, borderRadius: 6, background: 'rgba(255,255,255,0.12)', overflow: 'hidden', marginBottom: 8 }}>
              <div
                style={{
                  width: `${Math.max(0, Math.min(100, ((displayHp ?? selectedRaid.hp) / selectedRaid.max_hp) * 100))}%`,
                  height: '100%',
                  background: `linear-gradient(90deg, ${DOMAIN_COLORS[selectedRaid.domain]}, #ff8a8a)`,
                  transition: 'width 220ms ease',
                }}
              />
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginBottom: 12 }}>
              HP {displayHp ?? selectedRaid.hp}/{selectedRaid.max_hp}
              {selectedRaid.completed_at ? ' • Cleared this week' : selectedRaid.last_battle_date === today ? ' • Battle logged today' : ''}
            </div>

            <button
              onClick={() => {
                if (!selectedRaid || !canBattleToday || isBattling) return;
                setIntroRaidId(selectedRaid.id);
              }}
              disabled={!canBattleToday || isBattling}
              style={{
                width: '100%',
                padding: '11px 12px',
                borderRadius: 9,
                border: `1px solid ${canBattleToday ? DOMAIN_COLORS[selectedRaid.domain] + '88' : 'rgba(255,255,255,0.15)'}`,
                background: canBattleToday ? `${DOMAIN_COLORS[selectedRaid.domain]}22` : 'rgba(255,255,255,0.06)',
                color: canBattleToday ? '#fff' : 'rgba(255,255,255,0.35)',
                fontSize: 12,
                letterSpacing: 1,
                fontWeight: 700,
                cursor: canBattleToday ? 'pointer' : 'default',
              }}
            >
              {isBattling ? 'AUTO BATTLE IN PROGRESS...' : canBattleToday ? 'ENGAGE AUTO BATTLE' : 'BATTLE LOCKED TODAY'}
            </button>

            {battleStatus && (
              <div style={{ marginTop: 10, fontSize: 12, color: 'rgba(255,255,255,0.68)' }}>{battleStatus}</div>
            )}
          </div>
        </div>
      )}

      {introRaidId && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(3,5,13,0.74)',
            zIndex: 1300,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 460,
              background: 'rgba(8, 13, 30, 0.95)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 12,
              padding: 16,
            }}
          >
            {selectedRaid && (
              <>
                <div style={{ fontSize: 11, letterSpacing: 2, color: DOMAIN_COLORS[selectedRaid.domain], marginBottom: 8 }}>
                  ⌜ RAID DIALOG ⌝
                </div>
                <div style={{ fontSize: 20, fontFamily: 'Cinzel, serif', marginBottom: 8 }}>{selectedRaid.name}</div>
                <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.78)', lineHeight: 1.45 }}>{selectedRaid.intro}</div>
                <div style={{ marginTop: 8, fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>{selectedRaid.flavor}</div>
                <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
                  <button
                    onClick={() => setIntroRaidId(null)}
                    style={{
                      flex: 1,
                      padding: '9px 10px',
                      borderRadius: 8,
                      border: '1px solid rgba(255,255,255,0.2)',
                      background: 'rgba(255,255,255,0.06)',
                      color: 'rgba(255,255,255,0.75)',
                      cursor: 'pointer',
                    }}
                  >
                    Hold
                  </button>
                  <button
                    onClick={async () => {
                      setIntroRaidId(null);
                      await runAutoBattle();
                    }}
                    style={{
                      flex: 1,
                      padding: '9px 10px',
                      borderRadius: 8,
                      border: `1px solid ${DOMAIN_COLORS[selectedRaid.domain]}88`,
                      background: `${DOMAIN_COLORS[selectedRaid.domain]}25`,
                      color: '#fff',
                      fontWeight: 700,
                      letterSpacing: 1,
                      cursor: 'pointer',
                    }}
                  >
                    Begin Battle
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
