import type {
  Creature, BodySlot, BodySlotEntry,
} from '../types';
import { DOMAIN_COLORS, EVOLUTION_CONFIGS } from '../types';

// ============================================================
// PROCEDURAL CREATURE RENDERER
// ============================================================

// Seeded random for deterministic rendering
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// Body slot positions (normalized 0-1 space)
const SLOT_POSITIONS: Record<BodySlot, { x: number; y: number }> = {
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

interface RenderContext {
  ctx: CanvasRenderingContext2D;
  w: number;
  h: number;
  time: number;
  creature: Creature;
  domainColor: string;
  rand: () => number;
}

// ============================================================
// FALLBACK PATTERN: Glossy silver/black/gold randomized
// ============================================================

function hexToRgb(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}

function getGlossyColor(rand: () => number): string {
  const palette = [
    '#C0C0C0', '#D4D4D4', '#A8A8A8', // silver
    '#1a1a1a', '#2d2d2d', '#0d0d0d', // black
    '#FFD700', '#DAA520', '#B8860B', // gold
  ];
  return palette[Math.floor(rand() * palette.length)];
}

// ============================================================
// BASE BODY RENDERING
// ============================================================

function drawBaseBody(rc: RenderContext) {
  const { ctx, w, h, time, creature, domainColor, rand } = rc;
  const config = EVOLUTION_CONFIGS[creature.evolution_stage];
  const cx = w / 2;
  const cy = h * 0.45;

  // Scale body based on evolution stage
  const baseRadius = w * (0.12 + creature.evolution_stage * 0.03);
  const bodyPoints = config.bodyPoints;

  // Draw ambient glow
  if (config.ambientType !== 'none') {
    drawAmbient(rc, cx, cy, baseRadius);
  }

  // Draw main body mass — organic blob
  ctx.save();
  ctx.beginPath();

  const points: { x: number; y: number }[] = [];
  for (let i = 0; i < bodyPoints; i++) {
    const angle = (i / bodyPoints) * Math.PI * 2;
    const wobble = Math.sin(time * 2 + i * 0.7) * baseRadius * 0.08;
    const verticalStretch = 1 + Math.sin(angle) * 0.3;
    const r = (baseRadius + wobble) * (0.8 + rand() * 0.4) * verticalStretch;
    points.push({
      x: cx + Math.cos(angle) * r,
      y: cy + Math.sin(angle) * r * 0.9,
    });
  }

  // Smooth curve through points
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 0; i < points.length; i++) {
    const curr = points[i];
    const next = points[(i + 1) % points.length];
    const cpx = (curr.x + next.x) / 2;
    const cpy = (curr.y + next.y) / 2;
    ctx.quadraticCurveTo(curr.x, curr.y, cpx, cpy);
  }
  ctx.closePath();

  // Glossy gradient fill — silver/black/gold
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

  // Domain-colored edge glow
  ctx.strokeStyle = domainColor;
  ctx.lineWidth = 1.5 + creature.evolution_stage * 0.5;
  ctx.shadowColor = domainColor;
  ctx.shadowBlur = 8 + creature.evolution_stage * 4;
  ctx.stroke();
  ctx.restore();

  // Draw tentacles
  drawTentacles(rc, cx, cy, baseRadius, config.tentacles);

  // Draw eyes
  drawEyes(rc, cx, cy, baseRadius, config.eyes);

  // Draw mouths
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
      // Glow
      const grad = ctx.createRadialGradient(cx, cy, radius, cx, cy, radius * 3);
      grad.addColorStop(0, domainColor + '20');
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, rc.w, rc.h);
      // Drips
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
      // Aura
      const grad2 = ctx.createRadialGradient(cx, cy, radius * 0.5, cx, cy, radius * 3.5);
      grad2.addColorStop(0, domainColor + '30');
      grad2.addColorStop(1, 'transparent');
      ctx.fillStyle = grad2;
      ctx.fillRect(0, 0, rc.w, rc.h);
      // Spines
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
      // Full edge glow
      const edgeSize = 20 + Math.sin(time) * 10;
      ctx.shadowColor = domainColor;
      ctx.shadowBlur = edgeSize;
      ctx.strokeStyle = domainColor + '30';
      ctx.lineWidth = edgeSize;
      ctx.strokeRect(-edgeSize / 2, -edgeSize / 2, rc.w + edgeSize, rc.h + edgeSize);
      ctx.shadowBlur = 0;
      // Inner aura
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

    // Eye socket
    ctx.save();
    ctx.beginPath();
    ctx.arc(ex, ey, eyeSize + 1, 0, Math.PI * 2);
    ctx.fillStyle = '#0a0a0a';
    ctx.fill();

    // Iris
    ctx.beginPath();
    ctx.arc(ex, ey, eyeSize, 0, Math.PI * 2);
    const irisGrad = ctx.createRadialGradient(ex, ey, 0, ex, ey, eyeSize);
    irisGrad.addColorStop(0, domainColor);
    irisGrad.addColorStop(0.6, domainColor + '80');
    irisGrad.addColorStop(1, '#000');
    ctx.fillStyle = irisGrad;
    ctx.fill();

    // Pupil — tracks a wandering point
    const pupilAngle = time * 0.8 + i * 1.5;
    const pupilDrift = eyeSize * 0.25;
    const px = ex + Math.cos(pupilAngle) * pupilDrift;
    const py = ey + Math.sin(pupilAngle * 0.7) * pupilDrift;
    ctx.beginPath();
    ctx.arc(px, py, eyeSize * 0.4, 0, Math.PI * 2);
    ctx.fillStyle = '#000';
    ctx.fill();

    // Highlight
    ctx.beginPath();
    ctx.arc(ex - eyeSize * 0.2, ey - eyeSize * 0.2, eyeSize * 0.2, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fill();

    // Glow
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
    // Mouth opening
    ctx.beginPath();
    ctx.ellipse(mx, my, mWidth * 0.5, mWidth * openAmount * 0.3, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#1a0000';
    ctx.fill();

    // Teeth
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

    // Bottom teeth
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

    // Glow inside mouth
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

// ============================================================
// GENE MUTATION RENDERERS
// ============================================================

function renderGeneMutation(rc: RenderContext, slot: BodySlot, entry: BodySlotEntry, index: number) {
  const { ctx, w, h, time, domainColor } = rc;
  const pos = SLOT_POSITIONS[slot];
  const x = pos.x * w;
  const y = pos.y * h;
  const tierScale = entry.tier === 'titan' ? 2.5 : entry.tier === 'hyper' ? 1.8 : entry.tier === 'dense' ? 1.3 : 1;
  const rand = seededRandom(entry.visual_seed);
  const offset = index * 4;

  switch (entry.gene_type) {
    case 'muscle_fiber': drawMuscleFiber(ctx, x + offset, y + offset, tierScale, time, domainColor, rand); break;
    case 'bone_plate': drawBonePlate(ctx, x + offset, y + offset, tierScale, time, rand); break;
    case 'vein_network': drawVeinNetwork(ctx, x + offset, y + offset, tierScale, time, domainColor, rand); break;
    case 'tendon_whip': drawTendonWhip(ctx, x + offset, y + offset, tierScale, time, domainColor, rand); break;
    case 'organ_sac': drawOrganSac(ctx, x + offset, y + offset, tierScale, time, domainColor, rand); break;
    case 'tooth_row': drawToothRow(ctx, x + offset, y + offset, tierScale, time, rand); break;
    case 'eye_cluster': drawEyeCluster(ctx, x + offset, y + offset, tierScale, time, domainColor, rand); break;
    case 'neural_tendril': drawNeuralTendril(ctx, x + offset, y + offset, tierScale, time, domainColor, rand); break;
    case 'skull_graft': drawSkullGraft(ctx, x + offset, y + offset, tierScale, time, rand); break;
    case 'synapse_arc': drawSynapseArc(ctx, x + offset, y + offset, tierScale, time, domainColor, rand); break;
    case 'memory_sac': drawMemorySac(ctx, x + offset, y + offset, tierScale, time, domainColor, rand); break;
    case 'psychic_crown': drawPsychicCrown(ctx, x + offset, y + offset, tierScale, time, domainColor, rand); break;
    case 'chain_link': drawChainLink(ctx, x + offset, y + offset, tierScale, time, domainColor, rand); break;
    case 'iron_plate': drawIronPlate(ctx, x + offset, y + offset, tierScale, time, rand); break;
    case 'lock_core': drawLockCore(ctx, x + offset, y + offset, tierScale, time, domainColor, rand); break;
    case 'ember_node': drawEmberNode(ctx, x + offset, y + offset, tierScale, time, domainColor, rand); break;
    case 'spectral_layer': drawSpectralLayer(ctx, x + offset, y + offset, tierScale, time, domainColor, rand); break;
    case 'wardens_eye': drawWardensEye(ctx, x + offset, y + offset, tierScale, time, domainColor, rand); break;
    case 'gear_assembly': drawGearAssembly(ctx, x + offset, y + offset, tierScale, time, domainColor, rand); break;
    case 'cable_nerve': drawCableNerve(ctx, x + offset, y + offset, tierScale, time, domainColor, rand); break;
    case 'piston_limb': drawPistonLimb(ctx, x + offset, y + offset, tierScale, time, domainColor, rand); break;
    case 'furnace_core': drawFurnaceCore(ctx, x + offset, y + offset, tierScale, time, domainColor, rand); break;
    case 'blueprint_glyph': drawBlueprintGlyph(ctx, x + offset, y + offset, tierScale, time, domainColor, rand); break;
    case 'exhaust_vent': drawExhaustVent(ctx, x + offset, y + offset, tierScale, time, domainColor, rand); break;
    case 'gold_scale': drawGoldScale(ctx, x + offset, y + offset, tierScale, time, rand); break;
    case 'coin_disc': drawCoinDisc(ctx, x + offset, y + offset, tierScale, time, rand); break;
    case 'vault_door': drawVaultDoor(ctx, x + offset, y + offset, tierScale, time, rand); break;
    case 'investment_tendril': drawInvestmentTendril(ctx, x + offset, y + offset, tierScale, time, domainColor, rand); break;
    case 'ledger_glyph': drawLedgerGlyph(ctx, x + offset, y + offset, tierScale, time, domainColor, rand); break;
    case 'crown_jewel': drawCrownJewel(ctx, x + offset, y + offset, tierScale, time, domainColor, rand); break;
    case 'mouth': drawMouthMutation(ctx, x + offset, y + offset, tierScale, time, domainColor, rand); break;
    case 'face_mask': drawFaceMask(ctx, x + offset, y + offset, tierScale, time, rand); break;
    case 'vocal_cord': drawVocalCord(ctx, x + offset, y + offset, tierScale, time, domainColor, rand); break;
    case 'echo_chamber': drawEchoChamber(ctx, x + offset, y + offset, tierScale, time, domainColor, rand); break;
    case 'harmony_thread': drawHarmonyThread(ctx, x + offset, y + offset, tierScale, time, domainColor, rand); break;
    case 'memory_face': drawMemoryFace(ctx, x + offset, y + offset, tierScale, time, domainColor, rand); break;
  }
}

// --- Individual Gene Drawing Functions ---

function drawMuscleFiber(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, time: number, color: string, rand: () => number) {
  const size = (6 + rand() * 4) * scale;
  const pulse = 1 + Math.sin(time * 3 + rand() * 6) * 0.15;
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(x, y, size * pulse, size * 0.6 * pulse, rand() * Math.PI, 0, Math.PI * 2);
  const g = ctx.createRadialGradient(x, y, 0, x, y, size);
  g.addColorStop(0, '#cc3333');
  g.addColorStop(0.7, '#881111');
  g.addColorStop(1, '#440808');
  ctx.fillStyle = g;
  ctx.fill();
  ctx.strokeStyle = color + '40';
  ctx.lineWidth = 0.5;
  ctx.stroke();
  ctx.restore();
}

function drawBonePlate(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, time: number, rand: () => number) {
  const size = (7 + rand() * 3) * scale;
  ctx.save();
  ctx.beginPath();
  const points = 5 + Math.floor(rand() * 3);
  for (let i = 0; i < points; i++) {
    const angle = (i / points) * Math.PI * 2;
    const r = size * (0.8 + rand() * 0.4);
    const px = x + Math.cos(angle) * r;
    const py = y + Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  const g = ctx.createLinearGradient(x - size, y - size, x + size, y + size);
  g.addColorStop(0, '#e8e0d0');
  g.addColorStop(0.5, '#c8b8a0');
  g.addColorStop(1, '#a89878');
  ctx.fillStyle = g;
  ctx.fill();
  ctx.strokeStyle = '#8a7a60';
  ctx.lineWidth = 1;
  ctx.stroke();
  // Crack lines
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + size * (rand() - 0.5), y + size * (rand() - 0.5));
  ctx.strokeStyle = '#6a5a40';
  ctx.lineWidth = 0.5;
  ctx.stroke();
  ctx.restore();
}

function drawVeinNetwork(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, time: number, color: string, rand: () => number) {
  ctx.save();
  const branches = 3 + Math.floor(rand() * 3);
  for (let b = 0; b < branches; b++) {
    const angle = rand() * Math.PI * 2;
    const len = (12 + rand() * 10) * scale;
    ctx.beginPath();
    ctx.moveTo(x, y);
    let px = x, py = y;
    for (let s = 0; s < 4; s++) {
      px += Math.cos(angle + rand() * 0.5) * len * 0.25;
      py += Math.sin(angle + rand() * 0.5) * len * 0.25;
      ctx.lineTo(px, py);
    }
    const pulse = 0.6 + Math.sin(time * 4 + b * 2) * 0.4;
    ctx.strokeStyle = `rgba(200, 30, 30, ${pulse})`;
    ctx.lineWidth = (2 - b * 0.3) * scale;
    ctx.lineCap = 'round';
    ctx.stroke();
  }
  ctx.restore();
}

function drawTendonWhip(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, time: number, color: string, rand: () => number) {
  const len = (15 + rand() * 10) * scale;
  const angle = rand() * Math.PI * 2;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x, y);
  for (let s = 1; s <= 6; s++) {
    const t = s / 6;
    const wave = Math.sin(time * 4 + s * 1.5) * len * 0.12;
    ctx.lineTo(
      x + Math.cos(angle) * len * t + wave,
      y + Math.sin(angle) * len * t
    );
  }
  ctx.strokeStyle = '#cc9966';
  ctx.lineWidth = 2 * scale;
  ctx.lineCap = 'round';
  ctx.stroke();
  ctx.restore();
}

function drawOrganSac(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, time: number, color: string, rand: () => number) {
  const size = (5 + rand() * 3) * scale;
  const pulse = 1 + Math.sin(time * 2 + rand() * 5) * 0.2;
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, size * pulse, 0, Math.PI * 2);
  const g = ctx.createRadialGradient(x - size * 0.2, y - size * 0.2, 0, x, y, size);
  g.addColorStop(0, color + '80');
  g.addColorStop(0.7, color + '40');
  g.addColorStop(1, '#1a0a1a80');
  ctx.fillStyle = g;
  ctx.fill();
  ctx.strokeStyle = color + '60';
  ctx.lineWidth = 0.5;
  ctx.stroke();
  ctx.restore();
}

function drawToothRow(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, time: number, rand: () => number) {
  const count = 3 + Math.floor(rand() * 4);
  ctx.save();
  for (let i = 0; i < count; i++) {
    const tx = x + (i - count / 2) * 4 * scale;
    const len = (4 + rand() * 4) * scale;
    ctx.beginPath();
    ctx.moveTo(tx - 1.5 * scale, y);
    ctx.lineTo(tx, y + len);
    ctx.lineTo(tx + 1.5 * scale, y);
    ctx.closePath();
    ctx.fillStyle = '#e8e0d0';
    ctx.fill();
    ctx.strokeStyle = '#c8b090';
    ctx.lineWidth = 0.5;
    ctx.stroke();
  }
  ctx.restore();
}

function drawEyeCluster(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, time: number, color: string, rand: () => number) {
  const count = 2 + Math.floor(rand() * 2);
  for (let i = 0; i < count; i++) {
    const ex = x + (rand() - 0.5) * 8 * scale;
    const ey = y + (rand() - 0.5) * 6 * scale;
    const size = (2 + rand() * 2) * scale;
    ctx.save();
    ctx.beginPath();
    ctx.arc(ex, ey, size, 0, Math.PI * 2);
    ctx.fillStyle = '#000';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(ex, ey, size * 0.8, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    const pa = time + i;
    ctx.beginPath();
    ctx.arc(ex + Math.cos(pa) * size * 0.2, ey + Math.sin(pa) * size * 0.2, size * 0.35, 0, Math.PI * 2);
    ctx.fillStyle = '#000';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(ex - size * 0.2, ey - size * 0.2, size * 0.15, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.fill();
    ctx.restore();
  }
}

function drawNeuralTendril(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, time: number, color: string, rand: () => number) {
  const len = (10 + rand() * 8) * scale;
  const angle = rand() * Math.PI * 2;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x, y);
  for (let s = 1; s <= 5; s++) {
    const t = s / 5;
    ctx.lineTo(
      x + Math.cos(angle + Math.sin(time * 3 + s) * 0.3) * len * t,
      y + Math.sin(angle + Math.cos(time * 2 + s) * 0.3) * len * t
    );
  }
  const glow = 0.4 + Math.sin(time * 5 + rand() * 6) * 0.3;
  ctx.strokeStyle = color + Math.floor(glow * 255).toString(16).padStart(2, '0');
  ctx.lineWidth = 1.5 * scale;
  ctx.lineCap = 'round';
  ctx.shadowColor = color;
  ctx.shadowBlur = 4;
  ctx.stroke();
  ctx.restore();
}

function drawSkullGraft(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, time: number, rand: () => number) {
  const size = (5 + rand() * 3) * scale;
  ctx.save();
  // Skull shape
  ctx.beginPath();
  ctx.arc(x, y, size, 0, Math.PI * 2);
  ctx.fillStyle = '#d0c8b8';
  ctx.fill();
  // Jaw
  ctx.beginPath();
  ctx.arc(x, y + size * 0.5, size * 0.7, 0, Math.PI);
  ctx.fillStyle = '#c0b8a0';
  ctx.fill();
  // Eye sockets
  ctx.beginPath();
  ctx.arc(x - size * 0.3, y - size * 0.1, size * 0.2, 0, Math.PI * 2);
  ctx.arc(x + size * 0.3, y - size * 0.1, size * 0.2, 0, Math.PI * 2);
  ctx.fillStyle = '#1a1a1a';
  ctx.fill();
  ctx.restore();
}

function drawSynapseArc(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, time: number, color: string, rand: () => number) {
  ctx.save();
  const len = (8 + rand() * 6) * scale;
  const angle = rand() * Math.PI * 2;
  const ex = x + Math.cos(angle) * len;
  const ey = y + Math.sin(angle) * len;
  const flicker = Math.random() > 0.3;
  if (flicker) {
    ctx.beginPath();
    ctx.moveTo(x, y);
    const midX = (x + ex) / 2 + (rand() - 0.5) * 10;
    const midY = (y + ey) / 2 + (rand() - 0.5) * 10;
    ctx.quadraticCurveTo(midX, midY, ex, ey);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1 * scale;
    ctx.shadowColor = color;
    ctx.shadowBlur = 8;
    ctx.stroke();
  }
  ctx.restore();
}

function drawMemorySac(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, time: number, color: string, rand: () => number) {
  drawOrganSac(ctx, x, y, scale, time, color, rand);
}

function drawPsychicCrown(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, time: number, color: string, rand: () => number) {
  const size = (6 + rand() * 4) * scale;
  const float = Math.sin(time * 2) * 3;
  ctx.save();
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const angle = (i / 5) * Math.PI * 2 - Math.PI / 2;
    const r = size * (i % 2 === 0 ? 1 : 0.6);
    const px = x + Math.cos(angle) * r;
    const py = y + float + Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fillStyle = color + '40';
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.shadowColor = color;
  ctx.shadowBlur = 10;
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawChainLink(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, time: number, color: string, rand: () => number) {
  const size = (4 + rand() * 2) * scale;
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(x, y, size, size * 1.5, rand() * Math.PI, 0, Math.PI * 2);
  ctx.strokeStyle = '#8899aa';
  ctx.lineWidth = 2 * scale;
  ctx.stroke();
  // Inner glow
  ctx.strokeStyle = color + '30';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();
}

function drawIronPlate(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, time: number, rand: () => number) {
  const size = (6 + rand() * 4) * scale;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x - size / 2, y - size / 2, size, size * 0.8);
  const g = ctx.createLinearGradient(x - size / 2, y, x + size / 2, y);
  g.addColorStop(0, '#667788');
  g.addColorStop(0.5, '#8899aa');
  g.addColorStop(1, '#556677');
  ctx.fillStyle = g;
  ctx.fill();
  ctx.strokeStyle = '#445566';
  ctx.lineWidth = 1;
  ctx.stroke();
  // Bolts
  ctx.beginPath();
  ctx.arc(x - size * 0.3, y - size * 0.25, 1.5, 0, Math.PI * 2);
  ctx.arc(x + size * 0.3, y - size * 0.25, 1.5, 0, Math.PI * 2);
  ctx.fillStyle = '#334455';
  ctx.fill();
  ctx.restore();
}

function drawLockCore(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, time: number, color: string, rand: () => number) {
  const size = (5 + rand() * 3) * scale;
  ctx.save();
  // Lock body
  ctx.beginPath();
  ctx.arc(x, y, size, 0, Math.PI * 2);
  ctx.fillStyle = '#556677';
  ctx.fill();
  // Keyhole
  ctx.beginPath();
  ctx.arc(x, y - size * 0.15, size * 0.2, 0, Math.PI * 2);
  ctx.fillStyle = color + '80';
  ctx.fill();
  ctx.beginPath();
  ctx.rect(x - size * 0.08, y - size * 0.1, size * 0.16, size * 0.35);
  ctx.fillStyle = color + '80';
  ctx.fill();
  ctx.strokeStyle = '#445566';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(x, y, size, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawEmberNode(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, time: number, color: string, rand: () => number) {
  const size = (3 + rand() * 2) * scale;
  const pulse = 0.5 + Math.sin(time * 4 + rand() * 6) * 0.5;
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, size, 0, Math.PI * 2);
  const g = ctx.createRadialGradient(x, y, 0, x, y, size);
  g.addColorStop(0, '#ffaa33');
  g.addColorStop(0.5, '#ff6600');
  g.addColorStop(1, `rgba(255, 50, 0, ${pulse})`);
  ctx.fillStyle = g;
  ctx.shadowColor = '#ff6600';
  ctx.shadowBlur = 8 * pulse;
  ctx.fill();
  ctx.restore();
}

function drawSpectralLayer(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, time: number, color: string, rand: () => number) {
  const size = (10 + rand() * 5) * scale;
  const alpha = 0.1 + Math.sin(time * 1.5 + rand() * 5) * 0.05;
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, size, 0, Math.PI * 2);
  ctx.fillStyle = color + Math.floor(alpha * 255).toString(16).padStart(2, '0');
  ctx.fill();
  ctx.restore();
}

function drawWardensEye(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, time: number, color: string, rand: () => number) {
  drawEyeCluster(ctx, x, y, scale * 0.8, time, color, rand);
}

function drawGearAssembly(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, time: number, color: string, rand: () => number) {
  const size = (5 + rand() * 3) * scale;
  const teeth = 6 + Math.floor(rand() * 4);
  const rotation = time * 0.5;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.beginPath();
  for (let i = 0; i < teeth * 2; i++) {
    const angle = (i / (teeth * 2)) * Math.PI * 2;
    const r = i % 2 === 0 ? size : size * 0.7;
    const px = Math.cos(angle) * r;
    const py = Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fillStyle = '#778899';
  ctx.fill();
  ctx.strokeStyle = '#556677';
  ctx.lineWidth = 1;
  ctx.stroke();
  // Center hole
  ctx.beginPath();
  ctx.arc(0, 0, size * 0.25, 0, Math.PI * 2);
  ctx.fillStyle = '#1a1a2e';
  ctx.fill();
  ctx.restore();
}

function drawCableNerve(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, time: number, color: string, rand: () => number) {
  drawNeuralTendril(ctx, x, y, scale, time, '#44dd44', rand);
}

function drawPistonLimb(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, time: number, color: string, rand: () => number) {
  const size = (8 + rand() * 4) * scale;
  const extension = Math.sin(time * 3 + rand() * 5) * size * 0.2;
  ctx.save();
  // Cylinder
  ctx.beginPath();
  ctx.rect(x - 3 * scale, y, 6 * scale, size * 0.6 + extension);
  ctx.fillStyle = '#889999';
  ctx.fill();
  ctx.strokeStyle = '#667777';
  ctx.lineWidth = 1;
  ctx.stroke();
  // Piston head
  ctx.beginPath();
  ctx.rect(x - 4 * scale, y + size * 0.6 + extension, 8 * scale, 4 * scale);
  ctx.fillStyle = '#aabbbb';
  ctx.fill();
  ctx.restore();
}

function drawFurnaceCore(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, time: number, color: string, rand: () => number) {
  const size = (6 + rand() * 3) * scale;
  const pulse = 0.5 + Math.sin(time * 3) * 0.3;
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, size, 0, Math.PI * 2);
  const g = ctx.createRadialGradient(x, y, 0, x, y, size);
  g.addColorStop(0, '#ffdd44');
  g.addColorStop(0.5, '#ff6600');
  g.addColorStop(1, '#441100');
  ctx.fillStyle = g;
  ctx.shadowColor = '#ff6600';
  ctx.shadowBlur = 12 * pulse;
  ctx.fill();
  ctx.restore();
}

function drawBlueprintGlyph(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, time: number, color: string, rand: () => number) {
  const size = (6 + rand() * 3) * scale;
  ctx.save();
  ctx.strokeStyle = color + '60';
  ctx.lineWidth = 0.8 * scale;
  // Draw tech lines
  ctx.beginPath();
  ctx.rect(x - size / 2, y - size / 2, size, size);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x - size / 2, y);
  ctx.lineTo(x + size / 2, y);
  ctx.moveTo(x, y - size / 2);
  ctx.lineTo(x, y + size / 2);
  ctx.stroke();
  // Small circle nodes
  ctx.beginPath();
  ctx.arc(x, y, 2 * scale, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();
}

function drawExhaustVent(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, time: number, color: string, rand: () => number) {
  const size = (5 + rand() * 3) * scale;
  ctx.save();
  // Vent grills
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.rect(x - size / 2, y + i * 3 * scale, size, 1.5 * scale);
    ctx.fillStyle = '#556666';
    ctx.fill();
  }
  // Steam
  if (Math.sin(time * 2 + rand() * 5) > 0) {
    for (let p = 0; p < 3; p++) {
      const py = y - (time * 15 + p * 8) % 20;
      const px = x + Math.sin(time + p) * 3;
      ctx.beginPath();
      ctx.arc(px, py, 2 * scale, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(200,200,200,0.2)';
      ctx.fill();
    }
  }
  ctx.restore();
}

function drawGoldScale(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, time: number, rand: () => number) {
  const size = (5 + rand() * 3) * scale;
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(x, y, size, size * 0.6, rand() * 0.5, 0, Math.PI * 2);
  const g = ctx.createLinearGradient(x - size, y, x + size, y);
  g.addColorStop(0, '#DAA520');
  g.addColorStop(0.3, '#FFD700');
  g.addColorStop(0.5, '#FFF8DC');
  g.addColorStop(0.7, '#FFD700');
  g.addColorStop(1, '#B8860B');
  ctx.fillStyle = g;
  ctx.fill();
  ctx.strokeStyle = '#8B6914';
  ctx.lineWidth = 0.5;
  ctx.stroke();
  ctx.restore();
}

function drawCoinDisc(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, time: number, rand: () => number) {
  const size = (4 + rand() * 2) * scale;
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, size, 0, Math.PI * 2);
  const g = ctx.createRadialGradient(x - size * 0.3, y - size * 0.3, 0, x, y, size);
  g.addColorStop(0, '#FFD700');
  g.addColorStop(1, '#B8860B');
  ctx.fillStyle = g;
  ctx.fill();
  ctx.strokeStyle = '#8B6914';
  ctx.lineWidth = 1;
  ctx.stroke();
  // Coin detail
  ctx.beginPath();
  ctx.arc(x, y, size * 0.6, 0, Math.PI * 2);
  ctx.strokeStyle = '#DAA52060';
  ctx.lineWidth = 0.5;
  ctx.stroke();
  ctx.restore();
}

function drawVaultDoor(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, time: number, rand: () => number) {
  drawIronPlate(ctx, x, y, scale * 1.2, time, rand);
}

function drawInvestmentTendril(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, time: number, color: string, rand: () => number) {
  drawTendonWhip(ctx, x, y, scale, time, '#FFD700', rand);
}

function drawLedgerGlyph(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, time: number, color: string, rand: () => number) {
  drawBlueprintGlyph(ctx, x, y, scale, time, '#FFD700', rand);
}

function drawCrownJewel(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, time: number, color: string, rand: () => number) {
  const size = (4 + rand() * 3) * scale;
  const pulse = 0.8 + Math.sin(time * 2) * 0.2;
  ctx.save();
  // Diamond shape
  ctx.beginPath();
  ctx.moveTo(x, y - size);
  ctx.lineTo(x + size * 0.6, y);
  ctx.lineTo(x, y + size * 0.4);
  ctx.lineTo(x - size * 0.6, y);
  ctx.closePath();
  const g = ctx.createLinearGradient(x - size, y - size, x + size, y + size);
  g.addColorStop(0, '#FF69B4');
  g.addColorStop(0.5, '#FF1493');
  g.addColorStop(1, '#C71585');
  ctx.fillStyle = g;
  ctx.shadowColor = '#FF69B4';
  ctx.shadowBlur = 8 * pulse;
  ctx.fill();
  ctx.restore();
}

function drawMouthMutation(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, time: number, color: string, rand: () => number) {
  const size = (5 + rand() * 3) * scale;
  const open = Math.abs(Math.sin(time * 1.5 + rand() * 5)) * 0.5;
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(x, y, size, size * open * 0.4 + 1, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#2a0000';
  ctx.fill();
  ctx.strokeStyle = color + '40';
  ctx.lineWidth = 0.5;
  ctx.stroke();
  ctx.restore();
}

function drawFaceMask(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, time: number, rand: () => number) {
  const size = (6 + rand() * 3) * scale;
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(x, y, size * 0.7, size, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#d0c8b8' + '80';
  ctx.fill();
  // Eyes
  ctx.beginPath();
  ctx.ellipse(x - size * 0.25, y - size * 0.15, size * 0.12, size * 0.08, 0, 0, Math.PI * 2);
  ctx.ellipse(x + size * 0.25, y - size * 0.15, size * 0.12, size * 0.08, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#1a1a1a';
  ctx.fill();
  // Mouth
  ctx.beginPath();
  ctx.arc(x, y + size * 0.2, size * 0.2, 0, Math.PI);
  ctx.strokeStyle = '#1a1a1a';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();
}

function drawVocalCord(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, time: number, color: string, rand: () => number) {
  const len = (10 + rand() * 8) * scale;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x, y);
  for (let i = 1; i <= 8; i++) {
    const t = i / 8;
    const vibrate = Math.sin(time * 8 + i * 2) * 3 * scale;
    ctx.lineTo(x + vibrate, y + len * t);
  }
  ctx.strokeStyle = color + '60';
  ctx.lineWidth = 1.5 * scale;
  ctx.stroke();
  ctx.restore();
}

function drawEchoChamber(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, time: number, color: string, rand: () => number) {
  const size = (5 + rand() * 3) * scale;
  ctx.save();
  for (let r = 0; r < 3; r++) {
    const radius = size * (0.5 + r * 0.4);
    const alpha = 0.3 - r * 0.08;
    ctx.beginPath();
    ctx.arc(x, y, radius + Math.sin(time * 2 + r) * 2, 0, Math.PI * 2);
    ctx.strokeStyle = color + Math.floor(alpha * 255).toString(16).padStart(2, '0');
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  ctx.restore();
}

function drawHarmonyThread(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, time: number, color: string, rand: () => number) {
  drawNeuralTendril(ctx, x, y, scale, time, color, rand);
}

function drawMemoryFace(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, time: number, color: string, rand: () => number) {
  drawFaceMask(ctx, x, y, scale * 0.8, time, rand);
}

// ============================================================
// MAIN RENDER FUNCTION
// ============================================================

export function renderCreature(
  ctx: CanvasRenderingContext2D,
  creature: Creature,
  width: number,
  height: number,
  time: number,
) {
  const domainColor = DOMAIN_COLORS[creature.domain];
  const rand = seededRandom(creature.appearance_seed);

  // Clear
  ctx.clearRect(0, 0, width, height);

  const rc: RenderContext = { ctx, w: width, h: height, time, creature, domainColor, rand };

  // 1. Draw base body
  drawBaseBody(rc);

  // 2. Draw gene mutations
  for (const [slotName, entries] of Object.entries(creature.body_slots)) {
    if (!entries || entries.length === 0) continue;
    for (let i = 0; i < entries.length; i++) {
      renderGeneMutation(rc, slotName as BodySlot, entries[i], i);
    }
  }
}
