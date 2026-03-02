import { useEffect, useMemo, useState } from 'react';
import { useGame } from '../hooks/useGameState';
import type { Task, Domain, TaskType } from '../types';
import { DOMAIN_COLORS, GENE_STAT_KEYS } from '../types';

function extractMonIndex(path: string): number {
  const match = path.match(/mon(\d+)\.png$/i);
  return match ? Number(match[1]) : Number.MAX_SAFE_INTEGER;
}

const MON_CARD_IMAGES = Object.entries(
  import.meta.glob('../../assets/mon*.png', { eager: true, import: 'default' }) as Record<string, string>,
)
  .sort((a, b) => extractMonIndex(a[0]) - extractMonIndex(b[0]))
  .map(([, src]) => src);

function getTaskCardImage(taskId: string): string {
  if (MON_CARD_IMAGES.length === 0) return '';
  let hash = 2166136261;
  for (let i = 0; i < taskId.length; i += 1) {
    hash ^= taskId.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const index = (hash >>> 0) % MON_CARD_IMAGES.length;
  return MON_CARD_IMAGES[index];
}

const TASK_TYPES: { label: string; value: TaskType | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Daily', value: 'daily' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'Boss', value: 'boss' },
];

const DOMAINS: { label: string; value: Domain | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Health', value: 'health' },
  { label: 'Mind', value: 'mind' },
  { label: 'Discipline', value: 'discipline' },
  { label: 'Career', value: 'career' },
  { label: 'Finance', value: 'finance' },
  { label: 'Social', value: 'social' },
];

export function QuestScreen() {
  const { state, completeTask, completeTimeboxMission } = useGame();
  const [typeFilter, setTypeFilter] = useState<TaskType | 'all'>('all');
  const [domainFilter, setDomainFilter] = useState<Domain | 'all'>('all');
  const [completing, setCompleting] = useState<string | null>(null);
  const [timeboxStatus, setTimeboxStatus] = useState('');
  const [runningTimebox, setRunningTimebox] = useState<5 | 10 | 25 | null>(null);
  const [timeboxStartedAt, setTimeboxStartedAt] = useState<number | null>(null);
  const [clockNow, setClockNow] = useState(Date.now());

  useEffect(() => {
    if (!runningTimebox && !state.rescueMode.active) return undefined;
    const timer = window.setInterval(() => setClockNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [runningTimebox, state.rescueMode.active]);

  const scopedTasks = useMemo(() => {
    return state.tasks.filter(t => {
      if (typeFilter !== 'all' && t.type !== typeFilter) return false;
      if (domainFilter !== 'all' && t.domain !== domainFilter) return false;
      return true;
    });
  }, [state.tasks, typeFilter, domainFilter]);

  const completedTodayCount = useMemo(
    () => scopedTasks.filter((t) => t.type === 'daily' && t.completed_today).length,
    [scopedTasks],
  );

  const activeTasks = useMemo(
    () => scopedTasks.filter((t) => !(t.type === 'daily' && t.completed_today)),
    [scopedTasks],
  );

  const handleComplete = async (task: Task) => {
    if (task.completed_today || completing) return;
    setCompleting(task.id);
    await completeTask(task);
    setTimeout(() => setCompleting(null), 300);
  };

  const forecastRows = useMemo(() => {
    return state.shadowForecast.quests.map((entry) => {
      const task = state.tasks.find((candidate) => candidate.id === entry.task_id);
      return { ...entry, completed_today: Boolean(task?.completed_today) };
    });
  }, [state.shadowForecast.quests, state.tasks]);

  const rescueTasks = useMemo(() => {
    return state.rescueMode.quest_ids
      .map((questId) => state.tasks.find((task) => task.id === questId))
      .filter((task): task is Task => Boolean(task));
  }, [state.rescueMode.quest_ids, state.tasks]);

  const rescueSecondsLeft = useMemo(() => {
    if (!state.rescueMode.active || !state.rescueMode.expires_at) return 0;
    const expiresAt = Date.parse(state.rescueMode.expires_at);
    if (!Number.isFinite(expiresAt)) return 0;
    return Math.max(0, Math.floor((expiresAt - clockNow) / 1000));
  }, [state.rescueMode.active, state.rescueMode.expires_at, clockNow]);

  const timeboxMissions = state.timebox.missions as Array<{
    minutes: 5 | 10 | 25;
    label: string;
    reward_gold: number;
    completed: boolean;
  }>;
  const activeTimeboxMissions = timeboxMissions.filter((mission) => !mission.completed);
  const completedTimeboxCount = timeboxMissions.length - activeTimeboxMissions.length;

  const runningElapsed = runningTimebox && timeboxStartedAt
    ? Math.max(0, Math.floor((clockNow - timeboxStartedAt) / 1000))
    : 0;

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className="app-screen quest-screen" style={{ padding: '16px 16px 80px', maxWidth: 480, margin: '0 auto' }}>
      <div style={{ fontSize: 11, letterSpacing: 3, color: '#00ccff', marginBottom: 12, fontWeight: 600 }}>
        ⌜ QUESTS ⌝
      </div>

      <div style={{ display: 'grid', gap: 10, marginBottom: 14 }}>
        <div style={{
          padding: '10px 12px',
          borderRadius: 10,
          border: '1px solid rgba(0, 204, 255, 0.25)',
          background: 'rgba(10, 15, 30, 0.82)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <div style={{ fontSize: 11, letterSpacing: 2, color: '#00ccff', fontWeight: 700 }}>SHADOW FORECAST</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>
              {state.shadowForecast.completed_today}/{state.shadowForecast.quests.length} complete
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {forecastRows.map((entry, index) => (
              <div
                key={entry.task_id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  borderRadius: 8,
                  border: `1px solid ${DOMAIN_COLORS[entry.domain]}2f`,
                  background: entry.completed_today ? 'rgba(120,255,195,0.08)' : 'rgba(255,255,255,0.03)',
                  padding: '6px 8px',
                }}
              >
                <div style={{
                  width: 18,
                  height: 18,
                  borderRadius: 9,
                  border: '1px solid rgba(255,255,255,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 10,
                  color: 'rgba(255,255,255,0.75)',
                  fontWeight: 700,
                }}>
                  {index + 1}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, color: '#fff', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {entry.name}
                  </div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>
                    Impact {entry.impact_score} • {entry.type}
                  </div>
                </div>
                <div style={{
                  fontSize: 10,
                  color: entry.completed_today ? '#7BFFC3' : DOMAIN_COLORS[entry.domain],
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                  fontWeight: 700,
                }}>
                  {entry.completed_today ? 'Done' : entry.domain}
                </div>
              </div>
            ))}
          </div>
        </div>

        {(state.rescueMode.active || state.rescueMode.resolved) && (
          <div style={{
            padding: '10px 12px',
            borderRadius: 10,
            border: `1px solid ${state.rescueMode.active ? 'rgba(255, 179, 90, 0.35)' : 'rgba(123,255,195,0.35)'}`,
            background: 'rgba(10, 15, 30, 0.82)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ fontSize: 11, letterSpacing: 2, color: state.rescueMode.active ? '#ffb35a' : '#7BFFC3', fontWeight: 700 }}>
                {state.rescueMode.active ? 'RESCUE MODE' : 'RESCUE MODE CLEARED'}
              </div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)' }}>
                {state.rescueMode.completed_count}/{state.rescueMode.required_count}
              </div>
            </div>
            {state.rescueMode.active && (
              <div style={{ marginBottom: 8, fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>
                Timer: {formatDuration(rescueSecondsLeft)} left
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {rescueTasks.map((task) => (
                <div
                  key={task.id}
                  style={{
                    borderRadius: 7,
                    border: `1px solid ${task.completed_today ? 'rgba(123,255,195,0.45)' : 'rgba(255,255,255,0.15)'}`,
                    background: task.completed_today ? 'rgba(123,255,195,0.1)' : 'rgba(255,255,255,0.03)',
                    padding: '6px 8px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: 8,
                    alignItems: 'center',
                  }}
                >
                  <div style={{ fontSize: 12, color: '#fff', fontWeight: 600 }}>{task.name}</div>
                  <div style={{ fontSize: 10, color: task.completed_today ? '#7BFFC3' : 'rgba(255,255,255,0.45)', letterSpacing: 1, textTransform: 'uppercase' }}>
                    {task.completed_today ? 'Cleared' : 'Pending'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{
          padding: '10px 12px',
          borderRadius: 10,
          border: '1px solid rgba(170, 102, 255, 0.35)',
          background: 'rgba(10, 15, 30, 0.82)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginBottom: 8, alignItems: 'center' }}>
            <div style={{ fontSize: 11, letterSpacing: 2, color: '#aa66ff', fontWeight: 700 }}>
              TIMEBOX MISSIONS (5 / 10 / 25)
            </div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.58)' }}>
              {completedTimeboxCount}/{timeboxMissions.length} completed today
            </div>
          </div>
          <div style={{ display: 'grid', gap: 8 }}>
            {activeTimeboxMissions.map((mission) => {
              const isRunning = runningTimebox === mission.minutes;
              const targetSeconds = mission.minutes * 60;
              return (
                <div
                  key={mission.minutes}
                  style={{
                    borderRadius: 8,
                    border: `1px solid ${mission.completed ? 'rgba(123,255,195,0.45)' : 'rgba(255,255,255,0.14)'}`,
                    background: mission.completed ? 'rgba(123,255,195,0.09)' : 'rgba(255,255,255,0.03)',
                    padding: '7px 8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 8,
                  }}
                >
                  <div>
                    <div style={{ fontSize: 12, color: '#fff', fontWeight: 700 }}>
                      {mission.minutes}m • {mission.label}
                    </div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>
                      Reward +{mission.reward_gold} gold
                      {isRunning ? ` • ${formatDuration(Math.min(targetSeconds, runningElapsed))}/${formatDuration(targetSeconds)}` : ''}
                    </div>
                  </div>
                  <button
                    onClick={async () => {
                      if (!isRunning) {
                        setRunningTimebox(mission.minutes);
                        setTimeboxStartedAt(Date.now());
                        setTimeboxStatus(`${mission.minutes}-minute mission started.`);
                        return;
                      }
                      const result = await completeTimeboxMission(mission.minutes);
                      setTimeboxStatus(result.message);
                      if (result.success) {
                        setRunningTimebox(null);
                        setTimeboxStartedAt(null);
                      }
                    }}
                    disabled={mission.completed}
                    style={{
                      padding: '7px 10px',
                      borderRadius: 7,
                      border: '1px solid #aa66ff66',
                      background: 'rgba(170,102,255,0.15)',
                      color: '#fff',
                      fontSize: 10,
                      letterSpacing: 1,
                      fontWeight: 700,
                      cursor: 'pointer',
                      minWidth: 96,
                    }}
                  >
                    {isRunning ? 'CLAIM' : 'START'}
                  </button>
                </div>
              );
            })}
          </div>
          {activeTimeboxMissions.length === 0 && (
            <div
              style={{
                padding: '8px 10px',
                borderRadius: 8,
                border: '1px solid rgba(123,255,195,0.35)',
                background: 'rgba(123,255,195,0.08)',
                color: 'rgba(220,255,240,0.82)',
                fontSize: 11,
              }}
            >
              All micro goals completed for today. They recharge at daily reset.
            </div>
          )}
          {timeboxStatus && (
            <div style={{ marginTop: 8, fontSize: 10, color: 'rgba(255,255,255,0.6)' }}>{timeboxStatus}</div>
          )}
        </div>
      </div>

      {/* Type Filter */}
      <div className="quest-filter-row" style={{ display: 'flex', gap: 6, marginBottom: 8, overflowX: 'auto' }}>
        {TASK_TYPES.map(tt => (
          <button
            key={tt.value}
            onClick={() => setTypeFilter(tt.value)}
            style={{
              padding: '6px 14px',
              border: `1px solid ${typeFilter === tt.value ? '#00ccff' : 'rgba(255,255,255,0.1)'}`,
              background: typeFilter === tt.value ? '#00ccff15' : 'transparent',
              color: typeFilter === tt.value ? '#00ccff' : 'rgba(255,255,255,0.5)',
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'Rajdhani, sans-serif',
              whiteSpace: 'nowrap',
            }}
          >
            {tt.label}
          </button>
        ))}
      </div>

      {/* Domain Filter */}
      <div className="quest-domain-row" style={{ display: 'flex', gap: 6, marginBottom: 16, overflowX: 'auto', paddingBottom: 4 }}>
        {DOMAINS.map(d => {
          const c = d.value !== 'all' ? DOMAIN_COLORS[d.value as Domain] : '#888';
          return (
            <button
              key={d.value}
              onClick={() => setDomainFilter(d.value)}
              style={{
                padding: '4px 10px',
                border: `1px solid ${domainFilter === d.value ? c : 'rgba(255,255,255,0.06)'}`,
                background: domainFilter === d.value ? c + '15' : 'transparent',
                color: domainFilter === d.value ? c : 'rgba(255,255,255,0.4)',
                borderRadius: 16,
                fontSize: 11,
                cursor: 'pointer',
                fontFamily: 'Rajdhani, sans-serif',
                whiteSpace: 'nowrap',
              }}
            >
              {d.label}
            </button>
          );
        })}
      </div>

      {completedTodayCount > 0 && (
        <div style={{ display: 'flex', marginBottom: 12 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 10px',
              borderRadius: 999,
              border: '1px solid rgba(0, 204, 255, 0.35)',
              background: 'rgba(0, 204, 255, 0.12)',
              color: '#7ee8ff',
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: 0.6,
              textTransform: 'uppercase',
            }}
          >
            <span>Completed Today</span>
            <span
              style={{
                minWidth: 18,
                height: 18,
                borderRadius: 9,
                background: 'rgba(0, 204, 255, 0.22)',
                border: '1px solid rgba(0, 204, 255, 0.45)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 10,
                color: '#b8f6ff',
              }}
            >
              {completedTodayCount}
            </span>
          </div>
        </div>
      )}

      {/* Task Cards */}
      <div className="quest-card-grid" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {activeTasks.map(task => {
          const color = DOMAIN_COLORS[task.domain];
          const isCompleted = task.completed_today;
          const isCompleting = completing === task.id;
          const statKey = GENE_STAT_KEYS[task.rewards.gene_type] || 'Power';
          const cardImage = getTaskCardImage(task.id);

          return (
            <div
              key={task.id}
              className="quest-card"
              style={{
                background: 'rgba(10, 15, 30, 0.9)',
                borderRadius: 12,
                border: `1px solid ${isCompleted ? 'rgba(255,255,255,0.06)' : color + '30'}`,
                overflow: 'hidden',
                opacity: isCompleted ? 0.5 : 1,
                transition: 'all 0.3s ease',
                transform: isCompleting ? 'scale(0.98)' : 'scale(1)',
              }}
            >
              {/* Image area - fallback */}
              <div style={{ position: 'relative', height: 120, overflow: 'hidden' }}>
                {cardImage ? (
                  <img
                    src={cardImage}
                    alt=""
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      objectPosition: 'center top',
                      filter: 'brightness(0.72) saturate(1.05)',
                    }}
                  />
                ) : (
                  <div style={{
                    width: '100%',
                    height: '100%',
                    background: 'linear-gradient(120deg, #132343, #2a1d3f)',
                  }} />
                )}
                <div style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: 60,
                  background: 'linear-gradient(transparent, rgba(10, 15, 30, 0.95))',
                }} />
                {/* Type badge */}
                <div style={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  padding: '2px 8px',
                  background: task.type === 'boss' ? '#ff44ff20' : task.type === 'emergency' ? '#ff444420' : 'rgba(0,0,0,0.5)',
                  border: `1px solid ${task.type === 'boss' ? '#ff44ff60' : task.type === 'emergency' ? '#ff444460' : 'rgba(255,255,255,0.1)'}`,
                  borderRadius: 4,
                  fontSize: 10,
                  color: task.type === 'boss' ? '#ff44ff' : task.type === 'emergency' ? '#ff4444' : '#888',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                }}>
                  {task.type}
                </div>
              </div>

              {/* Card body */}
              <div className="quest-card-body" style={{ padding: '12px 16px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 18 }}>{task.icon}</span>
                  <span style={{ fontSize: 16, fontWeight: 700, color: '#fff', flex: 1 }}>
                    {task.name}
                  </span>
                  {/* Difficulty dots */}
                  <div style={{ display: 'flex', gap: 3 }}>
                    {[1, 2, 3, 4, 5].map(d => (
                      <div key={d} style={{
                        width: 6, height: 6, borderRadius: 3,
                        background: d <= task.difficulty ? color : 'rgba(255,255,255,0.1)',
                      }} />
                    ))}
                  </div>
                </div>

                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: 'rgba(255,255,255,0.72)',
                    marginBottom: 10,
                    lineHeight: 1.45,
                  }}
                >
                  {task.description}
                </div>

                {/* Gene reward preview */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  marginBottom: 10,
                  padding: '6px 10px',
                  background: color + '10',
                  borderRadius: 6,
                  border: `1px solid ${color}20`,
                }}>
                  <span style={{ fontSize: 14 }}>🧬</span>
                  <span style={{ fontSize: 12, color: color, fontWeight: 600 }}>
                    Gene: {task.rewards.gene_type.replace(/_/g, ' ')}
                  </span>
                </div>

                {/* Rewards chips */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <div style={{
                    padding: '3px 8px',
                    background: color + '15',
                    border: `1px solid ${color}30`,
                    borderRadius: 4,
                    fontSize: 11,
                    color: color,
                    fontWeight: 600,
                  }}>
                    +{statKey}
                  </div>
                  <div style={{
                    padding: '3px 8px',
                    background: 'rgba(255,255,255,0.05)',
                    borderRadius: 4,
                    fontSize: 11,
                    color: 'rgba(255,255,255,0.6)',
                  }}>
                    +{task.rewards.xp}XP
                  </div>
                  <div style={{
                    padding: '3px 8px',
                    background: 'rgba(255,170,0,0.1)',
                    borderRadius: 4,
                    fontSize: 11,
                    color: '#FFD700',
                  }}>
                    +{task.rewards.gold}G
                  </div>
                </div>

                {/* Complete button */}
                <button
                  onClick={() => handleComplete(task)}
                  disabled={isCompleted || !!completing}
                  style={{
                    width: '100%',
                    padding: '10px 0',
                    background: isCompleted
                      ? 'rgba(255,255,255,0.05)'
                      : `linear-gradient(135deg, ${color}30, ${color}15)`,
                    border: `1px solid ${isCompleted ? 'rgba(255,255,255,0.06)' : color + '50'}`,
                    borderRadius: 8,
                    color: isCompleted ? 'rgba(255,255,255,0.3)' : '#fff',
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: isCompleted ? 'default' : 'pointer',
                    fontFamily: 'Rajdhani, sans-serif',
                    letterSpacing: 2,
                    transition: 'all 0.2s ease',
                  }}
                >
                  {isCompleted ? 'COMPLETED' : isCompleting ? 'ACQUIRING GENE...' : 'COMPLETE'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {activeTasks.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: 40,
          color: 'rgba(255,255,255,0.3)',
          fontSize: 14,
        }}>
          {scopedTasks.length === 0
            ? 'No quests match the current filters'
            : 'All matching daily quests are completed today. They recharge after daily reset.'}
        </div>
      )}
    </div>
  );
}
