// ============================================================
// PHENOTYPE-DRIVEN RENDERING — Distortion, spines, plates, particles
// ============================================================

import type { CreaturePhenotype } from '../services/evolution';
import type { RenderContext } from './renderUtils';
import { seededRandom } from './renderUtils';

export function drawDistortionField(rc: RenderContext, cx: number, cy: number, pheno: CreaturePhenotype) {
  const { ctx, time } = rc;
  const strength = pheno.distortion;
  const radius = rc.w * 0.3;

  ctx.save();
  for (let i = 0; i < 3; i++) {
    const r = radius * (1.2 + i * 0.3);
    const wobble = Math.sin(time * 0.8 + i * 2.1) * strength * 15;
    ctx.beginPath();
    ctx.arc(cx + wobble, cy + wobble * 0.5, r, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(255, 255, 255, ${0.02 * strength})`;
    ctx.lineWidth = 2 + i;
    ctx.stroke();
  }
  ctx.restore();
}

export function drawPhenotypeSpines(rc: RenderContext, cx: number, cy: number, pheno: CreaturePhenotype) {
  const { ctx, time, domainColor, creature } = rc;
  const baseRadius = rc.w * (0.12 + creature.evolution_stage * 0.03);
  const spineCount = pheno.spines;
  const spineScale = pheno.spineScale;
  const rand = seededRandom(creature.appearance_seed + 7777);

  ctx.save();
  for (let i = 0; i < spineCount; i++) {
    const angle = (i / spineCount) * Math.PI * 2 + rand() * 0.3;
    const len = baseRadius * (0.3 + spineScale * 0.7) + Math.sin(time * 1.5 + i) * 3;
    const startR = baseRadius * 0.85;

    const sx = cx + Math.cos(angle) * startR;
    const sy = cy + Math.sin(angle) * startR;
    const ex = cx + Math.cos(angle) * (startR + len);
    const ey = cy + Math.sin(angle) * (startR + len);

    ctx.beginPath();
    ctx.moveTo(sx - Math.sin(angle) * 2, sy + Math.cos(angle) * 2);
    ctx.lineTo(ex, ey);
    ctx.lineTo(sx + Math.sin(angle) * 2, sy - Math.cos(angle) * 2);
    ctx.closePath();

    const grad = ctx.createLinearGradient(sx, sy, ex, ey);
    grad.addColorStop(0, domainColor + '60');
    grad.addColorStop(1, domainColor + '10');
    ctx.fillStyle = grad;
    ctx.fill();
  }
  ctx.restore();
}

export function drawPhenotypePlates(rc: RenderContext, cx: number, cy: number, pheno: CreaturePhenotype) {
  const { ctx, creature, domainColor } = rc;
  const baseRadius = rc.w * (0.12 + creature.evolution_stage * 0.03);
  const plateCount = pheno.plates;
  const metallic = pheno.metallic;
  const rand = seededRandom(creature.appearance_seed + 9999);

  ctx.save();
  for (let i = 0; i < plateCount; i++) {
    const angle = (i / plateCount) * Math.PI * 2 + rand() * 0.4;
    const dist = baseRadius * (0.5 + rand() * 0.4);
    const px = cx + Math.cos(angle) * dist;
    const py = cy + Math.sin(angle) * dist;
    const size = (4 + rand() * 6) * (1 + creature.evolution_stage * 0.2);

    ctx.beginPath();
    const pts = 5 + Math.floor(rand() * 3);
    for (let p = 0; p < pts; p++) {
      const a = (p / pts) * Math.PI * 2;
      const r = size * (0.7 + rand() * 0.3);
      const x = px + Math.cos(a) * r;
      const y = py + Math.sin(a) * r;
      if (p === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();

    const g = ctx.createLinearGradient(px - size, py - size, px + size, py + size);
    const base = metallic > 0.5 ? '#c0c0c0' : '#888888';
    g.addColorStop(0, base + 'cc');
    g.addColorStop(0.5, '#ffffff40');
    g.addColorStop(1, base + '88');
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = domainColor + '30';
    ctx.lineWidth = 0.5;
    ctx.stroke();
  }
  ctx.restore();
}

export function drawPhenotypeParticles(rc: RenderContext, cx: number, cy: number, pheno: CreaturePhenotype) {
  const { ctx, time, domainColor, creature } = rc;
  const baseRadius = rc.w * (0.12 + creature.evolution_stage * 0.03);
  const count = pheno.ambientParticles;
  const auraRadius = baseRadius * (1.5 + pheno.auraRadius);

  ctx.save();
  for (let i = 0; i < count; i++) {
    const angle = time * 0.3 + (i / count) * Math.PI * 2;
    const dist = auraRadius * (0.6 + Math.sin(time * 0.7 + i * 1.3) * 0.4);
    const px = cx + Math.cos(angle) * dist;
    const py = cy + Math.sin(angle) * dist;
    const size = 1 + Math.sin(time * 2 + i * 0.7) * 1;
    const alpha = 0.2 + Math.sin(time + i) * 0.15;

    ctx.beginPath();
    ctx.arc(px, py, Math.max(0.5, size), 0, Math.PI * 2);
    ctx.fillStyle = domainColor + Math.floor(alpha * 255).toString(16).padStart(2, '0');
    ctx.fill();
  }
  ctx.restore();
}
