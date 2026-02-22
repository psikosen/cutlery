import type { Domain } from '../types';
import { DOMAIN_COLORS } from '../types';

interface RadarChartProps {
  /** Values per domain, keyed by Domain */
  data: Record<Domain, number>;
  /** Size of the chart (width and height) */
  size?: number;
}

const DOMAINS: Domain[] = ['health', 'mind', 'discipline', 'career', 'finance', 'social'];
const DOMAIN_LABELS: Record<Domain, string> = {
  health: 'Health',
  mind: 'Mind',
  discipline: 'Discipline',
  career: 'Career',
  finance: 'Finance',
  social: 'Social',
};

const RING_COUNT = 4;

function polarToCartesian(cx: number, cy: number, radius: number, angleRad: number) {
  return {
    x: cx + radius * Math.cos(angleRad),
    y: cy + radius * Math.sin(angleRad),
  };
}

export function RadarChart({ data, size = 280 }: RadarChartProps) {
  const cx = size / 2;
  const cy = size / 2;
  const maxRadius = size * 0.36;
  const labelRadius = size * 0.46;
  const angleStep = (2 * Math.PI) / DOMAINS.length;
  // Start from top (-90 degrees)
  const startAngle = -Math.PI / 2;

  // Normalize values: find max and use it for scaling.
  // If all values are 0 we avoid division by zero.
  const values = DOMAINS.map(d => data[d] || 0);
  const maxValue = Math.max(...values, 1);

  // Build the data polygon points
  const dataPoints = DOMAINS.map((_, i) => {
    const angle = startAngle + i * angleStep;
    const ratio = values[i] / maxValue;
    return polarToCartesian(cx, cy, maxRadius * ratio, angle);
  });
  const dataPath = dataPoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ') + ' Z';

  // Build ring polygons (background grid)
  const rings = Array.from({ length: RING_COUNT }, (_, ringIdx) => {
    const ringRadius = maxRadius * ((ringIdx + 1) / RING_COUNT);
    const pts = DOMAINS.map((_, i) => {
      const angle = startAngle + i * angleStep;
      return polarToCartesian(cx, cy, ringRadius, angle);
    });
    return pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ') + ' Z';
  });

  // Axis lines from center to each vertex
  const axes = DOMAINS.map((_, i) => {
    const angle = startAngle + i * angleStep;
    const end = polarToCartesian(cx, cy, maxRadius, angle);
    return { x1: cx, y1: cy, x2: end.x, y2: end.y };
  });

  // Label positions
  const labels = DOMAINS.map((domain, i) => {
    const angle = startAngle + i * angleStep;
    const pos = polarToCartesian(cx, cy, labelRadius, angle);
    return { domain, ...pos, value: values[i] };
  });

  // Gradient ID
  const gradId = 'radar-fill-grad';

  return (
    <div style={{
      background: 'rgba(10, 15, 30, 0.8)',
      borderRadius: 12,
      border: '1px solid rgba(255,255,255,0.06)',
      padding: '14px 14px 10px',
    }}>
      <div style={{ fontSize: 11, letterSpacing: 2, color: '#00ccff', marginBottom: 4 }}>
        DOMAIN POWER
      </div>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ display: 'block', margin: '0 auto' }}
      >
        <defs>
          <radialGradient id={gradId} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#00ccff" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#aa66ff" stopOpacity={0.15} />
          </radialGradient>
        </defs>

        {/* Background rings */}
        {rings.map((d, i) => (
          <path
            key={`ring-${i}`}
            d={d}
            fill="none"
            stroke="rgba(255,255,255,0.07)"
            strokeWidth={1}
          />
        ))}

        {/* Axis lines */}
        {axes.map((a, i) => (
          <line
            key={`axis-${i}`}
            x1={a.x1} y1={a.y1} x2={a.x2} y2={a.y2}
            stroke="rgba(255,255,255,0.08)"
            strokeWidth={1}
          />
        ))}

        {/* Data polygon fill */}
        <path
          d={dataPath}
          fill={`url(#${gradId})`}
          stroke="none"
        />

        {/* Data polygon border */}
        <path
          d={dataPath}
          fill="none"
          stroke="#00ccff"
          strokeWidth={1.5}
          strokeLinejoin="round"
          opacity={0.8}
        />

        {/* Data point dots */}
        {dataPoints.map((p, i) => (
          <circle
            key={`dot-${i}`}
            cx={p.x}
            cy={p.y}
            r={3.5}
            fill={DOMAIN_COLORS[DOMAINS[i]]}
            stroke="rgba(0,0,0,0.5)"
            strokeWidth={1}
          />
        ))}

        {/* Labels */}
        {labels.map(({ domain, x, y, value }) => {
          // Adjust text anchor based on position relative to center
          const dx = x - cx;
          let textAnchor: 'start' | 'middle' | 'end' = 'middle';
          if (dx > 5) textAnchor = 'start';
          else if (dx < -5) textAnchor = 'end';

          const dy = y - cy;
          let yOffset = 0;
          if (dy < -5) yOffset = -4;
          else if (dy > 5) yOffset = 10;

          return (
            <g key={domain}>
              <text
                x={x}
                y={y + yOffset}
                textAnchor={textAnchor}
                fill={DOMAIN_COLORS[domain]}
                fontSize={10}
                fontWeight={600}
                fontFamily="Rajdhani, sans-serif"
              >
                {DOMAIN_LABELS[domain]}
              </text>
              <text
                x={x}
                y={y + yOffset + 12}
                textAnchor={textAnchor}
                fill="rgba(255,255,255,0.45)"
                fontSize={9}
                fontFamily="Rajdhani, sans-serif"
              >
                {value}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
