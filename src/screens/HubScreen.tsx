import { useEffect, useMemo, useState } from 'react';
import { useGame } from '../hooks/useGameState';
import { CreatureCanvas } from '../components/creatures/CreatureCanvas';
import { RadarChart } from '../components/RadarChart';
import type { Domain } from '../types';
import {
  CREATURE_NAMES, EVOLUTION_STAGE_NAMES, DOMAIN_COLORS,
  DOMAIN_TO_CREATURE,
} from '../types';

const DOMAINS: Domain[] = ['health', 'mind', 'discipline', 'career', 'finance', 'social'];

export function HubScreen() {
  const {
    state,
    selectCreature,
    setTab,
    renameCreature,
    feedCreature,
    petCreature,
    addWatchTimeForCreature,
    claimWeeklyPulseReward,
  } = useGame();
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const [feedBurstKey, setFeedBurstKey] = useState(0);
  const [petBurstKey, setPetBurstKey] = useState(0);
  const [feedStatus, setFeedStatus] = useState('');
  const [petStatus, setPetStatus] = useState('');
  const [pulseStatus, setPulseStatus] = useState('');
  const { player, creatures, genes } = state;

  if (!player) return null;

  const activeCreatureId = state.selectedCreature || 'gore_maw';
  const activeCreature = creatures.find(c => c.id === activeCreatureId) || creatures[0];
  const displayName = activeCreature?.custom_name?.trim() || CREATURE_NAMES[activeCreatureId];
  const today = new Date().toISOString().split('T')[0];
  const creatureLastFeedDate = state.lastFeedDates[activeCreatureId] || null;
  const activeCreatureHappiness = Math.max(0, Math.min(100, state.creatureHappiness[activeCreatureId] ?? 50));
  const canFeedToday = creatureLastFeedDate !== today;
  const nutrition = state.nutrition;
  const longevity = nutrition.longevity;
  const targetsV2 = nutrition.targets_v2;
  const mediterraneanArc = nutrition.mediterranean_arc;
  const weeklyPulse = nutrition.weekly_pulse;
  const ritualStreak = nutrition.ritual_streak;
  const canClaimPulseReward = weeklyPulse.servings >= weeklyPulse.target && !weeklyPulse.reward_claimed;
  const pulseRingRadius = 22;
  const pulseRingCircumference = 2 * Math.PI * pulseRingRadius;
  const pulseRingDash = pulseRingCircumference * weeklyPulse.progress;
  const longevityPillarLabels: { key: keyof typeof longevity.pillars; label: string }[] = [
    { key: 'legumes', label: 'Legumes' },
    { key: 'produce_fiber', label: 'Produce/Fiber' },
    { key: 'salt_sugar', label: 'Salt/Sugar' },
    { key: 'hydration', label: 'Hydration' },
    { key: 'healthy_fats', label: 'Fats/Fish' },
    { key: 'whole_foods', label: 'Whole Foods' },
    { key: 'rituals', label: 'Rituals' },
  ];
  type NutritionTargetKey =
    | 'produce400'
    | 'fiber25'
    | 'legumes'
    | 'hydration'
    | 'salt_guard'
    | 'sugar_guard'
    | 'healthy_fats'
    | 'whole_foods';
  const nutritionTargetLabels: { key: NutritionTargetKey; label: string }[] = [
    { key: 'produce400', label: 'Produce 400g' },
    { key: 'fiber25', label: 'Fiber 25g+' },
    { key: 'legumes', label: 'Legumes' },
    { key: 'hydration', label: 'Hydration' },
    { key: 'salt_guard', label: 'Salt Guard' },
    { key: 'sugar_guard', label: 'Sugar Guard' },
    { key: 'healthy_fats', label: 'Healthy Fats' },
    { key: 'whole_foods', label: 'Whole Foods' },
  ];

  useEffect(() => {
    setRenameValue(displayName || '');
    setIsRenaming(false);
    setFeedStatus('');
    setPetStatus('');
    setPulseStatus('');
  }, [activeCreatureId, displayName]);

  useEffect(() => {
    if (!activeCreatureId) return;
    const trackIntervalMs = 20000;
    const watchChunkSeconds = 20;
    const timer = window.setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      void addWatchTimeForCreature(activeCreatureId, watchChunkSeconds);
    }, trackIntervalMs);
    return () => window.clearInterval(timer);
  }, [activeCreatureId, addWatchTimeForCreature]);

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

  // Recent gene feed (expanded for web/mobile visibility)
  const recentGenes = genes.slice(-10).reverse();

  return (
    <div className="app-screen hub-screen" style={{ padding: '16px 16px 80px', maxWidth: 480, margin: '0 auto' }}>
      {/* Hunter Rank Header */}
      <div className="hub-rank-header" style={{
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
      <div className="hub-player-bar" style={{
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
      <div className="hub-active-card" style={{
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
            wander
            foodBurstKey={feedBurstKey}
            petBurstKey={petBurstKey}
            style={{ margin: '0 auto', display: 'block' }}
            onClick={async () => {
              if (!activeCreature) return;
              const result = await petCreature(activeCreature.id);
              setPetStatus(result.message);
              if (result.success) {
                setPetBurstKey(Date.now());
              }
            }}
          />
        )}
        <div style={{ marginTop: 8 }}>
          {isRenaming ? (
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', alignItems: 'center', marginBottom: 8 }}>
              <input
                type="text"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                maxLength={28}
                autoFocus
                style={{
                  width: 180,
                  padding: '6px 8px',
                  background: 'rgba(0,0,0,0.35)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: 6,
                  color: '#fff',
                  fontSize: 14,
                  fontFamily: 'Rajdhani, sans-serif',
                }}
              />
              <button
                onClick={async () => {
                  if (!activeCreature) return;
                  await renameCreature(activeCreature.id, renameValue);
                  setIsRenaming(false);
                }}
                style={{
                  padding: '6px 10px',
                  fontSize: 11,
                  borderRadius: 6,
                  border: '1px solid #00ccff50',
                  background: 'rgba(0, 204, 255, 0.15)',
                  color: '#fff',
                  cursor: 'pointer',
                }}
              >
                Save
              </button>
              <button
                onClick={() => {
                  setRenameValue(displayName || '');
                  setIsRenaming(false);
                }}
                style={{
                  padding: '6px 10px',
                  fontSize: 11,
                  borderRadius: 6,
                  border: '1px solid rgba(255,255,255,0.2)',
                  background: 'rgba(255,255,255,0.08)',
                  color: 'rgba(255,255,255,0.8)',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsRenaming(true)}
              style={{
                fontSize: 20,
                fontWeight: 700,
                color: '#fff',
                fontFamily: 'Cinzel, serif',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
              }}
              title="Click to rename"
            >
              {displayName}
            </button>
          )}
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>
            Click creature to pet | Click name to rename
          </div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>
            Stage: {EVOLUTION_STAGE_NAMES[activeCreature?.evolution_stage || 0]} — {activeCreature?.total_genes || 0} Genes — Power: {activeCreature?.total_power || 0}
          </div>
          <div style={{ marginTop: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
              <span style={{ color: '#ff7ec6', letterSpacing: 1 }}>HAPPINESS</span>
              <span style={{ color: '#fff', fontWeight: 700 }}>{activeCreatureHappiness}%</span>
            </div>
            <div style={{
              height: 7,
              background: 'rgba(255,255,255,0.1)',
              borderRadius: 6,
              overflow: 'hidden',
            }}>
              <div style={{
                width: `${activeCreatureHappiness}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #ff7ec6, #ff5fa1)',
                borderRadius: 6,
                transition: 'width 0.25s ease',
              }} />
            </div>
          </div>
          <div style={{ marginTop: 10 }}>
            <button
              onClick={() => {
                if (!activeCreature) return;
                selectCreature(activeCreature.id);
                setTab('creatures');
              }}
              style={{
                marginBottom: 8,
                padding: '8px 12px',
                borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.2)',
                background: 'rgba(255,255,255,0.06)',
                color: '#fff',
                fontSize: 11,
                letterSpacing: 1,
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              VIEW CREATURE DETAILS
            </button>
          </div>
          <div>
            <button
              onClick={async () => {
                if (!activeCreature) return;
                const result = await feedCreature(activeCreature.id);
                setFeedStatus(result.message);
                if (result.success) {
                  setFeedBurstKey(Date.now());
                }
              }}
              disabled={!canFeedToday}
              style={{
                padding: '8px 12px',
                borderRadius: 8,
                border: `1px solid ${canFeedToday ? DOMAIN_COLORS[activeCreature?.domain || 'health'] + '66' : 'rgba(255,255,255,0.15)'}`,
                background: canFeedToday ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.03)',
                color: canFeedToday ? '#fff' : 'rgba(255,255,255,0.35)',
                fontSize: 12,
                letterSpacing: 1,
                cursor: canFeedToday ? 'pointer' : 'default',
                fontWeight: 600,
              }}
            >
              {canFeedToday ? 'FEED PARTICLES (DAILY)' : 'FED TODAY (THIS CREATURE)'}
            </button>
            {feedStatus && (
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 6 }}>
                {feedStatus}
              </div>
            )}
            {petStatus && (
              <div style={{ fontSize: 11, color: 'rgba(255,126,198,0.8)', marginTop: 4 }}>
                {petStatus}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Daily Summary */}
      <div className="hub-daily-progress" style={{
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

      <div className="hub-selector-pulse-row" style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
        {/* Domain Creature Quick-Switch */}
        <div className="hub-domain-switch" style={{
          display: 'flex',
          gap: 8,
          overflowX: 'auto',
          paddingBottom: 8,
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

        <div className="hub-weekly-pulse" style={{
          background: 'rgba(10, 15, 30, 0.84)',
          borderRadius: 10,
          border: '1px solid rgba(0, 204, 255, 0.25)',
          padding: '12px 12px 10px',
        }}>
          <div style={{ fontSize: 11, letterSpacing: 2, color: '#00ccff', marginBottom: 8 }}>WEEKLY PULSE</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <svg width="56" height="56" viewBox="0 0 56 56">
              <circle cx="28" cy="28" r={pulseRingRadius} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="5" />
              <circle
                cx="28"
                cy="28"
                r={pulseRingRadius}
                fill="none"
                stroke="#00ccff"
                strokeWidth="5"
                strokeLinecap="round"
                strokeDasharray={`${pulseRingDash} ${pulseRingCircumference - pulseRingDash}`}
                transform="rotate(-90 28 28)"
              />
              <text x="28" y="32" textAnchor="middle" fill="#fff" style={{ fontSize: 11, fontWeight: 700, fontFamily: 'Rajdhani, sans-serif' }}>
                {weeklyPulse.servings}/{weeklyPulse.target}
              </text>
            </svg>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', marginBottom: 6 }}>
                Week starts: {weeklyPulse.week_start}
              </div>
              <button
                onClick={async () => {
                  const result = await claimWeeklyPulseReward();
                  setPulseStatus(result.message);
                }}
                disabled={!canClaimPulseReward}
                style={{
                  width: '100%',
                  padding: '6px 8px',
                  borderRadius: 7,
                  border: `1px solid ${canClaimPulseReward ? '#00ccff66' : 'rgba(255,255,255,0.15)'}`,
                  background: canClaimPulseReward ? 'rgba(0,204,255,0.12)' : 'rgba(255,255,255,0.04)',
                  color: canClaimPulseReward ? '#fff' : 'rgba(255,255,255,0.35)',
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: 1,
                  cursor: canClaimPulseReward ? 'pointer' : 'default',
                }}
              >
                {weeklyPulse.reward_claimed ? 'REWARD CLAIMED' : `CLAIM +${weeklyPulse.reward_gold}G`}
              </button>
            </div>
          </div>
          {pulseStatus && (
            <div style={{ marginTop: 6, fontSize: 10, color: 'rgba(255,255,255,0.48)' }}>{pulseStatus}</div>
          )}
        </div>
      </div>

      {/* Longevity + Nutrition Systems */}
      <div className="hub-nutrition-block" style={{ marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{
          background: 'rgba(10, 15, 30, 0.84)',
          borderRadius: 10,
          border: '1px solid rgba(120, 255, 190, 0.22)',
          padding: '12px 14px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
            <div style={{ fontSize: 11, letterSpacing: 2, color: '#7BFFC3' }}>LONGEVITY SCORE</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#fff', fontFamily: 'Rajdhani, sans-serif' }}>
              {longevity.score}
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginLeft: 4 }}>/100</span>
            </div>
          </div>
          <div style={{
            height: 8,
            background: 'rgba(255,255,255,0.08)',
            borderRadius: 6,
            overflow: 'hidden',
            marginBottom: 8,
          }}>
            <div style={{
              width: `${longevity.score}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #44dd88, #7BFFC3)',
              borderRadius: 6,
              transition: 'width 0.3s ease',
            }} />
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>
            Pillars: {longevity.pillars_completed}/{longevity.pillars_total}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {longevityPillarLabels.map((pillar) => {
              const active = longevity.pillars[pillar.key];
              return (
                <div
                  key={pillar.key}
                  style={{
                    padding: '3px 8px',
                    borderRadius: 999,
                    fontSize: 10,
                    border: `1px solid ${active ? 'rgba(123,255,195,0.45)' : 'rgba(255,255,255,0.12)'}`,
                    color: active ? '#7BFFC3' : 'rgba(255,255,255,0.45)',
                    background: active ? 'rgba(123,255,195,0.1)' : 'rgba(255,255,255,0.04)',
                  }}
                >
                  {pillar.label}
                </div>
              );
            })}
          </div>
        </div>

        <div className="hub-split-row" style={{ display: 'flex', gap: 10 }}>
          <div style={{
            flex: 1,
            background: 'rgba(10, 15, 30, 0.84)',
            borderRadius: 10,
            border: '1px solid rgba(255, 153, 122, 0.28)',
            padding: '12px 12px 10px',
          }}>
            <div style={{ fontSize: 11, letterSpacing: 2, color: '#ff997a', marginBottom: 8 }}>RITUAL STREAK</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)' }}>Current</div>
                <div style={{ fontSize: 22, color: '#fff', fontWeight: 700, fontFamily: 'Rajdhani, sans-serif' }}>
                  {ritualStreak.current}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)' }}>Best</div>
                <div style={{ fontSize: 22, color: '#fff', fontWeight: 700, fontFamily: 'Rajdhani, sans-serif' }}>
                  {ritualStreak.best}
                </div>
              </div>
            </div>
            <div style={{ fontSize: 11, color: ritualStreak.today_completed ? '#7BFFC3' : 'rgba(255,255,255,0.45)' }}>
              {ritualStreak.today_completed
                ? `Ritual done today (${ritualStreak.today_count})`
                : 'No ritual completed today'}
            </div>
            {ritualStreak.last_completed_date && (
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 4 }}>
                Last: {ritualStreak.last_completed_date}
              </div>
            )}
          </div>
        </div>

        <div className="hub-split-row" style={{ display: 'flex', gap: 10 }}>
          <div style={{
            flex: 1,
            background: 'rgba(10, 15, 30, 0.84)',
            borderRadius: 10,
            border: '1px solid rgba(120, 220, 255, 0.26)',
            padding: '12px 12px 10px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ fontSize: 11, letterSpacing: 2, color: '#79d8ff' }}>NUTRITION TARGETS V2</div>
              <div style={{ fontSize: 14, color: '#fff', fontWeight: 700 }}>
                {targetsV2.completed}/{targetsV2.total}
              </div>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {nutritionTargetLabels.map((target) => {
                const active = Boolean(targetsV2[target.key]);
                return (
                  <div
                    key={target.key}
                    style={{
                      padding: '3px 7px',
                      borderRadius: 999,
                      fontSize: 10,
                      border: `1px solid ${active ? 'rgba(121,216,255,0.45)' : 'rgba(255,255,255,0.12)'}`,
                      color: active ? '#79d8ff' : 'rgba(255,255,255,0.45)',
                      background: active ? 'rgba(121,216,255,0.1)' : 'rgba(255,255,255,0.04)',
                    }}
                  >
                    {target.label}
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{
            flex: 1,
            background: 'rgba(10, 15, 30, 0.84)',
            borderRadius: 10,
            border: '1px solid rgba(255, 215, 120, 0.24)',
            padding: '12px 12px 10px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, alignItems: 'baseline' }}>
              <div style={{ fontSize: 11, letterSpacing: 2, color: '#ffd778' }}>MEDITERRANEAN ARC</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.68)' }}>{mediterraneanArc.phase}</div>
            </div>
            <div style={{
              height: 7,
              background: 'rgba(255,255,255,0.08)',
              borderRadius: 6,
              overflow: 'hidden',
              marginBottom: 6,
            }}>
              <div style={{
                width: `${Math.round(mediterraneanArc.progress * 100)}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #d3a846, #ffd778)',
                borderRadius: 6,
                transition: 'width 0.3s ease',
              }} />
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', marginBottom: 8 }}>
              {mediterraneanArc.completed}/{mediterraneanArc.total} arc quests completed
            </div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', minHeight: 28 }}>
              {mediterraneanArc.next_quest ? `Next: ${mediterraneanArc.next_quest}` : 'Arc completed. Hold the standard.'}
            </div>
            <button
              onClick={() => setTab('quests')}
              style={{
                marginTop: 8,
                width: '100%',
                padding: '6px 8px',
                borderRadius: 7,
                border: '1px solid rgba(255, 215, 120, 0.4)',
                background: 'rgba(255, 215, 120, 0.1)',
                color: '#ffd778',
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: 1,
                cursor: 'pointer',
              }}
            >
              OPEN ARC QUESTS
            </button>
          </div>
        </div>
      </div>

      {/* Domain Power Radar Chart */}
      <div className="hub-radar" style={{ marginBottom: 16 }}>
        <RadarChart data={domainPower} size={280} />
      </div>

      {/* Gene Feed */}
      <div className="hub-gene-feed" style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, letterSpacing: 2, color: '#aa66ff', marginBottom: 8 }}>RECENT GENES</div>
        {recentGenes.length > 0 ? (
          recentGenes.map(gene => (
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
          ))
        ) : (
          <div style={{
            padding: '10px 12px',
            background: 'rgba(10, 15, 30, 0.6)',
            borderRadius: 6,
            border: '1px solid rgba(255,255,255,0.08)',
            fontSize: 11,
            color: 'rgba(255,255,255,0.45)',
          }}>
            No genes acquired yet. Complete quests to start mutation logs.
          </div>
        )}
      </div>
    </div>
  );
}
