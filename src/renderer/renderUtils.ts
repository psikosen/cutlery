// ============================================================
// RENDERER UTILITIES — Shared types, constants, and helpers
// ============================================================

import type { Creature, BodySlot } from '../types';
import type { CreaturePhenotype } from '../services/evolution';
import { createSeededRng } from '../utils/prng';

// Seeded random for deterministic rendering
export function seededRandom(seed: number): () => number {
  return createSeededRng(seed);
}

// Body slot positions (normalized 0-1 space)
export const SLOT_POSITIONS: Record<BodySlot, { x: number; y: number }> = {
  crown: { x: 0.5, y: 0.12 },
  left_horn: { x: 0.32, y: 0.08 },
  right_horn: { x: 0.68, y: 0.08 },
  left_shoulder: { x: 0.25, y: 0.28 },
  right_shoulder: { x: 0.75, y: 0.28 },
  chest: { x: 0.5, y: 0.35 },
  left_arm: { x: 0.15, y: 0.45 },
  right_arm: { x: 0.85, y: 0.45 },
  core: { x: 0.5, y: 0.52 },
  left_leg: { x: 0.35, y: 0.75 },
  right_leg: { x: 0.65, y: 0.75 },
  tail: { x: 0.5, y: 0.88 },
  left_wing: { x: 0.1, y: 0.3 },
  right_wing: { x: 0.9, y: 0.3 },
  aura: { x: 0.5, y: 0.5 },
};

export interface RenderContext {
  ctx: CanvasRenderingContext2D;
  w: number;
  h: number;
  time: number;
  creature: Creature;
  domainColor: string;
  rand: () => number;
  phenotype: CreaturePhenotype | null;
}

export function hexToRgb(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}

export function getGlossyColor(rand: () => number): string {
  const palette = [
    '#C0C0C0', '#D4D4D4', '#A8A8A8', // silver
    '#1a1a1a', '#2d2d2d', '#0d0d0d', // black
    '#FFD700', '#DAA520', '#B8860B', // gold
  ];
  return palette[Math.floor(rand() * palette.length)];
}
