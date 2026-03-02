export type SeedPart = string | number | boolean | null | undefined;

export interface RectBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export interface PoissonDiskOptions {
  minDistance: number;
  maxPoints?: number;
  attemptsPerPoint?: number;
  random?: () => number;
}

const FNV_OFFSET = 2166136261;
const FNV_PRIME = 16777619;
const UINT_32_MAX_PLUS_ONE = 4294967296;

export function deriveSeed(...parts: SeedPart[]): number {
  let hash = FNV_OFFSET;
  const payload = parts
    .map((part) => String(part ?? ''))
    .join('|');

  for (let i = 0; i < payload.length; i += 1) {
    hash ^= payload.charCodeAt(i);
    hash = Math.imul(hash, FNV_PRIME);
  }

  const normalized = hash >>> 0;
  return normalized === 0 ? 1 : normalized;
}

export function createSeededRng(seed: number): () => number {
  let s = (seed >>> 0) || 1;
  return () => {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / UINT_32_MAX_PLUS_ONE;
  };
}

export function randomInt(rand: () => number, min: number, max: number): number {
  const clampedMin = Math.ceil(Math.min(min, max));
  const clampedMax = Math.floor(Math.max(min, max));
  if (clampedMax <= clampedMin) return clampedMin;
  const span = clampedMax - clampedMin + 1;
  return clampedMin + Math.floor(rand() * span);
}

export function randomRange(rand: () => number, min: number, max: number): number {
  const low = Math.min(min, max);
  const high = Math.max(min, max);
  return low + rand() * (high - low);
}

export function samplePoissonDiskPoints(
  bounds: RectBounds,
  options: PoissonDiskOptions,
): Array<{ x: number; y: number }> {
  const width = bounds.maxX - bounds.minX;
  const height = bounds.maxY - bounds.minY;
  if (width <= 0 || height <= 0) return [];

  const minDistance = Math.max(1, options.minDistance);
  const maxPoints = options.maxPoints ?? 32;
  const attemptsPerPoint = options.attemptsPerPoint ?? 24;
  const rand = options.random ?? createSeededRng(deriveSeed(width, height, minDistance, maxPoints));

  const cellSize = minDistance / Math.sqrt(2);
  const gridWidth = Math.ceil(width / cellSize);
  const gridHeight = Math.ceil(height / cellSize);
  const grid: Array<{ x: number; y: number } | undefined> = new Array(gridWidth * gridHeight).fill(undefined);

  const points: Array<{ x: number; y: number }> = [];
  const active: Array<{ x: number; y: number }> = [];

  const gridIndex = (x: number, y: number) => {
    const gx = Math.floor((x - bounds.minX) / cellSize);
    const gy = Math.floor((y - bounds.minY) / cellSize);
    return { gx, gy, idx: gy * gridWidth + gx };
  };

  const inBounds = (x: number, y: number) => (
    x >= bounds.minX && x <= bounds.maxX && y >= bounds.minY && y <= bounds.maxY
  );

  const isFarEnough = (x: number, y: number) => {
    const { gx, gy } = gridIndex(x, y);
    for (let oy = -2; oy <= 2; oy += 1) {
      for (let ox = -2; ox <= 2; ox += 1) {
        const nx = gx + ox;
        const ny = gy + oy;
        if (nx < 0 || ny < 0 || nx >= gridWidth || ny >= gridHeight) continue;
        const neighbor = grid[ny * gridWidth + nx];
        if (!neighbor) continue;
        const dx = neighbor.x - x;
        const dy = neighbor.y - y;
        if ((dx * dx) + (dy * dy) < minDistance * minDistance) return false;
      }
    }
    return true;
  };

  const addPoint = (x: number, y: number) => {
    const point = { x, y };
    points.push(point);
    active.push(point);
    const { idx } = gridIndex(x, y);
    grid[idx] = point;
  };

  addPoint(
    randomRange(rand, bounds.minX, bounds.maxX),
    randomRange(rand, bounds.minY, bounds.maxY),
  );

  while (active.length > 0 && points.length < maxPoints) {
    const activeIdx = randomInt(rand, 0, active.length - 1);
    const anchor = active[activeIdx];
    let found = false;

    for (let attempt = 0; attempt < attemptsPerPoint; attempt += 1) {
      const angle = randomRange(rand, 0, Math.PI * 2);
      const radius = randomRange(rand, minDistance, minDistance * 2);
      const x = anchor.x + Math.cos(angle) * radius;
      const y = anchor.y + Math.sin(angle) * radius;

      if (!inBounds(x, y)) continue;
      if (!isFarEnough(x, y)) continue;
      addPoint(x, y);
      found = true;
      break;
    }

    if (!found) active.splice(activeIdx, 1);
  }

  return points;
}
