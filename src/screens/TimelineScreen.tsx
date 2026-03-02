import { useMemo } from 'react';
import { useGame } from '../hooks/useGameState';
import type { TimelineEvent } from '../hooks/useGameState';
import { DOMAIN_COLORS } from '../types';

const KIND_COLORS: Record<TimelineEvent['kind'], string> = {
  task: '#00ccff',
  evolution: '#ff6aff',
  raid: '#ff5f5f',
  rescue: '#ffb347',
  streak: '#7bffc3',
  bond: '#ff7ec6',
  calendar: '#ffd778',
  forecast: '#79d8ff',
  system: '#9aa6c7',
};

const KIND_LABELS: Record<TimelineEvent['kind'], string> = {
  task: 'Task',
  evolution: 'Evolution',
  raid: 'Raid',
  rescue: 'Rescue',
  streak: 'Streak',
  bond: 'Bond',
  calendar: 'Calendar',
  forecast: 'Forecast',
  system: 'System',
};

function toHumanTimestamp(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function TimelineScreen() {
  const { state } = useGame();
  const events = state.timeline;

  const chartData = useMemo(() => {
    const days = 10;
    const buckets: Array<{ label: string; count: number }> = [];
    for (let i = days - 1; i >= 0; i -= 1) {
      const day = new Date();
      day.setDate(day.getDate() - i);
      const key = day.toISOString().slice(0, 10);
      const count = events.filter((event) => event.date.slice(0, 10) === key).length;
      buckets.push({
        label: day.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        count,
      });
    }
    const peak = Math.max(1, ...buckets.map((bucket) => bucket.count));
    return { buckets, peak };
  }, [events]);

  const byKind = useMemo(() => {
    const counts: Partial<Record<TimelineEvent['kind'], number>> = {};
    for (const event of events) {
      counts[event.kind] = (counts[event.kind] || 0) + 1;
    }
    return counts;
  }, [events]);

  return (
    <div className="app-screen timeline-screen" style={{ padding: '16px 16px 80px', maxWidth: 980, margin: '0 auto' }}>
      <div style={{ fontSize: 11, letterSpacing: 3, color: '#79d8ff', marginBottom: 12, fontWeight: 700 }}>
        ⌜ SHADOW TIMELINE ⌝
      </div>

      <div
        style={{
          background: 'rgba(10, 15, 30, 0.86)',
          borderRadius: 12,
          border: '1px solid rgba(121,216,255,0.32)',
          padding: 14,
          marginBottom: 14,
        }}
      >
        <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 8 }}>
          Chronicle Activity (Last 10 Days)
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${chartData.buckets.length}, minmax(0, 1fr))`, gap: 8, alignItems: 'end' }}>
          {chartData.buckets.map((bucket) => {
            const height = Math.max(6, Math.round((bucket.count / chartData.peak) * 90));
            return (
              <div key={bucket.label} style={{ textAlign: 'center' }}>
                <div
                  style={{
                    height,
                    borderRadius: 6,
                    background: 'linear-gradient(180deg, rgba(0,204,255,0.9), rgba(170,102,255,0.45))',
                    border: '1px solid rgba(255,255,255,0.12)',
                    marginBottom: 4,
                  }}
                />
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.52)' }}>{bucket.label}</div>
                <div style={{ fontSize: 10, color: '#fff', fontWeight: 700 }}>{bucket.count}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
        {(Object.keys(KIND_LABELS) as TimelineEvent['kind'][]).map((kind) => (
          <div
            key={kind}
            style={{
              padding: '5px 10px',
              borderRadius: 999,
              border: `1px solid ${KIND_COLORS[kind]}55`,
              background: `${KIND_COLORS[kind]}14`,
              color: KIND_COLORS[kind],
              fontSize: 10,
              letterSpacing: 1,
              fontWeight: 700,
              textTransform: 'uppercase',
            }}
          >
            {KIND_LABELS[kind]} {byKind[kind] || 0}
          </div>
        ))}
      </div>

      <div style={{ position: 'relative', paddingLeft: 16 }}>
        <div
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: 5,
            width: 2,
            background: 'linear-gradient(180deg, rgba(0,204,255,0.5), rgba(170,102,255,0.15))',
          }}
        />

        {events.length > 0 ? (
          events.slice(0, 80).map((event) => {
            const accent = event.domain ? DOMAIN_COLORS[event.domain] : KIND_COLORS[event.kind];
            return (
              <div
                key={event.id}
                style={{
                  position: 'relative',
                  marginBottom: 10,
                  background: 'rgba(10, 15, 30, 0.84)',
                  borderRadius: 10,
                  border: `1px solid ${accent}36`,
                  padding: '10px 12px 10px 14px',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    left: -15,
                    top: 14,
                    width: 10,
                    height: 10,
                    borderRadius: 5,
                    background: accent,
                    boxShadow: `0 0 10px ${accent}88`,
                  }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'baseline' }}>
                  <div style={{ fontSize: 14, color: '#fff', fontWeight: 700 }}>{event.title}</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', whiteSpace: 'nowrap' }}>
                    {toHumanTimestamp(event.date)}
                  </div>
                </div>
                <div style={{ marginTop: 4, fontSize: 12, color: 'rgba(255,255,255,0.62)', lineHeight: 1.45 }}>
                  {event.detail}
                </div>
                <div
                  style={{
                    marginTop: 6,
                    fontSize: 10,
                    color: accent,
                    letterSpacing: 1,
                    textTransform: 'uppercase',
                    fontWeight: 700,
                  }}
                >
                  {KIND_LABELS[event.kind]}
                  {event.domain ? ` • ${event.domain}` : ''}
                </div>
              </div>
            );
          })
        ) : (
          <div
            style={{
              padding: '12px 14px',
              borderRadius: 10,
              border: '1px solid rgba(255,255,255,0.12)',
              background: 'rgba(10,15,30,0.8)',
              color: 'rgba(255,255,255,0.55)',
              fontSize: 12,
            }}
          >
            Timeline is empty. Complete quests, raids, and milestones to populate your chronicle.
          </div>
        )}
      </div>
    </div>
  );
}
