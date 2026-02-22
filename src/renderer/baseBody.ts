// ============================================================
// BASE BODY RENDERING — Core body, ambient, tentacles, eyes, mouths
// ============================================================

import { EVOLUTION_CONFIGS } from '../types';
import type { RenderContext } from './renderUtils';
import { hexToRgb, getGlossyColor } from './renderUtils';

export function drawBaseBody(rc: RenderContext) {
  const { ctx, w, h, time, creature, domainColor, rand, phenotype } = rc;
  const config = EVOLUTION_CONFIGS[creature.evolution_stage];
  const cx = w / 2;
  const cy = h * 0.45;

  const radiusMult = phenotype ? phenotype.bodyRadiusMultiplier : 1;
  const baseRadius = w * (0.12 + creature.evolution_stage * 0.03) * radiusMult;
  const bodyPoints = phenotype ? phenotype.bodyPointCount : config.bodyPoints;

  if (config.ambientType !== 'none' || (phenotype && phenotype.auraRadius > 0.3)) {
    drawAmbient(rc, cx, cy, baseRadius);
  }

  ctx.save();
  ctx.beginPath();

  const wobbleAmp = phenotype ? phenotype.bodyWobbleAmplitude : 0.08;
  const vStretch = phenotype ? phenotype.bodyVerticalStretch : 1.3;
  const asymmetry = phenotype ? phenotype.bodyWobbleAmplitude * 2 : 0;

  const points: { x: number; y: number }[] = [];
  for (let i = 0; i < bodyPoints; i++) {
    const angle = (i / bodyPoints) * Math.PI * 2;
    const wobble = Math.sin(time * 2 + i * 0.7) * baseRadius * wobbleAmp;
    const verticalStretch = 1 + Math.sin(angle) * (vStretch - 1);
    const asymOffset = Math.sin(angle * 2 + i) * baseRadius * asymmetry;
    const r = (baseRadius + wobble + asymOffset) * (0.8 + rand() * 0.4) * verticalStretch;
    points.push({
      x: cx + Math.cos(angle) * r,
      y: cy + Math.sin(angle) * r * 0.9,
    });
  }

  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 0; i < points.length; i++) {
    const curr = points[i];
    const next = points[(i + 1) % points.length];
    const cpx = (curr.x + next.x) / 2;
    const cpy = (curr.y + next.y) / 2;
    ctx.quadraticCurveTo(curr.x, curr.y, cpx, cpy);
  }
  ctx.closePath();

  const grad = ctx.createRadialGradient(
    cx - baseRadius * 0.3, cy - baseRadius * 0.3, baseRadius * 0.1,
    cx, cy, baseRadius * 1.5
  );
  const baseColor = getGlossyColor(rand);
  const [r, g, b] = hexToRgb(baseColor);
  grad.addColorStop(0, `rgba(${Math.min(255, r + 60)}, ${Math.min(255, g + 60)}, ${Math.min(255, b + 60)}, 0.95)`);
  grad.addColorStop(0.4, `rgba(${r}, ${g}, ${b}, 0.9)`);
  grad.addColorStop(1, `rgba(${Math.max(0, r - 40)}, ${Math.max(0, g - 40)}, ${Math.max(0, b - 40)}, 0.85)`);

  ctx.fillStyle = grad;
  ctx.fill();

  ctx.strokeStyle = domainColor;
  ctx.lineWidth = 1.5 + creature.evolution_stage * 0.5;
  ctx.shadowColor = domainColor;
  ctx.shadowBlur = 8 + creature.evolution_stage * 4;
  ctx.stroke();
  ctx.restore();

  const tentacleCount = phenotype ? phenotype.tentacleCount : config.tentacles;
  drawTentacles(rc, cx, cy, baseRadius, tentacleCount);

  const eyeCount = phenotype ? phenotype.eyeCount : config.eyes;
  drawEyes(rc, cx, cy, baseRadius, eyeCount);

  if (config.mouths > 0) {
    drawMouths(rc, cx, cy, baseRadius, config.mouths);
  }
}

function drawAmbient(rc: RenderContext, cx: number, cy: number, radius: number) {
  const { ctx, time, creature, domainColor } = rc;
  const config = EVOLUTION_CONFIGS[creature.evolution_stage];

  ctx.save();
  switch (config.ambientType) {
    case 'faint_glow': {
      const grad = ctx.createRadialGradient(cx, cy, radius * 0.5, cx, cy, radius * 2.5);
      grad.addColorStop(0, domainColor + '15');
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, rc.w, rc.h);
      break;
    }
    case 'particles': {
      for (let i = 0; i < 12; i++) {
        const angle = time * 0.5 + (i / 12) * Math.PI * 2;
        const dist = radius * 1.5 + Math.sin(time + i) * radius * 0.5;
        const px = cx + Math.cos(angle) * dist;
        const py = cy + Math.sin(angle) * dist;
        const size = 1.5 + Math.sin(time * 2 + i) * 1;
        ctx.beginPath();
        ctx.arc(px, py, size, 0, Math.PI * 2);
        ctx.fillStyle = domainColor + '60';
        ctx.fill();
      }
      break;
    }
    case 'glow_drips': {
      const grad = ctx.createRadialGradient(cx, cy, radius, cx, cy, radius * 3);
      grad.addColorStop(0, domainColor + '20');
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, rc.w, rc.h);
      for (let i = 0; i < 6; i++) {
        const dx = cx + (rc.rand() - 0.5) * radius * 2;
        const dripY = cy + radius + ((time * 30 + i * 40) % (radius * 2));
        ctx.beginPath();
        ctx.arc(dx, dripY, 2, 0, Math.PI * 2);
        ctx.fillStyle = domainColor + '40';
        ctx.fill();
      }
      break;
    }
    case 'aura_spines': {
      const grad2 = ctx.createRadialGradient(cx, cy, radius * 0.5, cx, cy, radius * 3.5);
      grad2.addColorStop(0, domainColor + '30');
      grad2.addColorStop(1, 'transparent');
      ctx.fillStyle = grad2;
      ctx.fillRect(0, 0, rc.w, rc.h);
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2 + time * 0.2;
        const len = radius * (1.5 + Math.sin(time + i * 0.8) * 0.5);
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(angle) * radius * 0.8, cy + Math.sin(angle) * radius * 0.8);
        ctx.lineTo(cx + Math.cos(angle) * len, cy + Math.sin(angle) * len);
        ctx.strokeStyle = domainColor + '50';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      break;
    }
    case 'screen_bleed': {
      const edgeSize = 20 + Math.sin(time) * 10;
      ctx.shadowColor = domainColor;
      ctx.shadowBlur = edgeSize;
      ctx.strokeStyle = domainColor + '30';
      ctx.lineWidth = edgeSize;
      ctx.strokeRect(-edgeSize / 2, -edgeSize / 2, rc.w + edgeSize, rc.h + edgeSize);
      ctx.shadowBlur = 0;
      const grad3 = ctx.createRadialGradient(cx, cy, radius, cx, cy, radius * 4);
      grad3.addColorStop(0, domainColor + '35');
      grad3.addColorStop(1, 'transparent');
      ctx.fillStyle = grad3;
      ctx.fillRect(0, 0, rc.w, rc.h);
      break;
    }
  }
  ctx.restore();
}

function drawTentacles(rc: RenderContext, cx: number, cy: number, bodyRadius: number, count: number) {
  const { ctx, time, domainColor, rand } = rc;
  ctx.save();

  for (let i = 0; i < count; i++) {
    const baseAngle = (i / count) * Math.PI * 2 + rand() * 0.5;
    const len = bodyRadius * (0.6 + rand() * 0.8);
    const segments = 6;

    ctx.beginPath();
    let px = cx + Math.cos(baseAngle) * bodyRadius * 0.7;
    let py = cy + Math.sin(baseAngle) * bodyRadius * 0.7;
    ctx.moveTo(px, py);

    for (let s = 1; s <= segments; s++) {
      const t = s / segments;
      const wave = Math.sin(time * 3 + i * 2 + s * 0.8) * len * 0.15;
      px = cx + Math.cos(baseAngle) * (bodyRadius * 0.7 + len * t) + wave;
      py = cy + Math.sin(baseAngle) * (bodyRadius * 0.7 + len * t) + Math.cos(time * 2 + i) * len * 0.1;
      ctx.lineTo(px, py);
    }

    ctx.strokeStyle = domainColor + '70';
    ctx.lineWidth = 3 - (2 / segments) * count * 0.1;
    ctx.lineCap = 'round';
    ctx.stroke();
  }
  ctx.restore();
}

function drawEyes(rc: RenderContext, cx: number, cy: number, bodyRadius: number, count: number) {
  const { ctx, time, domainColor, rand } = rc;

  for (let i = 0; i < count; i++) {
    const angle = (i / Math.max(count, 1)) * Math.PI * 1.2 - Math.PI * 0.6;
    const dist = bodyRadius * (0.2 + rand() * 0.4);
    const ex = cx + Math.cos(angle) * dist;
    const ey = cy - bodyRadius * 0.1 + Math.sin(angle) * dist * 0.4;
    const eyeSize = 3 + rand() * 3 + rc.creature.evolution_stage * 0.5;

    ctx.save();
    ctx.beginPath();
    ctx.arc(ex, ey, eyeSize + 1, 0, Math.PI * 2);
    ctx.fillStyle = '#0a0a0a';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(ex, ey, eyeSize, 0, Math.PI * 2);
    const irisGrad = ctx.createRadialGradient(ex, ey, 0, ex, ey, eyeSize);
    irisGrad.addColorStop(0, domainColor);
    irisGrad.addColorStop(0.6, domainColor + '80');
    irisGrad.addColorStop(1, '#000');
    ctx.fillStyle = irisGrad;
    ctx.fill();

    const pupilAngle = time * 0.8 + i * 1.5;
    const pupilDrift = eyeSize * 0.25;
    const px = ex + Math.cos(pupilAngle) * pupilDrift;
    const py = ey + Math.sin(pupilAngle * 0.7) * pupilDrift;
    ctx.beginPath();
    ctx.arc(px, py, eyeSize * 0.4, 0, Math.PI * 2);
    ctx.fillStyle = '#000';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(ex - eyeSize * 0.2, ey - eyeSize * 0.2, eyeSize * 0.2, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fill();

    ctx.shadowColor = domainColor;
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.arc(ex, ey, eyeSize * 0.5, 0, Math.PI * 2);
    ctx.fillStyle = 'transparent';
    ctx.fill();
    ctx.restore();
  }
}

function drawMouths(rc: RenderContext, cx: number, cy: number, bodyRadius: number, count: number) {
  const { ctx, time, domainColor, rand } = rc;

  for (let i = 0; i < count; i++) {
    const mx = cx + (rand() - 0.5) * bodyRadius * 0.6;
    const my = cy + bodyRadius * (0.15 + i * 0.2);
    const mWidth = bodyRadius * (0.3 + rand() * 0.2);
    const openAmount = Math.abs(Math.sin(time * 1.5 + i * 2)) * 0.4 + 0.1;

    ctx.save();
    ctx.beginPath();
    ctx.ellipse(mx, my, mWidth * 0.5, mWidth * openAmount * 0.3, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#1a0000';
    ctx.fill();

    const teethCount = 4 + Math.floor(rand() * 4);
    for (let t = 0; t < teethCount; t++) {
      const tAngle = (t / teethCount) * Math.PI;
      const tx = mx + Math.cos(tAngle) * mWidth * 0.4;
      const ty = my - mWidth * openAmount * 0.2;
      const toothLen = mWidth * 0.08 + rand() * mWidth * 0.05;

      ctx.beginPath();
      ctx.moveTo(tx - 1, ty);
      ctx.lineTo(tx, ty + toothLen);
      ctx.lineTo(tx + 1, ty);
      ctx.fillStyle = '#d4d4d4';
      ctx.fill();
    }

    for (let t = 0; t < teethCount - 1; t++) {
      const tAngle = (t / (teethCount - 1)) * Math.PI;
      const tx = mx + Math.cos(tAngle) * mWidth * 0.35;
      const ty = my + mWidth * openAmount * 0.2;
      const toothLen = mWidth * 0.06 + rand() * mWidth * 0.04;

      ctx.beginPath();
      ctx.moveTo(tx - 1, ty);
      ctx.lineTo(tx, ty - toothLen);
      ctx.lineTo(tx + 1, ty);
      ctx.fillStyle = '#c0c0c0';
      ctx.fill();
    }

    const mGrad = ctx.createRadialGradient(mx, my, 0, mx, my, mWidth * 0.3);
    mGrad.addColorStop(0, domainColor + '30');
    mGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = mGrad;
    ctx.beginPath();
    ctx.ellipse(mx, my, mWidth * 0.3, mWidth * openAmount * 0.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}
