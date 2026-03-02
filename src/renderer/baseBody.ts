// ============================================================
// BASE BODY RENDERING — Core body, ambient, tentacles, eyes, mouths
// ============================================================

import { EVOLUTION_CONFIGS } from '../types';
import type { RenderContext } from './renderUtils';
import { hexToRgb, getGlossyColor } from './renderUtils';

type CreatureSignature = {
  radius: number;
  stretchX: number;
  stretchY: number;
  lobeAmp: number;
  lobeFreq: number;
  skew: number;
  notchAmp: number;
  notchAngle: number;
  tentacleBias: number;
  tentacleArc: number;
  tentacleOffset: number;
  eyeBias: number;
  eyeArc: number;
  eyeVerticalBias: number;
  mouthBias: number;
  mouthYOffset: number;
  mouthSpread: number;
  hueBias: number;
  accent: 'maw' | 'weaver' | 'chain' | 'engine' | 'gilt' | 'hollow';
};

const CREATURE_SIGNATURES = {
  gore_maw: {
    radius: 1.08, stretchX: 1.18, stretchY: 1.0, lobeAmp: 0.11, lobeFreq: 1.8, skew: -0.14,
    notchAmp: 0.08, notchAngle: Math.PI * 0.55, tentacleBias: 1.1, tentacleArc: 0.6, tentacleOffset: 0,
    eyeBias: 0.85, eyeArc: 0.62, eyeVerticalBias: -0.1, mouthBias: 1.3, mouthYOffset: 0.12, mouthSpread: 0.85,
    hueBias: 6, accent: 'maw',
  },
  mind_weaver: {
    radius: 0.94, stretchX: 0.86, stretchY: 1.36, lobeAmp: 0.07, lobeFreq: 2.4, skew: 0.05,
    notchAmp: 0.05, notchAngle: -Math.PI * 0.45, tentacleBias: 1.0, tentacleArc: 0.72, tentacleOffset: -Math.PI / 2,
    eyeBias: 1.42, eyeArc: 1.0, eyeVerticalBias: -0.2, mouthBias: 0.72, mouthYOffset: 0.02, mouthSpread: 0.5,
    hueBias: -8, accent: 'weaver',
  },
  chain_wraith: {
    radius: 0.98, stretchX: 1.15, stretchY: 1.18, lobeAmp: 0.13, lobeFreq: 2.9, skew: 0.16,
    notchAmp: 0.12, notchAngle: Math.PI * 0.1, tentacleBias: 1.3, tentacleArc: 0.48, tentacleOffset: Math.PI * 0.06,
    eyeBias: 0.9, eyeArc: 0.56, eyeVerticalBias: -0.08, mouthBias: 0.8, mouthYOffset: 0.07, mouthSpread: 0.74,
    hueBias: 10, accent: 'chain',
  },
  rot_engine: {
    radius: 1.1, stretchX: 1.0, stretchY: 1.02, lobeAmp: 0.16, lobeFreq: 3.5, skew: -0.08,
    notchAmp: 0.16, notchAngle: Math.PI * 0.88, tentacleBias: 0.92, tentacleArc: 0.38, tentacleOffset: Math.PI,
    eyeBias: 0.84, eyeArc: 0.45, eyeVerticalBias: -0.02, mouthBias: 1.08, mouthYOffset: 0.2, mouthSpread: 0.9,
    hueBias: 14, accent: 'engine',
  },
  gilt_horror: {
    radius: 1.03, stretchX: 1.08, stretchY: 0.95, lobeAmp: 0.09, lobeFreq: 2.2, skew: -0.02,
    notchAmp: 0.06, notchAngle: Math.PI * 1.5, tentacleBias: 0.95, tentacleArc: 0.5, tentacleOffset: 0,
    eyeBias: 1.02, eyeArc: 0.66, eyeVerticalBias: -0.15, mouthBias: 0.95, mouthYOffset: 0.09, mouthSpread: 0.64,
    hueBias: 24, accent: 'gilt',
  },
  hollow_singer: {
    radius: 0.95, stretchX: 0.84, stretchY: 1.34, lobeAmp: 0.1, lobeFreq: 2.7, skew: 0.1,
    notchAmp: 0.18, notchAngle: -Math.PI / 2, tentacleBias: 1.08, tentacleArc: 0.7, tentacleOffset: -Math.PI / 2,
    eyeBias: 1.2, eyeArc: 0.92, eyeVerticalBias: -0.18, mouthBias: 1.06, mouthYOffset: 0.03, mouthSpread: 0.54,
    hueBias: -14, accent: 'hollow',
  },
} as const satisfies Record<string, CreatureSignature>;

export function drawBaseBody(rc: RenderContext) {
  const { ctx, w, h, time, creature, domainColor, rand, phenotype } = rc;
  const config = EVOLUTION_CONFIGS[creature.evolution_stage];
  const signature = CREATURE_SIGNATURES[creature.id];
  const cx = w / 2;
  const cy = h * 0.45;

  const radiusMult = phenotype ? phenotype.bodyRadiusMultiplier : 1;
  const baseRadius = Math.min(w, h) * (0.2 + creature.evolution_stage * 0.04) * radiusMult * signature.radius;
  const bodyPoints = phenotype ? phenotype.bodyPointCount : config.bodyPoints;

  if (config.ambientType !== 'none' || (phenotype && phenotype.auraRadius > 0.3)) {
    drawAmbient(rc, cx, cy, baseRadius);
  }

  ctx.save();
  ctx.beginPath();

  const wobbleAmp = phenotype ? phenotype.bodyWobbleAmplitude : 0.08;
  const vStretch = (phenotype ? phenotype.bodyVerticalStretch : 1.2) * signature.stretchY;
  const asymmetry = phenotype ? phenotype.bodyWobbleAmplitude * 2 : 0;

  const points: { x: number; y: number }[] = [];
  for (let i = 0; i < bodyPoints; i++) {
    const angle = (i / bodyPoints) * Math.PI * 2;
    const wobble = Math.sin(time * 2 + i * 0.7) * baseRadius * wobbleAmp;
    const verticalStretch = 1 + Math.sin(angle) * (vStretch - 1);
    const asymOffset = Math.sin(angle * 2 + i) * baseRadius * asymmetry;
    const lobeWarp = 1 + Math.sin(angle * signature.lobeFreq + time * 0.18) * signature.lobeAmp;
    const notchInfluence = Math.max(0, Math.cos(angle - signature.notchAngle));
    const notchWarp = 1 - notchInfluence * signature.notchAmp;
    const r = (baseRadius + wobble + asymOffset) * (0.82 + rand() * 0.33) * verticalStretch * lobeWarp * notchWarp;
    const skewOffset = Math.sin(angle * 1.4) * baseRadius * signature.skew;
    points.push({
      x: cx + Math.cos(angle) * r * signature.stretchX + skewOffset,
      y: cy + Math.sin(angle) * r * 0.88 * signature.stretchY,
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

  const finalColor = resolveBodyColor(domainColor, signature.hueBias, phenotype, rand);
  const [r, g, b] = hexToRgb(finalColor);
  const glossy = getGlossyColor(rand);
  const [gr, gg, gb] = hexToRgb(glossy);
  const mix = 0.24;
  const mr = Math.round(r * (1 - mix) + gr * mix);
  const mg = Math.round(g * (1 - mix) + gg * mix);
  const mb = Math.round(b * (1 - mix) + gb * mix);

  const grad = ctx.createRadialGradient(
    cx - baseRadius * 0.3, cy - baseRadius * 0.3, baseRadius * 0.1,
    cx, cy, baseRadius * 1.5
  );
  grad.addColorStop(0, `rgba(${Math.min(255, mr + 66)}, ${Math.min(255, mg + 66)}, ${Math.min(255, mb + 66)}, 0.95)`);
  grad.addColorStop(0.4, `rgba(${mr}, ${mg}, ${mb}, 0.92)`);
  grad.addColorStop(1, `rgba(${Math.max(0, mr - 42)}, ${Math.max(0, mg - 42)}, ${Math.max(0, mb - 42)}, 0.86)`);

  ctx.fillStyle = grad;
  ctx.fill();

  ctx.strokeStyle = domainColor;
  ctx.lineWidth = 1.5 + creature.evolution_stage * 0.5;
  ctx.shadowColor = domainColor;
  ctx.shadowBlur = 8 + creature.evolution_stage * 4;
  ctx.stroke();
  drawSignatureAccent(rc, cx, cy, baseRadius, signature);
  ctx.restore();

  const tentacleCount = Math.max(
    1,
    Math.round((phenotype ? phenotype.tentacleCount : config.tentacles) * signature.tentacleBias),
  );
  drawTentacles(
    rc,
    cx,
    cy,
    baseRadius,
    tentacleCount,
    phenotype?.tentacleBaseLength ?? 1,
    phenotype?.tentacleWidth ?? 1,
    signature,
  );

  const eyeCount = Math.max(1, Math.round((phenotype ? phenotype.eyeCount : config.eyes) * signature.eyeBias));
  drawEyes(
    rc,
    cx,
    cy,
    baseRadius,
    eyeCount,
    phenotype?.eyeSpreadAngle ?? 1,
    phenotype?.eyeBaseSize ?? 1,
    signature,
  );

  const mouthCount = Math.max(
    0,
    Math.round((phenotype ? phenotype.mouthCount : config.mouths) * signature.mouthBias),
  );
  if (mouthCount > 0) {
    drawMouths(rc, cx, cy, baseRadius, mouthCount, phenotype?.mouthScale ?? 1, signature);
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

function drawTentacles(
  rc: RenderContext,
  cx: number,
  cy: number,
  bodyRadius: number,
  count: number,
  lengthFactor: number,
  widthFactor: number,
  signature: CreatureSignature,
) {
  const { ctx, time, domainColor, rand } = rc;
  ctx.save();

  const span = Math.PI * 2 * signature.tentacleArc;
  const startAngle = signature.tentacleOffset - span / 2;
  for (let i = 0; i < count; i++) {
    const baseAngle = startAngle + ((i + 0.5) / count) * span + (rand() - 0.5) * 0.28;
    const len = bodyRadius * (0.4 + rand() * 0.8) * lengthFactor;
    const segments = 6;

    ctx.beginPath();
    let px = cx + Math.cos(baseAngle) * bodyRadius * 0.7;
    let py = cy + Math.sin(baseAngle) * bodyRadius * 0.7;
    ctx.moveTo(px, py);

    for (let s = 1; s <= segments; s++) {
      const t = s / segments;
      const wave = Math.sin(time * (2.6 + signature.tentacleArc) + i * 2 + s * 0.8) * len * 0.15;
      px = cx + Math.cos(baseAngle) * (bodyRadius * 0.7 + len * t) + wave;
      py = cy + Math.sin(baseAngle) * (bodyRadius * 0.7 + len * t) + Math.cos(time * 2 + i) * len * 0.1;
      ctx.lineTo(px, py);
    }

    ctx.strokeStyle = domainColor + '70';
    ctx.lineWidth = Math.max(0.9, (3 - (2 / segments) * count * 0.1) * widthFactor * 0.36);
    ctx.lineCap = 'round';
    ctx.stroke();
  }
  ctx.restore();
}

function drawEyes(
  rc: RenderContext,
  cx: number,
  cy: number,
  bodyRadius: number,
  count: number,
  spreadAngle: number,
  eyeScale: number,
  signature: CreatureSignature,
) {
  const { ctx, time, domainColor, rand } = rc;

  const span = Math.PI * (0.45 + spreadAngle * 0.5) * signature.eyeArc;
  const start = -Math.PI / 2 - span / 2;
  for (let i = 0; i < count; i++) {
    const ratio = count === 1 ? 0.5 : i / (count - 1);
    const angle = start + span * ratio;
    const dist = bodyRadius * (0.2 + rand() * 0.4);
    const ex = cx + Math.cos(angle) * dist;
    const ey = cy + bodyRadius * signature.eyeVerticalBias + Math.sin(angle) * dist * 0.4;
    const eyeSize = (2.5 + rand() * 3 + rc.creature.evolution_stage * 0.5) * (0.7 + eyeScale * 0.28);

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

function drawMouths(
  rc: RenderContext,
  cx: number,
  cy: number,
  bodyRadius: number,
  count: number,
  mouthScaleFactor: number,
  signature: CreatureSignature,
) {
  const { ctx, time, domainColor, rand } = rc;

  for (let i = 0; i < count; i++) {
    const mx = cx + (rand() - 0.5) * bodyRadius * 0.6 * signature.mouthSpread;
    const my = cy + bodyRadius * (0.15 + i * 0.2 + signature.mouthYOffset);
    const mWidth = bodyRadius * (0.22 + rand() * 0.25) * (0.8 + mouthScaleFactor * 0.45);
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

function drawSignatureAccent(
  rc: RenderContext,
  cx: number,
  cy: number,
  bodyRadius: number,
  signature: CreatureSignature,
) {
  const { ctx, time, domainColor } = rc;

  switch (signature.accent) {
    case 'maw': {
      ctx.beginPath();
      ctx.arc(cx + bodyRadius * 0.08, cy + bodyRadius * 0.32, bodyRadius * 0.26, 0.15, Math.PI - 0.05, false);
      ctx.strokeStyle = domainColor + '88';
      ctx.lineWidth = Math.max(1.2, bodyRadius * 0.08);
      ctx.stroke();
      break;
    }
    case 'weaver': {
      ctx.beginPath();
      ctx.ellipse(cx, cy - bodyRadius * 0.08, bodyRadius * 0.42, bodyRadius * 0.18, time * 0.25, 0, Math.PI * 2);
      ctx.strokeStyle = domainColor + '70';
      ctx.lineWidth = Math.max(1.1, bodyRadius * 0.04);
      ctx.stroke();
      break;
    }
    case 'chain': {
      const links = 4;
      for (let i = 0; i < links; i++) {
        const lx = cx + bodyRadius * (0.26 + i * 0.14);
        const ly = cy + bodyRadius * (0.15 + Math.sin(time * 1.3 + i) * 0.05);
        ctx.beginPath();
        ctx.ellipse(lx, ly, bodyRadius * 0.08, bodyRadius * 0.05, 0.2, 0, Math.PI * 2);
        ctx.strokeStyle = domainColor + '72';
        ctx.lineWidth = Math.max(1, bodyRadius * 0.03);
        ctx.stroke();
      }
      break;
    }
    case 'engine': {
      for (let i = 0; i < 3; i++) {
        const vx = cx - bodyRadius * 0.24 + i * bodyRadius * 0.16;
        const vy = cy + bodyRadius * 0.28;
        ctx.beginPath();
        ctx.moveTo(vx, vy);
        ctx.lineTo(vx + bodyRadius * 0.08, vy + bodyRadius * 0.1 + Math.sin(time * 3 + i) * bodyRadius * 0.04);
        ctx.strokeStyle = domainColor + '80';
        ctx.lineWidth = Math.max(1, bodyRadius * 0.035);
        ctx.stroke();
      }
      break;
    }
    case 'gilt': {
      for (let i = -1; i <= 1; i++) {
        const sx = cx + i * bodyRadius * 0.12;
        const sy = cy - bodyRadius * 0.42;
        ctx.beginPath();
        ctx.moveTo(sx, sy + bodyRadius * 0.06);
        ctx.lineTo(sx + bodyRadius * 0.04 * i, sy - bodyRadius * 0.06);
        ctx.lineTo(sx + bodyRadius * 0.08 * i, sy + bodyRadius * 0.06);
        ctx.strokeStyle = domainColor + '86';
        ctx.lineWidth = Math.max(1, bodyRadius * 0.03);
        ctx.stroke();
      }
      break;
    }
    case 'hollow': {
      ctx.beginPath();
      ctx.arc(cx, cy + bodyRadius * 0.02, bodyRadius * 0.19, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(3, 6, 18, 0.95)';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cx, cy + bodyRadius * 0.02, bodyRadius * 0.22, 0, Math.PI * 2);
      ctx.strokeStyle = domainColor + '80';
      ctx.lineWidth = Math.max(1.1, bodyRadius * 0.04);
      ctx.stroke();
      break;
    }
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  switch (max) {
    case rn: h = (gn - bn) / d + (gn < bn ? 6 : 0); break;
    case gn: h = (bn - rn) / d + 2; break;
    default: h = (rn - gn) / d + 4; break;
  }
  h /= 6;
  return [h * 360, s, l];
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const hue = ((h % 360) + 360) % 360 / 360;
  if (s === 0) {
    const gray = Math.round(l * 255);
    return [gray, gray, gray];
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const f = (t: number) => {
    let tt = t;
    if (tt < 0) tt += 1;
    if (tt > 1) tt -= 1;
    if (tt < 1 / 6) return p + (q - p) * 6 * tt;
    if (tt < 1 / 2) return q;
    if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
    return p;
  };
  return [Math.round(f(hue + 1 / 3) * 255), Math.round(f(hue) * 255), Math.round(f(hue - 1 / 3) * 255)];
}

function resolveBodyColor(
  domainColor: string,
  hueBias: number,
  phenotype: RenderContext['phenotype'],
  rand: () => number,
): string {
  const [r, g, b] = hexToRgb(domainColor);
  const [h, s, l] = rgbToHsl(r, g, b);
  const hueRotation = phenotype?.hueRotation ?? 0;
  const satMult = phenotype?.saturationMult ?? 1;
  const contrastMult = phenotype?.contrastMult ?? 1;
  const jitter = (rand() - 0.5) * 6;
  const nextH = h + hueRotation + hueBias + jitter;
  const nextS = clamp(s * satMult, 0.18, 0.95);
  const nextL = clamp((l - 0.05) * (0.9 + (contrastMult - 1) * 0.4), 0.2, 0.72);
  const [rr, gg, bb] = hslToRgb(nextH, nextS, nextL);
  return `#${rr.toString(16).padStart(2, '0')}${gg.toString(16).padStart(2, '0')}${bb.toString(16).padStart(2, '0')}`;
}
